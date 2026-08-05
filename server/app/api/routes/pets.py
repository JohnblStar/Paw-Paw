import asyncio
import re
from calendar import monthrange
from collections import defaultdict
from datetime import date, timedelta
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator, model_validator
from app.core.database import get_database
from app.core.pet_helpers import get_owned_pet, is_medication_active, today_kst, today_slots, to_datetime
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
    await get_owned_pet(db, petId, user_id)
    cursor = db.weights.find(
        {"petId": ObjectId(petId), "date": {"$lte": to_datetime(date(year, mon, last_day))}}
    ).sort("date", 1)
    entries = {doc["date"].date(): doc["value"] async for doc in cursor}

    today = today_kst()
    prior_dates = [d for d in entries if d < month_start]
    last_value = entries[max(prior_dates)] if prior_dates else None
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
    frequencyPerDay: int
    takenSlots: list[bool]
    taken: bool
    startDate: date
    endDate: date | None = None

@router.get("/{petId}/medications/today", response_model=list[MedicationToday])
async def get_today_medications(petId: str, user_id: str = Depends(get_current_user)):
    db = get_database()
    await get_owned_pet(db, petId, user_id)
    today = today_kst()
    cursor = db.medications.find({"petId": ObjectId(petId)})
    result = []
    async for doc in cursor:
        if not is_medication_active(doc, today):
            continue
        slots = today_slots(doc, today)
        result.append(
            MedicationToday(
                id=str(doc["_id"]),
                name=doc["title"],
                alertTimes=doc.get("alertTimes", []),
                frequencyPerDay=doc["frequencyPerDay"],
                takenSlots=slots,
                taken=all(slots) if slots else False,
                startDate=doc["startDate"].date(),
                endDate=doc["endDate"].date() if doc.get("endDate") else None,
            )
        )
    return result

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
    month_start = date(year, mon, 1)

    db = get_database()
    await get_owned_pet(db, petId, user_id)
    medications = [doc async for doc in db.medications.find({"petId": ObjectId(petId)})]

    taken_counts = defaultdict(int)
    for med in medications:
        for entry in med.get("doseLog", []):
            entry_date = entry["date"].date()
            if entry_date.year == year and entry_date.month == mon and is_medication_active(med, entry_date):
                taken_counts[entry_date.day] += sum(1 for slot in entry.get("slots", []) if slot)

    today = today_kst()
    result = []
    for offset in range(last_day):
        day = month_start + timedelta(days=offset)
        if day > today:
            break
        total = sum(med["frequencyPerDay"] for med in medications if is_medication_active(med, day))
        if total == 0:
            continue
        result.append(DayMedicationSummary(date=day, taken=taken_counts[day.day], total=total))
    return result

@router.patch("/{petId}/medications/{medicationId}/check", response_model=MedicationToday)
async def toggle_medication_check(
    petId: str, medicationId: str, slotIndex: int = Query(..., ge=0), user_id: str = Depends(get_current_user)
):
    db = get_database()
    await get_owned_pet(db, petId, user_id)
    medications = db.medications
    today = today_kst()
    today_dt = to_datetime(today)

    doc = await medications.find_one({"_id": ObjectId(medicationId), "petId": ObjectId(petId)})
    if doc is None:
        raise HTTPException(status_code=404, detail="Medication not found")
    freq = doc["frequencyPerDay"]
    if slotIndex >= freq:
        raise HTTPException(status_code=400, detail="유효하지 않은 복약 회차입니다")

    slots = today_slots(doc, today)
    slots[slotIndex] = not slots[slotIndex]
    has_today_entry = any(entry["date"].date() == today for entry in doc.get("doseLog", []))

    if has_today_entry:
        await medications.update_one(
            {"_id": ObjectId(medicationId), "petId": ObjectId(petId), "doseLog.date": today_dt},
            {"$set": {"doseLog.$.slots": slots}},
        )
    else:
        await medications.update_one(
            {"_id": ObjectId(medicationId), "petId": ObjectId(petId)},
            {"$push": {"doseLog": {"date": today_dt, "slots": slots}}},
        )

    return MedicationToday(
        id=str(doc["_id"]),
        name=doc["title"],
        alertTimes=doc.get("alertTimes", []),
        frequencyPerDay=freq,
        takenSlots=slots,
        taken=all(slots),
    )

ALERT_TIME_PATTERN = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")

def _validate_alert_times(value: list[str]) -> list[str]:
    if not 1 <= len(value) <= 3:
        raise ValueError("알림시간은 1~3개여야 합니다")
    if not all(ALERT_TIME_PATTERN.match(t) for t in value):
        raise ValueError("알림시간은 HH:mm 형식이어야 합니다")
    return value

def _validate_period(start_date: date, end_date: date | None) -> None:
    if end_date is not None and end_date < start_date:
        raise ValueError("종료일은 시작일 이후여야 합니다")

class MedicationCreate(BaseModel):
    title: str = Field(min_length=1)
    frequencyPerDay: int = Field(ge=1, le=5)
    alertTimes: list[str]
    startDate: date
    endDate: date | None = None

    @field_validator("alertTimes")
    @classmethod
    def validate_alert_times(cls, value: list[str]) -> list[str]:
        return _validate_alert_times(value)

    @model_validator(mode="after")
    def validate_period(self) -> "MedicationCreate":
        _validate_period(self.startDate, self.endDate)
        return self

class MedicationUpdate(BaseModel):
    title: str = Field(min_length=1)
    alertTimes: list[str]
    startDate: date
    endDate: date | None = None

    @field_validator("alertTimes")
    @classmethod
    def validate_alert_times(cls, value: list[str]) -> list[str]:
        return _validate_alert_times(value)

    @model_validator(mode="after")
    def validate_period(self) -> "MedicationUpdate":
        _validate_period(self.startDate, self.endDate)
        return self

@router.post("/{petId}/medications", response_model=MedicationOut, status_code=201)
async def create_medication(petId: str, body: MedicationCreate, user_id: str = Depends(get_current_user)):
    db = get_database()
    await get_owned_pet(db, petId, user_id)

    doc = {
        "petId": ObjectId(petId),
        "title": body.title,
        "frequencyPerDay": body.frequencyPerDay,
        "alertTimes": body.alertTimes,
        "startDate": to_datetime(body.startDate),
        "endDate": to_datetime(body.endDate) if body.endDate else None,
        "doseLog": [],
    }
    result = await db.medications.insert_one(doc)
    doc["_id"] = result.inserted_id
    return MedicationOut.from_mongo(doc)

@router.patch("/{petId}/medications/{medicationId}", response_model=MedicationOut)
async def update_medication(
    petId: str, medicationId: str, body: MedicationUpdate, user_id: str = Depends(get_current_user)
):
    db = get_database()
    await get_owned_pet(db, petId, user_id)

    doc = await db.medications.find_one_and_update(
        {"_id": ObjectId(medicationId), "petId": ObjectId(petId)},
        {
            "$set": {
                "title": body.title,
                "alertTimes": body.alertTimes,
                "startDate": to_datetime(body.startDate),
                "endDate": to_datetime(body.endDate) if body.endDate else None,
            }
        },
        return_document=True,
    )
    if doc is None:
        raise HTTPException(status_code=404, detail="Medication not found")
    return MedicationOut.from_mongo(doc)

@router.delete("/{petId}/medications/{medicationId}", status_code=204)
async def delete_medication(petId: str, medicationId: str, user_id: str = Depends(get_current_user)):
    db = get_database()
    await get_owned_pet(db, petId, user_id)

    result = await db.medications.delete_one({"_id": ObjectId(medicationId), "petId": ObjectId(petId)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Medication not found")

class ScheduleDDay(BaseModel):
    name: str
    date: date
    dDay: int

async def get_upcoming_schedule_dday(petId: str) -> ScheduleDDay | None:
    db = get_database()
    today = today_kst()
    doc = await db.schedules.find_one(
        {"petId": ObjectId(petId), "date": {"$gte": to_datetime(today)}},
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
    pet_doc = await get_owned_pet(db, petId, user_id)

    today = today_kst()
    window_start = today - timedelta(days=4)
    medications_today, upcoming_schedule, schedules = await asyncio.gather(
        get_today_medications(petId, user_id),
        get_upcoming_schedule_dday(petId),
        get_all_schedules(petId),
    )

    cursor = db.weights.find(
        {"petId": ObjectId(petId), "date": {"$lte": to_datetime(today)}}
    ).sort("date", 1)
    entries = {doc["date"].date(): doc["value"] async for doc in cursor}
    prior_dates = [d for d in entries if d < window_start]
    last_value = entries[max(prior_dates)] if prior_dates else None
    weights = []
    for offset in range(5):
        day = window_start + timedelta(days=offset)
        if day in entries:
            last_value = entries[day]
        weights.append(DailyWeight(date=day, weight=last_value))

    latest_weight = await db.weights.find_one({"petId": ObjectId(petId)}, sort=[("date", -1)])
    if latest_weight is not None:
        pet_doc["weight"] = latest_weight["value"]
    return DashboardOut(
        pet=PetOut.from_mongo(pet_doc),
        weights=weights,
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
        "birthDate": to_datetime(body.birthDate),
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
        "birthDate": to_datetime(body.birthDate),
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

class HealthNoteUpdate(BaseModel):
    bodyPart: str = Field(min_length=1)
    note: str = Field(min_length=1)

@router.patch("/{petId}/health-notes/{noteId}", response_model=PetOut)
async def update_health_note(
    petId: str, noteId: str, body: HealthNoteUpdate, user_id: str = Depends(get_current_user)
):
    db = get_database()
    await get_owned_pet(db, petId, user_id)

    result = await db.pets.update_one(
        {"_id": ObjectId(petId), "healthNotes.id": noteId},
        {"$set": {"healthNotes.$.bodyPart": body.bodyPart, "healthNotes.$.note": body.note}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Health note not found")

    doc = await db.pets.find_one({"_id": ObjectId(petId)})
    return PetOut.from_mongo(doc)

@router.delete("/{petId}/health-notes/{noteId}", response_model=PetOut)
async def delete_health_note(petId: str, noteId: str, user_id: str = Depends(get_current_user)):
    db = get_database()
    await get_owned_pet(db, petId, user_id)

    await db.pets.update_one(
        {"_id": ObjectId(petId)},
        {"$pull": {"healthNotes": {"id": noteId}}},
    )
    doc = await db.pets.find_one({"_id": ObjectId(petId)})
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
    await get_owned_pet(db, petId, user_id)
    cursor = db.weights.find({"petId": ObjectId(petId)}).sort("date", -1)
    return [WeightOut.from_mongo(doc) async for doc in cursor]

@router.post("/{petId}/weights", response_model=WeightOut, status_code=201)
async def create_weight_entry(petId: str, body: WeightCreate, user_id: str = Depends(get_current_user)):
    db = get_database()
    await get_owned_pet(db, petId, user_id)

    doc = await db.weights.find_one_and_update(
        {"petId": ObjectId(petId), "date": to_datetime(body.date)},
        {"$set": {"value": body.weight}},
        upsert=True,
        return_document=True,
    )
    return WeightOut.from_mongo(doc)

@router.patch("/{petId}/weights/{weightId}", response_model=WeightOut)
async def update_weight_entry(petId: str, weightId: str, body: WeightCreate, user_id: str = Depends(get_current_user)):
    db = get_database()
    await get_owned_pet(db, petId, user_id)

    doc = await db.weights.find_one_and_update(
        {"_id": ObjectId(weightId), "petId": ObjectId(petId)},
        {"$set": {"date": to_datetime(body.date), "value": body.weight}},
        return_document=True,
    )
    if doc is None:
        raise HTTPException(status_code=404, detail="Weight entry not found")
    return WeightOut.from_mongo(doc)

@router.delete("/{petId}/weights/{weightId}", status_code=204)
async def delete_weight_entry(petId: str, weightId: str, user_id: str = Depends(get_current_user)):
    db = get_database()
    await get_owned_pet(db, petId, user_id)

    result = await db.weights.delete_one({"_id": ObjectId(weightId), "petId": ObjectId(petId)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Weight entry not found")

async def get_all_schedules(petId: str) -> list[ScheduleItem]:
    db = get_database()
    cursor = db.schedules.find(
        {"petId": ObjectId(petId), "date": {"$gte": to_datetime(today_kst())}}
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
    await get_owned_pet(db, petId, user_id)

    doc = {
        "petId": ObjectId(petId),
        "title": body.title,
        "date": to_datetime(body.date),
    }
    result = await db.schedules.insert_one(doc)
    doc["_id"] = result.inserted_id
    return ScheduleOut.from_mongo(doc)

@router.patch("/{petId}/schedules/{scheduleId}", response_model=ScheduleOut)
async def update_schedule(
    petId: str, scheduleId: str, body: ScheduleCreate, user_id: str = Depends(get_current_user)
):
    db = get_database()
    await get_owned_pet(db, petId, user_id)

    doc = await db.schedules.find_one_and_update(
        {"_id": ObjectId(scheduleId), "petId": ObjectId(petId)},
        {"$set": {"title": body.title, "date": to_datetime(body.date)}},
        return_document=True,
    )
    if doc is None:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return ScheduleOut.from_mongo(doc)

@router.delete("/{petId}/schedules/{scheduleId}", status_code=204)
async def delete_schedule(petId: str, scheduleId: str, user_id: str = Depends(get_current_user)):
    db = get_database()
    await get_owned_pet(db, petId, user_id)

    result = await db.schedules.delete_one({"_id": ObjectId(scheduleId), "petId": ObjectId(petId)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Schedule not found")

class BreedGuideRequest(BaseModel):
    rawBreedInput: str = Field(min_length=1)

@router.post("/{petId}/ai-breed", response_model=BreedGuideOut)
async def generate_breed_guide(petId: str, body: BreedGuideRequest, user_id: str = Depends(get_current_user)):
    db = get_database()
    await get_owned_pet(db, petId, user_id)

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
