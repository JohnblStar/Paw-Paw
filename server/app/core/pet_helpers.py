from datetime import date, datetime, timezone

from bson import ObjectId
from fastapi import HTTPException


def to_datetime(d: date) -> datetime:
    return datetime(d.year, d.month, d.day, tzinfo=timezone.utc)


def age_years(birth_date: date) -> int:
    today = date.today()
    years = today.year - birth_date.year
    if (today.month, today.day) < (birth_date.month, birth_date.day):
        years -= 1
    return years


def today_slots(med_doc: dict, today: date) -> list[bool]:
    freq = med_doc["frequencyPerDay"]
    for entry in med_doc.get("doseLog", []):
        if entry["date"].date() == today:
            slots = entry.get("slots", [])
            return (list(slots) + [False] * freq)[:freq]
    return [False] * freq


async def get_owned_pet(db, petId: str, user_id: str) -> dict:
    pet = await db.pets.find_one({"_id": ObjectId(petId), "ownerId": ObjectId(user_id)})
    if pet is None:
        raise HTTPException(status_code=404, detail="Pet not found")
    return pet
