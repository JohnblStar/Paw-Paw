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
    startDate: date
    endDate: date | None = None
    doseLog: list[MedicationDoseLog] = []

    @classmethod
    def from_mongo(cls, doc: dict) -> "MedicationOut":
        return cls(
            id=str(doc["_id"]),
            petId=str(doc["petId"]),
            title=doc["title"],
            frequencyPerDay=doc["frequencyPerDay"],
            alertTimes=doc.get("alertTimes", []),
            startDate=doc["startDate"].date(),
            endDate=doc["endDate"].date() if doc.get("endDate") else None,
            doseLog=doc.get("doseLog", []),
        )
