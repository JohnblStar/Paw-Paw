from datetime import date
from typing import Literal
from pydantic import BaseModel

from app.core.pet_helpers import KST

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
    # 등록일 — 별도 필드 없이 ObjectId 생성 시각(KST)에서 계산하므로 기존 데이터에도 바로 적용된다.
    # 건강 레포트에서 등록 이전 달 조회(불필요한 LLM 호출)를 막는 하한으로 쓴다.
    createdAt: date | None = None

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
            createdAt=doc["_id"].generation_time.astimezone(KST).date(),
        )
