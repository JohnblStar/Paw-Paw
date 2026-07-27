from datetime import date
from typing import Literal
from pydantic import BaseModel

class HealthNote(BaseModel):
    date: date
    bodyPart: str
    note: str

class PetOut(BaseModel):
    id: str
    ownerId: str
    name: str
    species: Literal["dog", "cat"]
    breed: str | None = None
    birthDate: date
    sex: Literal["female", "male"]
    neutered: bool
    photoKey: str
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
            photoKey=doc["photoKey"],
            managedConditions=doc.get("managedConditions", []),
            healthNotes=[HealthNote(**note) for note in doc.get("healthNotes", [])],
        )
