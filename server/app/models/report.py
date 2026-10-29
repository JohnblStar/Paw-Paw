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


class MedicationAdherence(BaseModel):
    title: str
    taken: int
    expected: int
    rate: int  # 0~100 (%)


class HealthReportOut(BaseModel):
    petProfile: ReportPetProfile
    period: Literal["month", "week"]
    breedGuide: BreedGuideFeedback | None
    weightChange: WeightChange
    monthlySymptomFrequency: list[SymptomFrequencyItem]
    diagnosisOpinions: list[DiagnosisOpinion]
    hospitalQuestions: list[str]
    reportText: str
    # 기간 내 복약 기록으로 계산한 복용률 — LLM이 아니라 doseLog 집계로 만든다 (토큰 소모 없음).
    medicationAdherence: list[MedicationAdherence] = []
    overallAdherenceRate: int | None = None
