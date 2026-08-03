from pydantic import BaseModel


class BreedGuideFeedback(BaseModel):
    trainingTip: str
    chronicDiseases: str
    specialCare: str | None


class BreedGuideOut(BaseModel):
    breed: str
    feedback: BreedGuideFeedback

    @classmethod
    def from_mongo(cls, doc: dict) -> "BreedGuideOut":
        return cls(
            breed=doc["breed"],
            feedback=BreedGuideFeedback(
                trainingTip=doc["trainingTip"],
                chronicDiseases=doc["chronicDiseases"],
                specialCare=doc.get("specialCare"),
            ),
        )
