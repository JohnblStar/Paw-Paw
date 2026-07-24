from calendar import monthrange
from datetime import date, timedelta
from bson import ObjectId
from fastapi import APIRouter, Query
from pydantic import BaseModel
from app.core.database import get_database

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
