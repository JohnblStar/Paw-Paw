from datetime import date
from pydantic import BaseModel

class ScheduleOut(BaseModel):
    id: str
    petId: str
    title: str
    date: date

    @classmethod
    def from_mongo(cls, doc: dict) -> "ScheduleOut":
        return cls(
            id=str(doc["_id"]),
            petId=str(doc["petId"]),
            title=doc["title"],
            date=doc["date"].date(),
        )
