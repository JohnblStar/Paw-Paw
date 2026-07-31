from datetime import date
from pydantic import BaseModel

class MedicationDoseLog(BaseModel):
    date: date
    slots: list[bool]

class MedicationOut(BaseModel):
    id: str
    petId: str
    title: str
    frequencyPerDay: int
    alertTimes: list[str]
    doseLog: list[MedicationDoseLog] = []

    @classmethod
    def from_mongo(cls, doc: dict) -> "MedicationOut":
        return cls(
            id=str(doc["_id"]),
            petId=str(doc["petId"]),
            title=doc["title"],
            frequencyPerDay=doc["frequencyPerDay"],
            alertTimes=doc.get("alertTimes", []),
            doseLog=doc.get("doseLog", []),
        )
