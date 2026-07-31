from datetime import date
from typing import Literal
from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: str
    type: Literal["medication", "schedule"]
    title: str
    message: str
    date: date


class NotificationListOut(BaseModel):
    unreadCount: int
    notifications: list[NotificationOut]
