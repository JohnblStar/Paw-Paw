from calendar import monthrange
from datetime import date, timedelta
from bson import ObjectId
from fastapi import APIRouter, Query
from pydantic import BaseModel
from app.core.database import get_database
from collections import defaultdict


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