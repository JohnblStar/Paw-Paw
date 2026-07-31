import asyncio
import re
from calendar import monthrange
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from app.core.database import get_database
from app.models.pet import PetOut
from app.core.deps import get_current_user
from typing import Literal
from app.models.weight import WeightOut
from app.models.medication import MedicationOut
from app.models.schedule import ScheduleOut
from app.models.breed_guide import BreedGuideOut
from app.services import prompts
from app.services.hai_gpt import HaiGptError, call_json

router = APIRouter(prefix="/api/v1/pets", tags=["pets"])

def _to_datetime(d: date) -> datetime:
    return datetime(d.year, d.month, d.day, tzinfo=timezone.utc)

async def _get_owned_pet(db, petId: str, user_id: str) -> dict:
    pet = await db.pets.find_one({"_id": ObjectId(petId), "ownerId": ObjectId(user_id)})
    if pet is None:
        raise HTTPException(status_code=404, detail="Pet not found")
    return pet

class DailyWeight(BaseModel):
    date: date
    weight: float | None

@router.get("/{petId}/weights/monthly", response_model=list[DailyWeight])
async def get_monthly_weights(
    petId: str, month: str = Query(..., pattern=r"^\d{4}-\d{2}$"), user_id: str = Depends(get_current_user)
):
    year, mon = (int(part) for part in month.split("-"))
    _, last_day = monthrange(year, mon)
    month_start = date(year, mon, 1)

    db = get_database()
    await _get_owned_pet(db, petId, user_id)
    cursor = db.weights.find(
        {"petId": ObjectId(petId), "date": {"$lte": _to_datetime(date(year, mon, last_day))}}
    ).sort("date", 1)
    entries = {doc["date"].date(): doc["value"] async for doc in cursor}

    today = date.today()
    last_value = None
    result = []
    for offset in range(last_day):
        day = month_start + timedelta(days=offset)
        if day > today:
            break
        if day in entries:
            last_value = entries[day]
        result.append(DailyWeight(date=day, weight=last_value))
    return result

class MedicationToday(BaseModel):
    id: str
    name: str
    alertTimes: list[str] = []
    taken: bool

@router.get("/{petId}/medications/today", response_model=list[MedicationToday])
async def get_today_medications(petId: str, user_id: str = Depends(get_current_user)):
    db = get_database()
    await _get_owned_pet(db, petId, user_id)
    today = date.today()
    cursor = db.medications.find({"petId": ObjectId(petId)})
    return [
        MedicationToday(
            id=str(doc["_id"]),
            name=doc["title"],
            alertTimes=doc.get("alertTimes", []),
            taken=today in {d.date() for d in doc.get("completedDates", [])},
        )
        async for doc in cursor
    ]

class DayMedicationSummary(BaseModel):
    date: date
    taken: int
    total: int

@router.get("/{petId}/medications/calendar", response_model=list[DayMedicationSummary])
async def get_medications_calendar(
    petId: str, month: str = Query(..., pattern=r"^\d{4}-\d{2}$"), user_id: str = Depends(get_current_user)
):
    year, mon = (int(part) for part in month.split("-"))
    _, last_day = monthrange(year, mon)

    db = get_database()
    await _get_owned_pet(db, petId, user_id)
    medications = [doc async for doc in db.medications.find({"petId": ObjectId(petId)})]
    total = len(medications)

    completed_counts = defaultdict(int)
    for med in medications:
        for completed_date in med.get("completedDates", []):
            if completed_date.year == year and completed_date.month == mon:
                completed_counts[completed_date.day] += 1

    return [
        DayMedicationSummary(date=date(year, mon, day), taken=completed_counts[day], total=total)
        for day in range(1, last_day + 1)
    ]

@router.patch("/{petId}/medications/{medicationId}/check", response_model=MedicationToday)
async def toggle_medication_check(petId: str, medicationId: str, user_id: str = Depends(get_current_user)):
    db = get_database()
    await _get_owned_pet(db, petId, user_id)
    today_dt = _to_datetime(date.today())
    medications = db.medications

    pulled = await medications.update_one(
        {"_id": ObjectId(medicationId), "petId": ObjectId(petId)},
        {"$pull": {"completedDates": today_dt}},
    )
    if pulled.modified_count:
        taken = False
    else:
        await medications.update_one(
            {"_id": ObjectId(medicationId), "petId": ObjectId(petId)},
            {"$addToSet": {"completedDates": today_dt}},
        )
        taken = True

    doc = await medications.find_one({"_id": ObjectId(medicationId)})
    return MedicationToday(
        id=str(doc["_id"]), name=doc["title"], alertTimes=doc.get("alertTimes", []), taken=taken
    )

ALERT_TIME_PATTERN = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")

def _validate_alert_times(value: list[str]) -> list[str]:
    if not 1 <= len(value) <= 3:
        raise ValueError("알림시간은 1~3개여야 합니다")
    if not all(ALERT_TIME_PATTERN.match(t) for t in value):
        raise ValueError("알림시간은 HH:mm 형식이어야 합니다")
    return value

class MedicationCreate(BaseModel):
    title: str = Field(min_length=1)
    frequencyPerDay: int = Field(ge=1, le=5)
    alertTimes: list[str]

    @field_validator("alertTimes")
    @classmethod
    def validate_alert_times(cls, value: list[str]) -> list[str]:
        return _validate_alert_times(value)

class MedicationUpdate(BaseModel):
    title: str = Field(min_length=1)
    alertTimes: list[str]

    @field_validator("alertTimes")
    @classmethod
    def validate_alert_times(cls, value: list[str]) -> list[str]:
        return _validate_alert_times(value)

@router.post("/{petId}/medications", response_model=MedicationOut, status_code=201)
async def create_medication(petId: str, body: MedicationCreate, user_id: str = Depends(get_current_user)):
    db = get_database()
    await _get_owned_pet(db, petId, user_id)

    doc = {
        "petId": ObjectId(petId),
        "title": body.title,
        "frequencyPerDay": body.frequencyPerDay,
        "alertTimes": body.alertTimes,
        "completedDates": [],
    }
    result = await db.medications.insert_one(doc)
    doc["_id"] = result.inserted_id
    return MedicationOut.from_mongo(doc)

@router.patch("/{petId}/medications/{medicationId}", response_model=MedicationOut)
async def update_medication(
    petId: str, medicationId: str, body: MedicationUpdate, user_id: str = Depends(get_current_user)
):
    db = get_database()
    await _get_owned_pet(db, petId, user_id)

    doc = await db.medications.find_one_and_update(
        {"_id": ObjectId(medicationId), "petId": ObjectId(petId)},
        {"$set": {"title": body.title, "alertTimes": body.alertTimes}},
        return_document=True,
    )
    if doc is None:
        raise HTTPException(status_code=404, detail="Medication not found")
    return MedicationOut.from_mongo(doc)

@router.delete("/{petId}/medications/{medicationId}", status_code=204)
async def delete_medication(petId: str, medicationId: str, user_id: str = Depends(get_current_user)):
    db = get_database()
    await _get_owned_pet(db, petId, user_id)

    result = await db.medications.delete_one({"_id": ObjectId(medicationId), "petId": ObjectId(petId)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Medication not found")

class ScheduleDDay(BaseModel):
    name: str
    date: date
    dDay: int

async def get_upcoming_schedule_dday(petId: str) -> ScheduleDDay | None:
    db = get_database()
    today = date.today()
    doc = await db.schedules.find_one(
        {"petId": ObjectId(petId), "date": {"$gte": _to_datetime(today)}},
        sort=[("date", 1)],
    )
    if doc is None:
        return None
    schedule_date = doc["date"].date()
    return ScheduleDDay(name=doc["title"], date=schedule_date, dDay=(schedule_date - today).days)

class ScheduleItem(BaseModel):
    id: str
    name: str
    date: date

class DashboardOut(BaseModel):
    pet: PetOut
    weights: list[DailyWeight]
    medicationsToday: list[MedicationToday]
    upcomingSchedule: ScheduleDDay | None
    schedules: list[ScheduleItem]

@router.get("/{petId}/dashboard", response_model=DashboardOut)
async def get_dashboard(petId: str, user_id: str = Depends(get_current_user)):
    db = get_database()
    pet_doc = await _get_owned_pet(db, petId, user_id)

    current_month = date.today().strftime("%Y-%m")
    weights, medications_today, upcoming_schedule, schedules = await asyncio.gather(
        get_monthly_weights(petId, current_month, user_id),
        get_today_medications(petId, user_id),
        get_upcoming_schedule_dday(petId),
        get_all_schedules(petId),
    )

    latest_weight = await db.weights.find_one({"petId": ObjectId(petId)}, sort=[("date", -1)])
    if latest_weight is not None:
        pet_doc["weight"] = latest_weight["value"]
    return DashboardOut(
        pet=PetOut.from_mongo(pet_doc),
        weights=weights[-5:],
        medicationsToday=medications_today,
        upcomingSchedule=upcoming_schedule,
        schedules=schedules,
    )

class PetCreate(BaseModel):
    name: str
    species: Literal["dog", "cat"]
    breed: str | None = None
    birthDate: date
    sex: Literal["female", "male"]
    neutered: bool
    weight: float
    photoKey: str

@router.post("", response_model=PetOut, status_code=201)
async def create_pet(body: PetCreate, user_id: str = Depends(get_current_user)):
    db = get_database()
    doc = {
        "ownerId": ObjectId(user_id),
        "name": body.name,
        "species": body.species,
        "breed": body.breed,
        "birthDate": _to_datetime(body.birthDate),
        "sex": body.sex,
        "neutered": body.neutered,
        "weight": body.weight,
        "photoKey": body.photoKey,
        "managedConditions": [],
        "healthNotes": [],
    }
    result = await db.pets.insert_one(doc)
    doc["_id"] = result.inserted_id

    # 아직 활성 펫이 없는 유저(첫 펫 등록)라면 자동으로 활성 펫으로 지정한다.
    # 프론트는 펫이 1개뿐이면 이미 활성으로 취급해 "부르기" 버튼을 보여주지 않으므로,
    # 이 자동 지정 없이는 /chat/query(활성 펫 기준)가 영원히 404를 내게 된다.
    await db.users.update_one(
        {"_id": ObjectId(user_id), "activePetId": {"$exists": False}},
        {"$set": {"activePetId": result.inserted_id}},
    )

    return PetOut.from_mongo(doc)

@router.patch("/{petId}", response_model=PetOut)
async def update_pet(petId: str, body: PetCreate, user_id: str = Depends(get_current_user)):
    db = get_database()
    update = {
        "name": body.name,
        "species": body.species,
        "breed": body.breed,
        "birthDate": _to_datetime(body.birthDate),
        "sex": body.sex,
        "neutered": body.neutered,
        "weight": body.weight,
        "photoKey": body.photoKey,
    }
    doc = await db.pets.find_one_and_update(
        {"_id": ObjectId(petId), "ownerId": ObjectId(user_id)},
        {"$set": update},
        return_document=True,
    )
    if doc is None:
        raise HTTPException(status_code=404, detail="Pet not found")
    return PetOut.from_mongo(doc)

@router.delete("/{petId}", status_code=204)
async def delete_pet(petId: str, user_id: str = Depends(get_current_user)):
    db = get_database()
    result = await db.pets.delete_one({"_id": ObjectId(petId), "ownerId": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pet not found")

    # 삭제한 펫이 활성 펫이었다면, 다른 펫으로 넘겨주거나(없으면 비워서)
    # activePetId가 이미 사라진 펫을 계속 가리키는 상태를 방지한다.
    user = await db.users.find_one({"_id": ObjectId(user_id), "activePetId": ObjectId(petId)})
    if user is not None:
        remaining_pet = await db.pets.find_one({"ownerId": ObjectId(user_id)})
        if remaining_pet is not None:
            await db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"activePetId": remaining_pet["_id"]}},
            )
        else:
            await db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$unset": {"activePetId": ""}},
            )

class WeightCreate(BaseModel):
    date: date
    weight: float

@router.get("/{petId}/weights", response_model=list[WeightOut])
async def get_weight_entries(petId: str, user_id: str = Depends(get_current_user)):
    db = get_database()
    await _get_owned_pet(db, petId, user_id)
    cursor = db.weights.find({"petId": ObjectId(petId)}).sort("date", -1)
    return [WeightOut.from_mongo(doc) async for doc in cursor]

@router.post("/{petId}/weights", response_model=WeightOut, status_code=201)
async def create_weight_entry(petId: str, body: WeightCreate, user_id: str = Depends(get_current_user)):
    db = get_database()
    await _get_owned_pet(db, petId, user_id)

    doc = await db.weights.find_one_and_update(
        {"petId": ObjectId(petId), "date": _to_datetime(body.date)},
        {"$set": {"value": body.weight}},
        upsert=True,
        return_document=True,
    )
    return WeightOut.from_mongo(doc)

@router.patch("/{petId}/weights/{weightId}", response_model=WeightOut)
async def update_weight_entry(petId: str, weightId: str, body: WeightCreate, user_id: str = Depends(get_current_user)):
    db = get_database()
    await _get_owned_pet(db, petId, user_id)

    doc = await db.weights.find_one_and_update(
        {"_id": ObjectId(weightId), "petId": ObjectId(petId)},
        {"$set": {"date": _to_datetime(body.date), "value": body.weight}},
        return_document=True,
    )
    if doc is None:
        raise HTTPException(status_code=404, detail="Weight entry not found")
    return WeightOut.from_mongo(doc)

@router.delete("/{petId}/weights/{weightId}", status_code=204)
async def delete_weight_entry(petId: str, weightId: str, user_id: str = Depends(get_current_user)):
    db = get_database()
    await _get_owned_pet(db, petId, user_id)

    result = await db.weights.delete_one({"_id": ObjectId(weightId), "petId": ObjectId(petId)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Weight entry not found")

async def get_all_schedules(petId: str) -> list[ScheduleItem]:
    db = get_database()
    cursor = db.schedules.find(
        {"petId": ObjectId(petId), "date": {"$gte": _to_datetime(date.today())}}
    ).sort("date", 1)

    return [
        ScheduleItem(id=str(doc["_id"]), name=doc["title"], date=doc["date"].date())
        async for doc in cursor
    ]

class ScheduleCreate(BaseModel):
    title: str = Field(min_length=1)
    date: date

@router.post("/{petId}/schedules", response_model=ScheduleOut, status_code=201)
async def create_schedule(petId: str, body: ScheduleCreate, user_id: str = Depends(get_current_user)):
    db = get_database()
    await _get_owned_pet(db, petId, user_id)

    doc = {
        "petId": ObjectId(petId),
        "title": body.title,
        "date": _to_datetime(body.date),
    }
    result = await db.schedules.insert_one(doc)
    doc["_id"] = result.inserted_id
    return ScheduleOut.from_mongo(doc)

@router.patch("/{petId}/schedules/{scheduleId}", response_model=ScheduleOut)
async def update_schedule(
    petId: str, scheduleId: str, body: ScheduleCreate, user_id: str = Depends(get_current_user)
):
    db = get_database()
    await _get_owned_pet(db, petId, user_id)

    doc = await db.schedules.find_one_and_update(
        {"_id": ObjectId(scheduleId), "petId": ObjectId(petId)},
        {"$set": {"title": body.title, "date": _to_datetime(body.date)}},
        return_document=True,
    )
    if doc is None:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return ScheduleOut.from_mongo(doc)

@router.delete("/{petId}/schedules/{scheduleId}", status_code=204)
async def delete_schedule(petId: str, scheduleId: str, user_id: str = Depends(get_current_user)):
    db = get_database()
    await _get_owned_pet(db, petId, user_id)

    result = await db.schedules.delete_one({"_id": ObjectId(scheduleId), "petId": ObjectId(petId)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Schedule not found")

class BreedGuideRequest(BaseModel):
    rawBreedInput: str = Field(min_length=1)

@router.post("/{petId}/ai-breed", response_model=BreedGuideOut)
async def generate_breed_guide(petId: str, body: BreedGuideRequest, user_id: str = Depends(get_current_user)):
    db = get_database()
    await _get_owned_pet(db, petId, user_id)

    raw_input = body.rawBreedInput.strip()
    cached = await db.breedGuides.find_one({"$or": [{"breed": raw_input}, {"rawInputAliases": raw_input}]})
    if cached:
        return BreedGuideOut.from_mongo(cached)

    try:
        result = await call_json(prompts.BREED_GUIDE_SYSTEM_PROMPT, raw_input, max_tokens=400)
    except HaiGptError:
        raise HTTPException(
            status_code=503, detail="AI 품종 정보 생성이 일시적으로 제한됩니다. 잠시 후 다시 시도해 주세요."
        )

    breed = (result.get("breed") or raw_input).strip()
    doc = await db.breedGuides.find_one_and_update(
        {"breed": breed},
        {
            "$set": {
                "trainingTip": result.get("trainingTip", ""),
                "chronicDiseases": result.get("chronicDiseases", ""),
                "specialCare": result.get("specialCare"),
            },
            "$addToSet": {"rawInputAliases": raw_input},
        },
        upsert=True,
        return_document=True,
    )
    return BreedGuideOut.from_mongo(doc)
