"""AI_MODE=mock(또는 replay에서 기록이 없는 질문)일 때 돌려주는 고정 응답.
실제 LLM 출력 스키마(prompts.py)와 같은 형태를 유지해야 라우트 후처리 로직을 그대로 검증할 수 있다."""

MOCK_CONSULT = {
    "answerText": (
        "지금은 개발용 목업 응답이에요. 실제 상담 답변은 AI_MODE=live로 바꾸면 받을 수 있어요. "
        "[출처: 일반 수의학 상식]"
    ),
    "isSymptomDetected": False,
    "symptomSummary": None,
    "suspectedSymptom": None,
}

MOCK_REPORT_TEXT = (
    "## 종합소견\n"
    "1. 시기별 타임라인 정리\n"
    "- 목업 모드에서는 타임라인을 생성하지 않아요.\n"
    "2. 종합 판단: 목업 응답이라 실제 데이터를 분석하지 않았어요.\n"
    "3. 실천 가이드: 실제 레포트는 AI_MODE=live로 바꾸면 생성돼요.\n\n"
    "## 앞으로의 케어가이드\n"
    "- 규칙적인 산책과 체중 기록을 이어가세요.\n"
    "- 복약 시간을 지켜주세요.\n\n"
    "## 면책 문구\n"
    "AI가 분석한 정보는 정확하지 않을 수 있습니다."
)


def mock_breed_guide(raw_input: str) -> dict:
    return {
        "breed": raw_input,
        "trainingTip": "목업 응답이에요. 실제 품종 정보는 AI_MODE=live에서 생성돼요.",
        "chronicDiseases": "목업 응답이에요.",
        "specialCare": None,
        "standardWeightKg": None,
    }
