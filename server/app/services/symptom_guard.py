"""대시보드 자동 저장 기록(symptomSummary)의 병명 차단 — CLAUDE.md 절대 규칙 1.
프롬프트 지시만으로는 모델이 병명을 섞어 쓸 가능성을 배제할 수 없어, 저장 직전에 서버에서 한 번 더 걸러낸다.
LLM을 다시 호출하지 않는 순수 규칙 기반 후처리다."""

import re

# 반려동물 상담에서 자주 나오는 진단명. 접미사 규칙(_SUFFIX_RE)으로 못 잡는 것 위주로 둔다.
DISEASE_TERMS = [
    "슬개골탈구", "슬개골 탈구", "디스크", "추간판", "고관절이형성", "이형성증", "백내장", "녹내장",
    "당뇨", "쿠싱", "갑상선", "신부전", "간부전", "심부전", "심장사상충", "파보", "홍역", "코로나",
    "켄넬코프", "아토피", "알레르기", "종양", "림프종", "열사병", "저혈당", "빈혈", "치주",
    "요로결석", "결석", "염증", "전염병", "기관지협착", "기관허탈", "탈장", "탈구", "골절", "중독",
]

# "피부염이", "관절염 의심", "심장병", "유선암", "OO증후군"처럼 진단명 접미사로 끝나는 어절.
# "염려", "병원", "암컷"처럼 같은 글자로 시작하는 일반 단어는 접미사 뒤 글자로 걸러낸다.
_SUFFIX_RE = re.compile(
    r"[가-힣]+(?:염|병|암|증후군)(?=$|[^가-힣]|[이가은는을를의도과와]|으로|일|인|증)"
)
_NON_DISEASE_WORDS = {"물병", "약병", "질병", "발병"}

_CLAUSE_SPLIT_RE = re.compile(r"\s*(?:[,，·/]|\s및\s|그리고)\s*")

FALLBACK_SUMMARY = "이상 증상이 있었어요"


def contains_disease_name(text: str) -> bool:
    if any(term in text for term in DISEASE_TERMS):
        return True
    return any(m.group(0) not in _NON_DISEASE_WORDS for m in _SUFFIX_RE.finditer(text))


def sanitize_symptom_summary(summary: str, area: str | None = None) -> str:
    """병명이 포함된 구절만 제거하고 관찰된 증상 구절은 남긴다. 전부 걸리면 부위 기준 일반 문구로 대체한다."""
    if not contains_disease_name(summary):
        return summary

    kept = [clause for clause in _CLAUSE_SPLIT_RE.split(summary) if clause and not contains_disease_name(clause)]
    if kept:
        return ", ".join(kept)
    return f"{area} 관련 {FALLBACK_SUMMARY}" if area else FALLBACK_SUMMARY
