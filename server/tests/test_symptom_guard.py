import pytest

from app.services.symptom_guard import FALLBACK_SUMMARY, contains_disease_name, sanitize_symptom_summary


@pytest.mark.parametrize("text", [
    "관절염 의심", "피부염이 있는 것 같음", "심장병", "유선암", "쿠싱증후군 가능성", "슬개골 탈구", "귀에 염증",
])
def test_detects_disease_names(text):
    assert contains_disease_name(text)


@pytest.mark.parametrize("text", [
    "다리 절뚝임(시작: 3일전)", "산책 후 헐떡임과 휘청거림(오늘)", "보호자가 염려함", "병원 방문 예정",
    "귀를 자주 긁음", "통증으로 낑낑거림", "물병을 엎음",
])
def test_keeps_observed_symptoms(text):
    assert not contains_disease_name(text)


def test_removes_only_disease_clause():
    assert sanitize_symptom_summary("다리 절뚝임(3일전), 관절염 의심", "다리") == "다리 절뚝임(3일전)"


def test_falls_back_when_everything_is_diagnosis():
    assert sanitize_symptom_summary("관절염 의심", "관절") == f"관절 관련 {FALLBACK_SUMMARY}"
    assert sanitize_symptom_summary("췌장염", None) == FALLBACK_SUMMARY


def test_clean_summary_unchanged():
    assert sanitize_symptom_summary("귀를 자주 긁음(오늘)") == "귀를 자주 긁음(오늘)"
