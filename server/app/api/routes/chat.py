from datetime import date, datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.core.database import get_database
from app.core.deps import get_current_user
from app.models.chat import ChatQueryRequest, ChatQueryResponse, DetectedSymptom, RegistrationSuggestion
from app.services import prompts
from app.services.hai_gpt import HaiGptError, call_json

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])

# 정규식/키워드 기반 부위 추출 — LLM 미호출 (토큰 절약 원칙)
BODY_PART_KEYWORDS = [
    "발", "귀", "눈", "피부", "다리", "허리", "관절", "꼬리",
    "입", "코", "배", "가슴", "머리", "잇몸", "이빨", "털",
]


def _extract_area(text: str | None) -> str | None:
    if not text:
        return None
    for keyword in BODY_PART_KEYWORDS:
        if keyword in text:
            return keyword
    return None


# 등록 감지기 — 증상 감지기와 병행 동작하는 별도 감지기, LLM 미호출 (토큰 절약 원칙)
MEDICATION_TRIGGER_KEYWORDS = ["약 먹었", "약 줬", "약을 먹", "복용했", "약 먹여", "약 챙겨줬"]
VACCINATION_TRIGGER_KEYWORDS = ["접종했", "예방접종", "주사 맞", "백신 맞", "검진 받", "검진했"]


def _detect_registration_intent(text: str) -> RegistrationSuggestion | None:
    if any(keyword in text for keyword in MEDICATION_TRIGGER_KEYWORDS):
        return RegistrationSuggestion(type="medication")
    if any(keyword in text for keyword in VACCINATION_TRIGGER_KEYWORDS):
        return RegistrationSuggestion(type="single_date")
    return None


def _to_datetime(d: date) -> datetime:
    return datetime(d.year, d.month, d.day, tzinfo=timezone.utc)


def _age_years(birth_date: date) -> int:
    today = date.today()
    years = today.year - birth_date.year
    if (today.month, today.day) < (birth_date.month, birth_date.day):
        years -= 1
    return years


async def _build_context_block(pet_doc: dict) -> str:
    db = get_database()
    pet_id = pet_doc["_id"]

    recent_weights_cursor = db.weights.find({"petId": pet_id}).sort("date", -1).limit(2)
    recent_weights = [doc async for doc in recent_weights_cursor]

    medications = [doc async for doc in db.medications.find({"petId": pet_id})]

    recent_notes = pet_doc.get("healthNotes", [])[-2:]

    breed_guide_doc = await db.breedGuides.find_one({"breed": pet_doc.get("breed")})

    lines = [
        "[반려동물 기본정보]",
        f"이름: {pet_doc['name']} / 품종: {pet_doc.get('breed') or '미상'} / "
        f"나이: {_age_years(pet_doc['birthDate'])}세 / 현재 체중: {pet_doc['weight']}kg / "
        f"성별: {pet_doc['sex']} (중성화: {'완료' if pet_doc['neutered'] else '미완료'})",
        "",
        "[최근 체중]",
    ]
    if recent_weights:
        lines += [f"- {w['date'].date()}: {w['value']}kg" for w in reversed(recent_weights)]
    else:
        lines.append("- 기록 없음")

    lines += ["", "[복용 중인 약]"]
    if medications:
        lines += [f"- {m['title']}" for m in medications]
    else:
        lines.append("- 없음")

    lines += ["", "[최근 특이사항]"]
    if recent_notes:
        lines += [f"- {n['date'].date()} ({n['bodyPart']}): {n['note']}" for n in recent_notes]
    else:
        lines.append("- 없음")

    if breed_guide_doc:
        guide_text = "\n".join(
            filter(None, [
                breed_guide_doc.get("trainingTip"),
                breed_guide_doc.get("chronicDiseases"),
                breed_guide_doc.get("specialCare"),
            ])
        )
        lines += ["", "[품종 가이드 — 참고용 배경지식, 사용자에게 출처로 노출하지 말 것]", guide_text]

    return "\n".join(lines)


@router.post("/query", response_model=ChatQueryResponse)
async def chat_query(body: ChatQueryRequest, user_id: str = Depends(get_current_user)):
    db = get_database()
    user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    active_pet_id = user_doc.get("activePetId") if user_doc else None
    if active_pet_id is None:
        raise HTTPException(status_code=404, detail="활성화된 반려동물이 없습니다")

    pet_doc = await db.pets.find_one({"_id": active_pet_id, "ownerId": ObjectId(user_id)})
    if pet_doc is None:
        raise HTTPException(status_code=404, detail="Pet not found")

    context_block = await _build_context_block(pet_doc)
    system_prompt = prompts.CONSULT_SYSTEM_PROMPT + "\n\n" + context_block
    registration_suggestion = _detect_registration_intent(body.message)

    try:
        result = await call_json(system_prompt, body.message)
    except HaiGptError:
        return ChatQueryResponse(
            reply="AI 상담이 일시적으로 제한됩니다. 잠시 후 다시 시도해 주세요.",
            isSymptomDetected=False,
            detectedSymptom=None,
            suspectedSymptom=None,
            registrationSuggestion=registration_suggestion,
        )

    is_detected = bool(result.get("isSymptomDetected"))
    symptom_summary = result.get("symptomSummary")
    suspected_symptom = result.get("suspectedSymptom")

    detected_symptom = None
    if is_detected and symptom_summary:
        area = _extract_area(symptom_summary)
        detected_symptom = DetectedSymptom(area=area, description=symptom_summary)

        await db.pets.update_one(
            {"_id": pet_doc["_id"]},
            {"$push": {"healthNotes": {
                "date": _to_datetime(date.today()),
                "bodyPart": area or "기타",
                "note": symptom_summary,
            }}},
        )

    return ChatQueryResponse(
        reply=result.get("answerText", ""),
        isSymptomDetected=is_detected,
        detectedSymptom=detected_symptom,
        suspectedSymptom=suspected_symptom,
        registrationSuggestion=registration_suggestion,
    )
