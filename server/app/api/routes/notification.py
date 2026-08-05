from datetime import date, datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends

from app.core.database import get_database
from app.core.deps import get_current_user
from app.core.pet_helpers import get_owned_pet, now_kst, today_kst, today_slots
from app.models.notification import NotificationListOut, NotificationOut

router = APIRouter(prefix="/api/v1/pets", tags=["notifications"])

# 카카오 알림톡은 비즈니스 채널·발신 대행사 계약이 필요해 이 프로젝트 범위 밖이라,
# 같은 두 카테고리(복약/예방접종)만 대상으로 하는 인앱 알림으로 대체한다.
# 별도 스케줄러 없이, 조회 시점에 "지금 떠야 하는 알림"을 계산하는 온디맨드 방식이다.
SCHEDULE_DDAY_MILESTONES = {7, 1, 0}


async def _build_due_notifications(db, pet_id: ObjectId, today: date) -> list[NotificationOut]:
    notifications: list[NotificationOut] = []
    now_hhmm = now_kst().strftime("%H:%M")

    async for med in db.medications.find({"petId": pet_id}):
        alert_times = med.get("alertTimes", [])
        if not alert_times:
            continue
        slots = today_slots(med, today)
        # 알림시간은 frequencyPerDay 중 최대 3회분에만 매핑된다 — 나머지 복용 회차는
        # 리마인드 시간이 없어 인앱 알림 대상이 아니다 (dashboard.md, alertTimes 최대 3개).
        for i, alert_time in enumerate(alert_times):
            if i >= len(slots) or slots[i] or now_hhmm < alert_time:
                continue
            notifications.append(
                NotificationOut(
                    id=f"medication:{med['_id']}:{today.isoformat()}:{i}",
                    type="medication",
                    title="복약 알림",
                    message=(
                        f"{med['title']} {alert_time} 복용 시간이에요"
                        if len(alert_times) > 1
                        else f"{med['title']} 먹을 시간이에요"
                    ),
                    date=today,
                )
            )

    async for sched in db.schedules.find({"petId": pet_id}):
        dday = (sched["date"].date() - today).days
        if dday not in SCHEDULE_DDAY_MILESTONES:
            continue
        label = "오늘이에요" if dday == 0 else f"D-{dday}"
        notifications.append(
            NotificationOut(
                id=f"schedule:{sched['_id']}:{today.isoformat()}",
                type="schedule",
                title="예방접종/검진 알림",
                message=f"{sched['title']} {label}",
                date=today,
            )
        )

    return notifications


@router.get("/{petId}/notifications", response_model=NotificationListOut)
async def get_notifications(petId: str, user_id: str = Depends(get_current_user)):
    db = get_database()
    pet = await get_owned_pet(db, petId, user_id)

    today = today_kst()
    due = await _build_due_notifications(db, pet["_id"], today)

    read_ids = {
        doc["notificationId"]
        async for doc in db.notificationReads.find(
            {"userId": ObjectId(user_id), "notificationId": {"$in": [n.id for n in due]}}
        )
    }
    unread = [n for n in due if n.id not in read_ids]

    return NotificationListOut(unreadCount=len(unread), notifications=unread)


@router.patch("/{petId}/notifications/{notificationId}/read", status_code=204)
async def mark_notification_read(petId: str, notificationId: str, user_id: str = Depends(get_current_user)):
    db = get_database()
    await get_owned_pet(db, petId, user_id)

    await db.notificationReads.update_one(
        {"userId": ObjectId(user_id), "notificationId": notificationId},
        {"$setOnInsert": {"readAt": datetime.now(timezone.utc)}},
        upsert=True,
    )
