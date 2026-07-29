from pydantic import BaseModel


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
    weightChange: WeightChange
    monthlySymptomFrequency: list[SymptomFrequencyItem]
    diagnosisOpinions: list[DiagnosisOpinion]
    hospitalQuestions: list[str]
    reportText: str
