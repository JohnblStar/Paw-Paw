from datetime import date
from typing import Literal
from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: str
    type: Literal["medication", "schedule"]
    title: str
    message: str
    date: date
    # 전체 반려동물 통합 조회(GET /api/v1/notifications)에서만 채워진다 — 어느 아이의 알림인지 구분용
    petId: str | None = None
    petName: str | None = None


class NotificationListOut(BaseModel):
    unreadCount: int
    notifications: list[NotificationOut]
