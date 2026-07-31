from typing import Literal
from pydantic import BaseModel


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


class ChatSummaryResponse(BaseModel):
    summaryTitle: str
    uploadedSymptoms: list[str]
    suspectedSymptoms: list[str]
    notice: str
