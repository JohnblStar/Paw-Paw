from datetime import date
from pydantic import BaseModel

class WeightOut(BaseModel):
    id: str
    petId: str
    date: date
    value: float

    @classmethod
    def from_mongo(cls, doc: dict) -> "WeightOut":
        return cls(
            id=str(doc["_id"]),
            petId=str(doc["petId"]),
            date=doc["date"],
            value=doc["value"],
        )
