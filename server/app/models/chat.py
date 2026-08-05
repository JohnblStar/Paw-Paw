from typing import Literal
from pydantic import BaseModel

from app.models.pet import PetOut


class ChatQueryRequest(BaseModel):
    message: str


class DetectedSymptom(BaseModel):
    area: str | None
    description: str | None


class RegistrationSuggestion(BaseModel):
    type: Literal["medication", "single_date"]


class ChatQueryResponse(BaseModel):
    reply: str
    isSymptomDetected: bool
    detectedSymptom: DetectedSymptom | None
    suspectedSymptom: str | None
    registrationSuggestion: RegistrationSuggestion | None = None
    # 새 건강 기록이 저장됐을 때만 채워진다 — 프론트가 이 값으로 PetProvider 캐시를
    # 새로고침 없이 즉시 동기화한다 (HealthNotesCard의 수정/삭제 응답과 같은 패턴).
    pet: PetOut | None = None


class ChatSummaryResponse(BaseModel):
    summaryTitle: str
    uploadedSymptoms: list[str]
    suspectedSymptoms: list[str]
    notice: str
