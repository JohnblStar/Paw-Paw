from typing import Literal
from pydantic import BaseModel

from app.models.breed_guide import BreedGuideFeedback


class ReportPetProfile(BaseModel):
    name: str
    age: int
    breed: str | None = None


class WeightChange(BaseModel):
    thisMonthStart: float | None
    current: float | None
    oneMonthAgo: float | None
    analysisMessage: str


class SymptomFrequencyItem(BaseModel):
    date: str
    issue: str


class DiagnosisOpinion(BaseModel):
    id: int
    text: str


class HealthReportOut(BaseModel):
    petProfile: ReportPetProfile
    period: Literal["month", "week"]
    breedGuide: BreedGuideFeedback | None
    weightChange: WeightChange
    monthlySymptomFrequency: list[SymptomFrequencyItem]
    diagnosisOpinions: list[DiagnosisOpinion]
    hospitalQuestions: list[str]
    reportText: str
