from pydantic import BaseModel


class WeightRange(BaseModel):
    min: float
    max: float


class BreedGuideFeedback(BaseModel):
    trainingTip: str
    chronicDiseases: str
    specialCare: str | None
    # 이 필드가 추가되기 전에 캐싱된 품종 가이드에는 값이 없다 — 토큰 절약을 위해 재생성하지 않고 null로 둔다.
    standardWeightKg: WeightRange | None = None


def parse_weight_range(raw) -> dict | None:
    """LLM 출력의 standardWeightKg를 검증한다. 숫자가 아니거나 min > max면 버린다 (잘못된 범위를 그래프에 그리지 않기 위함)."""
    if not isinstance(raw, dict):
        return None
    try:
        low, high = float(raw["min"]), float(raw["max"])
    except (KeyError, TypeError, ValueError):
        return None
    if low <= 0 or high <= 0 or low > high:
        return None
    return {"min": low, "max": high}


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
                standardWeightKg=doc.get("standardWeightKg"),
            ),
        )
