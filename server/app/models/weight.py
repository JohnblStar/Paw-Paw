from datetime import date
from pydantic import BaseModel

class WeightOut(BaseModel):
    id: str
    petId: str
    date: date
    weight: float

    @classmethod
    def from_mongo(cls, doc: dict) -> "WeightOut":
        return cls(
            id=str(doc["_id"]),
            petId=str(doc["petId"]),
            date=doc["date"].date(),
            weight=doc["value"],
        )
