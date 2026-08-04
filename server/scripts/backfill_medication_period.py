"""
복약 기간(startDate/endDate) 필드 추가에 따른 1회성 백필 스크립트.

startDate/endDate가 없는 기존 medications 문서에 기본값을 채운다.
- startDate: 그 약의 가장 이른 doseLog 날짜(복용 기록이 있다면 그 시점부터 먹고 있었다고 간주),
  없으면 오늘.
- endDate: None (계속 복용 중으로 간주 — CLAUDE.md 절대 규칙과 무관, 단순 데이터 기본값).

실행: cd server && python -m scripts.backfill_medication_period
"""

import asyncio
from datetime import date

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.core.pet_helpers import to_datetime


async def main() -> None:
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client["pawpaw"]

    updated = 0
    async for doc in db.medications.find({"startDate": {"$exists": False}}):
        dose_dates = [entry["date"] for entry in doc.get("doseLog", [])]
        start_date = min(dose_dates).date() if dose_dates else date.today()
        await db.medications.update_one(
            {"_id": doc["_id"]},
            {"$set": {"startDate": to_datetime(start_date), "endDate": None}},
        )
        updated += 1

    print(f"백필 완료: {updated}개 medications 문서 업데이트")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
