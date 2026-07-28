from pydantic import BaseModel


class ChatQueryRequest(BaseModel):
    message: str


class DetectedSymptom(BaseModel):
    area: str | None
    description: str | None


class ChatQueryResponse(BaseModel):
    reply: str
    isSymptomDetected: bool
    detectedSymptom: DetectedSymptom | None
    suspectedSymptom: str | None
