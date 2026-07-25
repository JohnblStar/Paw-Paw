from calendar import monthrange
from datetime import date, timedelta
from bson import ObjectId
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from app.core.database import get_database
from collections import defaultdict
import asyncio
from app.models.pet import PetOut

router = APIRouter(prefix="/api/v1/pets", tags=["pets"])

class DailyWeight(BaseModel):
    date: date
    value: float | None

@router.get("/{petId}/weights/monthly", response_model=list[DailyWeight])
async def get_monthly_weights(petId: str, month: str = Query(..., pattern=r"^\d{4}-\d{2}$")):
    year, mon = (int(part) for part in month.split("-"))
    _, last_day = monthrange(year, mon)
    month_start = date(year, mon, 1)

    db = get_database()
    cursor = db.weights.find(
        {"petId": ObjectId(petId), "date": {"$lte": date(year, mon, last_day)}}
    ).sort("date", 1)
    entries = {doc["date"]: doc["value"] async for doc in cursor}

    last_value = None
    result = []
    for offset in range(last_day):
        day = month_start + timedelta(days=offset)
        if day in entries:
            last_value = entries[day]
        result.append(DailyWeight(date=day, value=last_value))
    return result

class MedicationToday(BaseModel):
    id: str
    title: str
    checked: bool

@router.get("/{petId}/medications/today", response_model=list[MedicationToday])
async def get_today_medications(petId: str):
    db = get_database()
    today = date.today()
    cursor = db.medications.find({"petId": ObjectId(petId)})
    return [
        MedicationToday(
            id=str(doc["_id"]),
            title=doc["title"],
            checked=today in doc.get("completedDates", []),
        )
        async for doc in cursor
    ]

class DayMedicationSummary(BaseModel):
    date: date
    completed: int
    total: int

@router.get("/{petId}/medications/calendar", response_model=list[DayMedicationSummary])
async def get_medications_calendar(petId: str, month: str = Query(..., pattern=r"^\d{4}-\d{2}$")):
    year, mon = (int(part) for part in month.split("-"))
    _, last_day = monthrange(year, mon)

    db = get_database()
    medications = [doc async for doc in db.medications.find({"petId": ObjectId(petId)})]
    total = len(medications)

    completed_counts = defaultdict(int)
    for med in medications:
        for completed_date in med.get("completedDates", []):
            if completed_date.year == year and completed_date.month == mon:
                completed_counts[completed_date.day] += 1

    return [
        DayMedicationSummary(date=date(year, mon, day), completed=completed_counts[day], total=total)
        for day in range(1, last_day + 1)
    ]

@router.patch("/{petId}/medications/{medicationId}/check", response_model=MedicationToday)
async def toggle_medication_check(petId: str, medicationId: str):
    db = get_database()
    today = date.today()
    medications = db.medications

    pulled = await medications.update_one(
        {"_id": ObjectId(medicationId), "petId": ObjectId(petId)},
        {"$pull": {"completedDates": today}},
    )
    if pulled.modified_count:
        checked = False
    else:
        await medications.update_one(
            {"_id": ObjectId(medicationId), "petId": ObjectId(petId)},
            {"$addToSet": {"completedDates": today}},
        )
        checked = True

    doc = await medications.find_one({"_id": ObjectId(medicationId)})
    return MedicationToday(id=str(doc["_id"]), title=doc["title"], checked=checked)

class ScheduleDDay(BaseModel):
    title: str
    date: date
    dDay: int

async def get_upcoming_schedule_dday(petId: str) -> ScheduleDDay | None:
    db = get_database()
    today = date.today()
    doc = await db.schedules.find_one(
        {"petId": ObjectId(petId), "date": {"$gte": today}},
        sort=[("date", 1)],
    )
    if doc is None:
        return None
    return ScheduleDDay(title=doc["title"], date=doc["date"], dDay=(doc["date"] - today).days)

class DashboardOut(BaseModel):
    pet: PetOut
    weights: list[DailyWeight]
    medicationsToday: list[MedicationToday]
    upcomingSchedule: ScheduleDDay | None

@router.get("/{petId}/dashboard", response_model=DashboardOut)
async def get_dashboard(petId: str):
    db = get_database()
    pet_doc = await db.pets.find_one({"_id": ObjectId(petId)})
    if pet_doc is None:
        raise HTTPException(status_code=404, detail="Pet not found")

    current_month = date.today().strftime("%Y-%m")
    weights, medications_today, upcoming_schedule = await asyncio.gather(
        get_monthly_weights(petId, current_month),
        get_today_medications(petId),
        get_upcoming_schedule_dday(petId),
    )

    return DashboardOut(
        pet=PetOut.from_mongo(pet_doc),
        weights=weights,
        medicationsToday=medications_today,
        upcomingSchedule=upcoming_schedule,
    )
