from datetime import date
from pydantic import BaseModel

class MedicationOut(BaseModel):
    id: str
    petId: str
    title: str
    frequencyPerDay: int
    alertTimes: list[str]
    completedDates: list[date] = []

    @classmethod
    def from_mongo(cls, doc: dict) -> "MedicationOut":
        return cls(
            id=str(doc["_id"]),
            petId=str(doc["petId"]),
            title=doc["title"],
            frequencyPerDay=doc["frequencyPerDay"],
            alertTimes=doc.get("alertTimes", []),
            completedDates=doc.get("completedDates", []),
        )
