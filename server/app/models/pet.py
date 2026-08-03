from datetime import date
from typing import Literal
from pydantic import BaseModel

class HealthNote(BaseModel):
    # 이 필드가 붙기 전에 저장된 기존 기록은 id가 없을 수 있다 — 그런 기록은 프론트에서
    # 수정/삭제 버튼 없이 읽기 전용으로만 표시한다.
    id: str | None = None
    date: date
    bodyPart: str
    note: str
    suspectedSymptom: str | None = None

class PetOut(BaseModel):
    id: str
    ownerId: str
    name: str
    species: Literal["dog", "cat"]
    breed: str | None = None
    birthDate: date
    sex: Literal["female", "male"]
    neutered: bool
    weight: float
    photoKey: str
    isActive: bool = False
    managedConditions: list[str] = []
    healthNotes: list[HealthNote] = []

    @classmethod
    def from_mongo(cls, doc: dict) -> "PetOut":
        return cls(
            id=str(doc["_id"]),
            ownerId=str(doc["ownerId"]),
            name=doc["name"],
            species=doc["species"],
            breed=doc.get("breed"),
            birthDate=doc["birthDate"],
            sex=doc["sex"],
            neutered=doc["neutered"],
            weight=doc["weight"],
            photoKey=doc["photoKey"],
            managedConditions=doc.get("managedConditions", []),
            healthNotes=[HealthNote(**note) for note in doc.get("healthNotes", [])],
        )
