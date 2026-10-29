from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from bson import ObjectId
from fastapi import HTTPException

KST = ZoneInfo("Asia/Seoul")


def to_datetime(d: date) -> datetime:
    return datetime(d.year, d.month, d.day, tzinfo=timezone.utc)


def now_kst() -> datetime:
    # 배포 서버(Render 등)는 보통 UTC로 돈다. "오늘"/"지금"은 항상 사용자 기준(한국 시간)이어야
    # 알림 발송 시각·날짜 경계가 실제와 어긋나지 않는다 (naive date.today()/datetime.now() 금지).
    return datetime.now(KST)


def today_kst() -> date:
    return now_kst().date()


def age_years(birth_date: date) -> int:
    today = today_kst()
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


def is_medication_active(med_doc: dict, day: date) -> bool:
    if day < med_doc["startDate"].date():
        return False
    end_date = med_doc.get("endDate")
    return end_date is None or day <= end_date.date()


async def get_owned_pet(db, petId: str, user_id: str) -> dict:
    pet = await db.pets.find_one({"_id": ObjectId(petId), "ownerId": ObjectId(user_id)})
    if pet is None:
        raise HTTPException(status_code=404, detail="Pet not found")
    return pet
