from datetime import date, datetime

from app.api.routes.report import _medication_adherence, _months_before, _weight_at
from app.models.breed_guide import parse_weight_range


def _dt(y, m, d):
    return datetime(y, m, d)


def test_weight_at_carries_previous_value():
    # 절대 규칙 2: 입력이 없는 날은 직전 값을 이어서 쓴다
    weights = [{"date": _dt(2026, 10, 1), "value": 5.0}, {"date": _dt(2026, 10, 5), "value": 5.4}]
    assert _weight_at(weights, date(2026, 9, 30)) is None
    assert _weight_at(weights, date(2026, 10, 3)) == 5.0
    assert _weight_at(weights, date(2026, 10, 20)) == 5.4


def test_months_before_clamps_day():
    assert _months_before(date(2026, 3, 31), 1) == date(2026, 2, 28)
    assert _months_before(date(2026, 1, 15), 1) == date(2025, 12, 15)


def test_medication_adherence():
    med = {
        "title": "심장약",
        "frequencyPerDay": 2,
        "startDate": _dt(2026, 10, 1),
        "endDate": None,
        "doseLog": [
            {"date": _dt(2026, 10, 1), "slots": [True, True]},
            {"date": _dt(2026, 10, 2), "slots": [True, False]},
        ],
    }
    items, overall = _medication_adherence([med], date(2026, 10, 1), date(2026, 10, 3))
    assert items[0].taken == 3 and items[0].expected == 6 and items[0].rate == 50
    assert overall == 50


def test_medication_adherence_skips_inactive_medication():
    med = {"title": "x", "frequencyPerDay": 1, "startDate": _dt(2026, 11, 1), "doseLog": []}
    items, overall = _medication_adherence([med], date(2026, 10, 1), date(2026, 10, 3))
    assert items == [] and overall is None


def test_parse_weight_range():
    assert parse_weight_range({"min": 3, "max": "5.5"}) == {"min": 3.0, "max": 5.5}
    assert parse_weight_range({"min": 6, "max": 3}) is None
    assert parse_weight_range({"min": "abc", "max": 3}) is None
    assert parse_weight_range(None) is None


def test_breed_range_clause():
    from app.api.routes.report import _breed_range_clause
    weight_range = {"min": 3.0, "max": 5.0}
    assert _breed_range_clause(4.0, weight_range) == "품종 적정 체중(3~5kg) 범위 안이에요."
    assert _breed_range_clause(5.6, weight_range) == "품종 적정 체중(3~5kg)보다 0.6kg 무거워요."
    assert _breed_range_clause(2.5, weight_range) == "품종 적정 체중(3~5kg)보다 0.5kg 가벼워요."
    assert _breed_range_clause(4.0, None) is None
