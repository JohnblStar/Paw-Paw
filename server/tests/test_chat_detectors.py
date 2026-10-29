import pytest

from app.api.routes.chat import _build_user_message, _detect_registration_intent, _extract_area, _merge_notes
from app.models.chat import ChatQueryRequest, PreviousTurn


@pytest.mark.parametrize("text, expected", [
    ("피부에 발진이 생겼어요", "피부"),
    ("발진이 났어", "피부"),
    ("발작을 했어요", None),
    ("배변 횟수가 줄었어", None),
    ("털이 빠지고 피부가 붉어요", "털"),
    ("다리를 절고 관절에서 소리가 나요", "다리"),
    ("발바닥을 핥아요", "발"),
    (None, None),
])
def test_extract_area(text, expected):
    assert _extract_area(text) == expected


@pytest.mark.parametrize("text, expected", [
    ("오늘 약 먹였어", "medication"),
    ("등록", "medication"),
    ("예방접종 등록해줘", "single_date"),
    ("오늘 광견병 예방접종 했어", "single_date"),
    ("검진 때 뭘 물어봐야 해?", None),
    ("약 먹었는데 왜 토하지?", None),
    ("예방접종은 언제 맞아야 해", None),
    ("산책 다녀왔어", None),
])
def test_detect_registration_intent(text, expected):
    result = _detect_registration_intent(text)
    assert (result.type if result else None) == expected


def test_build_user_message_truncates_previous_turn():
    body = ChatQueryRequest(message="산책은 해도 돼?", previousTurn=PreviousTurn(question="q" * 300, answer="a" * 500))
    message = _build_user_message(body)
    assert "q" * 100 in message and "q" * 101 not in message
    assert "a" * 200 in message and "a" * 201 not in message
    assert message.endswith("산책은 해도 돼?")


def test_build_user_message_without_history():
    assert _build_user_message(ChatQueryRequest(message="안녕")) == "안녕"


def test_merge_notes():
    assert _merge_notes("귀를 긁음", "귀를 긁음") == "귀를 긁음"
    assert _merge_notes("귀를 긁음", "귀를 긁음, 냄새남") == "귀를 긁음, 냄새남"
    assert _merge_notes("귀를 긁음", "귀가 빨개짐") == "귀를 긁음, 귀가 빨개짐"
