import hashlib
import re
from calendar import monthrange
from datetime import date, datetime, timedelta, timezone
from typing import Literal

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.database import get_database
from app.core.deps import get_current_user
from app.models.breed_guide import BreedGuideFeedback
from app.models.report import (
    DiagnosisOpinion,
    HealthReportOut,
    ReportPetProfile,
    SymptomFrequencyItem,
    WeightChange,
)
from app.services import prompts
from app.services.hai_gpt import HaiGptError, call_text

router = APIRouter(prefix="/api/v1/pets", tags=["report"])

FALLBACK_REPORT_TEXT = (
    "## 종합소견\n"
    "AI 건강 리포트 생성이 일시적으로 제한됩니다. 잠시 후 다시 시도해 주세요.\n\n"
    "## 앞으로의 케어가이드\n"
    "- 잠시 후 새로고침을 눌러 다시 시도해 주세요.\n\n"
    "## 면책 문구\n"
    "AI가 분석한 정보는 정확하지 않을 수 있습니다."
)


def _age_years(birth_date: date) -> int:
    today = date.today()
    years = today.year - birth_date.year
    if (today.month, today.day) < (birth_date.month, birth_date.day):
        years -= 1
    return years


def _months_before(d: date, months: int) -> date:
    total = d.year * 12 + (d.month - 1) - months
    y, m = divmod(total, 12)
    m += 1
    last_day = monthrange(y, m)[1]
    return date(y, m, min(d.day, last_day))


def _weight_at(weights: list[dict], target: date) -> float | None:
    value = None
    for w in weights:
        if w["date"].date() <= target:
            value = w["value"]
        else:
            break
    return value


def _diff_clause(diff: float) -> str:
    if diff > 0:
        return f"{diff:.1f}kg 증가했어요"
    if diff < 0:
        return f"{abs(diff):.1f}kg 감소했어요"
    return "변화가 없었어요"


def _build_analysis_message(
    period_start_value: float | None,
    current: float | None,
    period_before_value: float | None,
    period: Literal["month", "week"],
) -> str:
    start_label = "이번 주 시작" if period == "week" else "이번 달 시작"
    before_label = "1주 전보다" if period == "week" else "한 달 전보다"
    clauses = []
    if current is not None and period_start_value is not None:
        clauses.append(f"{start_label} 대비 {_diff_clause(current - period_start_value)}")
    if current is not None and period_before_value is not None:
        clauses.append(f"{before_label} {_diff_clause(current - period_before_value)}")
    if not clauses:
        return "체중 기록이 충분하지 않아 변화를 분석할 수 없어요."
    return ", ".join(clauses) + "."


# REPORT_SYSTEM_PROMPT가 요구하는 고정 헤더(## 종합소견 / ## 앞으로의 케어가이드 / ## 면책 문구)를
# 기준으로 diagnosisOpinions를 후처리 분할한다 — 프롬프트 재설계가 아닌 생성된 텍스트의 파싱.
_SECTION_RE = re.compile(r"^##\s*(.+?)\s*$", re.MULTILINE)
_BULLET_RE = re.compile(r"^(\s*)(?:[-*•]|\d+[.)])\s+(.*\S)\s*$")
_TIMELINE_RE = re.compile(r"^\s*(?:[-*•]\s*)?\d{4}[-.]\d{1,2}[-.]\d{1,2}")
# "종합소견"은 "1. 시기별 타임라인 정리 → 2. 종합 판단 → 3. 실천 가이드" 3블록으로 구성된다.
# 블록 1(타임라인 정리)은 하위 불릿까지 통째로 제외하고, 블록 2/3(종합 판단·실천 가이드)의
# 내용만 opinion으로 채택한다 — 정확한 레이블 문구는 매 호출마다 조금씩 달라질 수 있으므로
# 레이블 문자열 매칭이 아니라 번호가 붙은 최상위 블록 단위로 잘라 판단한다.
_STEP_MARKER_RE = re.compile(r"^\d+\.\s*(.*)$", re.MULTILINE)
_STEP_LABEL_LINE_RE = re.compile(r"^([^\n:：\-]*)[:：\-]?\s*(.*)$")


def _split_sections(report_text: str) -> dict[str, str]:
    matches = list(_SECTION_RE.finditer(report_text))
    sections: dict[str, str] = {}
    for i, m in enumerate(matches):
        title = m.group(1).strip()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(report_text)
        sections[title] = report_text[start:end].strip()
    return sections


def _bullet_lines(text: str) -> list[str]:
    # 들여쓰기된 하위 불릿(예: "- 급여 방식 조정:" 아래 딸린 세부 항목들)은 독립된 opinion이
    # 아니라 직전 최상위 불릿의 보충 설명이므로, 새 항목으로 쪼개지 않고 이어붙인다.
    lines: list[str] = []
    for raw_line in text.splitlines():
        match = _BULLET_RE.match(raw_line)
        if not match:
            continue
        indent, item = match.group(1), match.group(2).strip()
        if indent and lines:
            lines[-1] = f"{lines[-1]} {item}"
        else:
            lines.append(item)
    return lines


def _split_step_blocks(text: str) -> list[str]:
    matches = list(_STEP_MARKER_RE.finditer(text))
    if not matches:
        return [text] if text.strip() else []
    blocks = []
    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        blocks.append(text[start:end].strip())
    return blocks


def _step_label_and_body(block: str) -> tuple[str, str]:
    lines = block.splitlines()
    first = re.sub(r"^\d+\.\s*", "", lines[0]) if lines else ""
    m = _STEP_LABEL_LINE_RE.match(first)
    label = m.group(1).strip() if m else ""
    inline_body = m.group(2).strip() if m else first.strip()
    rest = "\n".join(lines[1:]).strip()
    body = f"{inline_body}\n{rest}".strip() if inline_body else rest
    return label, body


def _opinions_from_body(body: str) -> list[str]:
    bullets = [line for line in _bullet_lines(body) if not _TIMELINE_RE.match(line)]
    if bullets:
        return bullets
    opinions = []
    for sentence in re.split(r"(?<=[.!?])\s+", body):
        sentence = sentence.strip(" -•\n")
        if sentence and not _TIMELINE_RE.match(sentence):
            opinions.append(sentence)
    return opinions


def _extract_diagnosis_opinions(report_text: str) -> list[str]:
    sections = _split_sections(report_text)
    opinions: list[str] = []

    comprehensive = sections.get("종합소견", "")
    for block in _split_step_blocks(comprehensive):
        label, body = _step_label_and_body(block)
        if "타임라인" in label or not body:
            continue
        opinions += _opinions_from_body(body)

    opinions += _bullet_lines(sections.get("앞으로의 케어가이드", ""))

    seen: set[str] = set()
    deduped: list[str] = []
    for text in opinions:
        if text and text not in seen:
            seen.add(text)
            deduped.append(text)
    return deduped


async def _build_report_context(pet_doc: dict) -> str:
    db = get_database()
    pet_id = pet_doc["_id"]

    weights = [doc async for doc in db.weights.find({"petId": pet_id}).sort("date", 1)]
    medications = [doc async for doc in db.medications.find({"petId": pet_id})]
    health_notes = pet_doc.get("healthNotes", [])

    breed_guide_doc = None
    if pet_doc.get("breed"):
        breed_guide_doc = await db.breedGuides.find_one({"breed": pet_doc["breed"]})

    lines = [
        "[반려동물 기본정보]",
        f"이름: {pet_doc['name']} / 품종: {pet_doc.get('breed') or '미상'} / "
        f"나이: {_age_years(pet_doc['birthDate'])}세 / 성별: {pet_doc['sex']} "
        f"(중성화: {'완료' if pet_doc['neutered'] else '미완료'})",
        "",
        "[체중 변화 이력]",
    ]
    lines += [f"- {w['date'].date()}: {w['value']}kg" for w in weights] if weights else ["- 기록 없음"]

    lines += ["", "[복용 중인 약]"]
    lines += [f"- {m['title']}" for m in medications] if medications else ["- 없음"]

    lines += ["", "[과거 증상 타임라인]"]
    lines += (
        [f"- {n['date'].date()}({n.get('bodyPart', '기타')}): {n['note']}" for n in health_notes]
        if health_notes
        else ["- 없음"]
    )

    if breed_guide_doc:
        guide_text = "\n".join(
            filter(
                None,
                [
                    breed_guide_doc.get("trainingTip"),
                    breed_guide_doc.get("chronicDiseases"),
                    breed_guide_doc.get("specialCare"),
                ],
            )
        )
        if guide_text:
            lines += ["", "[품종 가이드 — 참고용 배경지식, 다시 생성하지 말고 참고만 할 것]", guide_text]

    return "\n".join(lines)


@router.get("/{petId}/report/monthly", response_model=HealthReportOut)
async def get_monthly_report(
    petId: str,
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    period: Literal["month", "week"] = Query("month"),
    user_id: str = Depends(get_current_user),
):
    db = get_database()
    pet_doc = await db.pets.find_one({"_id": ObjectId(petId), "ownerId": ObjectId(user_id)})
    if pet_doc is None:
        raise HTTPException(status_code=404, detail="Pet not found")

    pet_id = pet_doc["_id"]
    last_day = monthrange(year, month)[1]
    month_start = date(year, month, 1)
    month_end = date(year, month, last_day)
    reference_date = min(date.today(), month_end)

    # 주간 옵션은 표시 range(체중 비교 구간/증상 타임라인 필터)에만 영향을 준다.
    # 종합소견/케어가이드는 원래 설계대로 항상 전체 기간을 참고해 생성하므로(기간 무관 캐싱) 여기서는 건드리지 않는다.
    if period == "week":
        period_start = reference_date - timedelta(days=6)
        period_before_date = reference_date - timedelta(days=13)
    else:
        period_start = month_start
        period_before_date = _months_before(reference_date, 1)

    weights = [doc async for doc in db.weights.find({"petId": pet_id}).sort("date", 1)]
    period_start_value = _weight_at(weights, period_start)
    current_value = _weight_at(weights, reference_date)
    period_before_value = _weight_at(weights, period_before_date)

    health_notes = pet_doc.get("healthNotes", [])
    period_notes = sorted(
        (n for n in health_notes if period_start <= n["date"].date() <= reference_date),
        key=lambda n: n["date"],
    )
    monthly_symptom_frequency = [
        SymptomFrequencyItem(date=n["date"].date().isoformat(), issue=n["note"]) for n in period_notes
    ]

    context_block = await _build_report_context(pet_doc)
    context_hash = hashlib.sha256(context_block.encode("utf-8")).hexdigest()

    cached = await db.reports.find_one({"petId": pet_id, "year": year, "month": month})
    if cached and cached.get("contextHash") == context_hash:
        report_text = cached["response"]["reportText"]
        diagnosis_texts = cached["response"]["diagnosisOpinions"]
    else:
        try:
            report_text = await call_text(prompts.REPORT_SYSTEM_PROMPT, context_block, max_tokens=1800)
        except HaiGptError:
            report_text = FALLBACK_REPORT_TEXT
            diagnosis_texts = []
        else:
            report_text = prompts.sanitize_source_labels(report_text)
            diagnosis_texts = _extract_diagnosis_opinions(report_text)
            await db.reports.update_one(
                {"petId": pet_id, "year": year, "month": month},
                {
                    "$set": {
                        "contextHash": context_hash,
                        "response": {"reportText": report_text, "diagnosisOpinions": diagnosis_texts},
                        "generatedAt": datetime.now(timezone.utc),
                    }
                },
                upsert=True,
            )

    diagnosis_opinions = [DiagnosisOpinion(id=i + 1, text=text) for i, text in enumerate(diagnosis_texts)]

    breed_guide = None
    if pet_doc.get("breed"):
        breed_guide_doc = await db.breedGuides.find_one({"breed": pet_doc["breed"]})
        if breed_guide_doc:
            breed_guide = BreedGuideFeedback(
                trainingTip=breed_guide_doc.get("trainingTip", ""),
                chronicDiseases=breed_guide_doc.get("chronicDiseases", ""),
                specialCare=breed_guide_doc.get("specialCare"),
            )

    return HealthReportOut(
        petProfile=ReportPetProfile(
            name=pet_doc["name"], age=_age_years(pet_doc["birthDate"]), breed=pet_doc.get("breed")
        ),
        period=period,
        breedGuide=breed_guide,
        weightChange=WeightChange(
            thisMonthStart=period_start_value,
            current=current_value,
            oneMonthAgo=period_before_value,
            analysisMessage=_build_analysis_message(period_start_value, current_value, period_before_value, period),
        ),
        monthlySymptomFrequency=monthly_symptom_frequency,
        diagnosisOpinions=diagnosis_opinions,
        # TODO: hospitalQuestions — 명세(API_SPEC.md §2.4) 필드명/예시값 불일치(질문형 vs 진술문),
        # 백엔드 개발자(김학래) 확인 후 구현. REPORT_SYSTEM_PROMPT는 이 필드를 생성하지 않음.
        hospitalQuestions=[],
        reportText=report_text,
    )
