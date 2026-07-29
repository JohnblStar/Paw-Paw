"""테스트용 페르소나 데이터 — "몽이" (펨브록 웰시코기, 14세).
PetOut/HealthNote(server/app/models/pet.py) 필드명을 최대한 따라간다.

주의: healthNotes의 2025-11 항목은 병명("추간판탈출증")을 포함한다. 이는 챗봇
symptomSummary가 만들어낸 값이 아니라 "수의사가 실제 진단해 확정 기록된 과거 이력"을
시뮬레이션한 픽스처다. health-report.md는 리포트에서 병명 사용을 명시적으로 허용하므로
이 픽스처는 규칙 위반이 아니다. 실제 구현에서 챗봇 상담 결과가 이 리스트에 자동
저장되는 경로를 만들 때는, 그 값 자체는 반드시 병명 없이 생성돼야 한다는 점과
혼동하지 말 것.
"""
from datetime import date

TODAY = date(2026, 7, 28)

PET_MONGI = {
    "name": "몽이",
    "species": "dog",
    "breed": "펨브록 웰시코기",
    "birthDate": date(2012, 7, 1),  # 오늘 기준 만 14세
    "sex": "male",
    "neutered": True,
    "weight": 18.0,
    "managedConditions": ["만성 췌장염", "피부염", "관절염(소염진통제 복용 중)"],
    "healthNotes": [
        {"date": date(2025, 5, 15), "bodyPart": "다리", "note": "미세골절"},
        {"date": date(2025, 10, 10), "bodyPart": "피부", "note": "종기 발생"},
        {"date": date(2025, 11, 20), "bodyPart": "허리", "note": "추간판탈출증(디스크) 진단"},
        {"date": date(2026, 7, 8), "bodyPart": "관절", "note": "산책 중 무리, 다리를 절뚝임"},
    ],
}

WEIGHT_HISTORY = [
    {"date": date(2026, 6, 1), "weight": 16.0},
    {"date": date(2026, 7, 20), "weight": 18.0},
]

MEDICATIONS = [
    {"name": "췌장염약", "note": "만성 췌장염 관리, 지속 복용"},
    {"name": "피부염약", "note": "지속 복용"},
    {"name": "관절용 소염진통제", "note": "복용 시작 1개월째"},
]

BREED_GUIDE_TEXT = (
    "펨브록 웰시코기는 체형 특성상 체중 관리와 척추 보호가 특히 중요한 품종입니다. "
    "허리가 길고 다리가 짧아 허리디스크(추간판탈출증) 위험이 높으므로 과체중을 주의해야 합니다. "
    "또한 더위에 약한 편이라 여름철 산책과 실외 활동 시간을 제한하는 것이 좋습니다."
)


def _age_years(birth_date: date, today: date = TODAY) -> int:
    years = today.year - birth_date.year
    if (today.month, today.day) < (birth_date.month, birth_date.day):
        years -= 1
    return years


def _fmt_notes(notes):
    return "\n".join(f"- {n['date']} ({n['bodyPart']}): {n['note']}" for n in notes)


def _fmt_meds(meds):
    return "\n".join(f"- {m['name']} ({m['note']})" for m in meds)


def _fmt_weights(weights):
    return "\n".join(f"- {w['date']}: {w['weight']}kg" for w in weights)


def build_consult_context_block(pet=PET_MONGI, weight_history=WEIGHT_HISTORY,
                                 medications=MEDICATIONS, breed_guide=BREED_GUIDE_TEXT):
    """상담모드용 컨텍스트 — 요약 형태로만 (토큰 절약 원칙)."""
    recent_weights = weight_history[-2:]
    recent_notes = pet["healthNotes"][-2:]
    return f"""[반려동물 기본정보]
이름: {pet['name']} / 품종: {pet['breed']} / 나이: {_age_years(pet['birthDate'])}세 / 현재 체중: {pet['weight']}kg / 성별: {pet['sex']} (중성화: {'완료' if pet['neutered'] else '미완료'})

[최근 체중]
{_fmt_weights(recent_weights)}

[복용 중인 약]
{_fmt_meds(medications)}

[최근 특이사항]
{_fmt_notes(recent_notes)}

[품종 가이드 — 참고용 배경지식, 사용자에게 출처로 노출하지 말 것]
{breed_guide}
"""


def build_report_context_block(pet=PET_MONGI, weight_history=WEIGHT_HISTORY,
                                medications=MEDICATIONS, breed_guide=BREED_GUIDE_TEXT):
    """건강 레포트용 컨텍스트 — 전체 기간 조회 원칙."""
    return f"""[반려동물 기본정보]
이름: {pet['name']} / 품종: {pet['breed']} / 나이: {_age_years(pet['birthDate'])}세 / 성별: {pet['sex']} (중성화: {'완료' if pet['neutered'] else '미완료'})

[체중 변화 이력 (전체)]
{_fmt_weights(weight_history)}

[복용 중인 약]
{_fmt_meds(medications)}

[과거 증상 타임라인 (전체)]
{_fmt_notes(pet['healthNotes'])}

[품종 가이드 — 참고용 배경지식, 다시 생성하지 말고 종합소견에만 활용]
{breed_guide}
"""
