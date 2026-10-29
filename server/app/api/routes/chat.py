import hashlib
import re
from datetime import date, datetime, timedelta, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.core.database import get_database
from app.core.deps import get_current_user
from app.core.pet_helpers import age_years, today_kst, to_datetime
from app.models.pet import PetOut
from app.models.chat import (
    ChatQueryRequest,
    ChatQueryResponse,
    ChatSummaryResponse,
    DetectedSymptom,
    RegistrationSuggestion,
)
from app.core.config import settings
from app.services import prompts
from app.services.hai_gpt import HaiGptError, call_json, is_live_mode
from app.services.mock_responses import MOCK_CONSULT
from app.services.symptom_guard import sanitize_symptom_summary

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])

# 정규식/키워드 기반 부위 추출 — LLM 미호출 (토큰 절약 원칙)
BODY_PART_KEYWORDS = [
    "발", "귀", "눈", "피부", "다리", "허리", "관절", "꼬리",
    "입", "코", "배", "가슴", "머리", "잇몸", "이빨", "털",
]


# 부위 키워드와 글자가 겹치지만 부위가 아닌 단어. "발진"은 피부 증상이라 피부로 보정한다.
AREA_FALSE_FRIENDS = {
    "발진": "피부", "발작": None, "발열": None, "배변": None, "배뇨": None,
    "입맛": None, "입질": None, "머리카락": "털",
}


def _extract_area(text: str | None) -> str | None:
    """가장 먼저 언급된 부위를 반환한다. 목록 순서가 아니라 문장 내 등장 위치 기준이다."""
    if not text:
        return None
    candidates: list[tuple[int, str]] = []
    masked = text
    for word, mapped in AREA_FALSE_FRIENDS.items():
        for match in re.finditer(word, text):
            if mapped:
                candidates.append((match.start(), mapped))
        masked = masked.replace(word, "□" * len(word))
    for keyword in BODY_PART_KEYWORDS:
        index = masked.find(keyword)
        if index != -1:
            candidates.append((index, keyword))
    return min(candidates)[1] if candidates else None


# 등록 감지기 — 증상 감지기와 병행 동작하는 별도 감지기, LLM 미호출 (토큰 절약 원칙)
MEDICATION_TRIGGER_KEYWORDS = ["약 먹었", "약 먹였", "약 줬", "약을 먹", "복용했", "약 먹여", "약 챙겨줬"]
VACCINATION_TRIGGER_KEYWORDS = ["접종했", "예방접종", "주사 맞", "백신 맞", "검진 받", "검진했", "검진"]
EXPLICIT_REGISTRATION_KEYWORD = "등록"
# "검진 때 뭘 물어봐야 해?"처럼 키워드가 들어간 일반 질문에는 등록을 제안하지 않는다.
_QUESTION_RE = re.compile(r"(\?|까요?|나요|가요|뭐|무엇|어떻게|언제|왜|어디|얼마나|[해돼되]요?\s*$)")


def _detect_registration_intent(text: str) -> RegistrationSuggestion | None:
    is_explicit = EXPLICIT_REGISTRATION_KEYWORD in text
    if not is_explicit and _QUESTION_RE.search(text):
        return None

    has_medication = any(keyword in text for keyword in MEDICATION_TRIGGER_KEYWORDS)
    has_vaccination = any(keyword in text for keyword in VACCINATION_TRIGGER_KEYWORDS)
    if has_vaccination and not has_medication:
        return RegistrationSuggestion(type="single_date")
    if has_medication or is_explicit:
        return RegistrationSuggestion(type="medication")
    return None


# 반복 질문 캐싱 — 동일 질문 재입력 시 LLM을 다시 호출하지 않는다 (SPEC.md §7.9, 토큰 절약 원칙).
# TTL을 짧게 두는 이유: 컨텍스트(체중/복약 등)가 시간에 따라 바뀔 수 있어 오래 캐싱하면
# 답변이 최신 상태를 반영하지 못할 수 있다.
CHAT_CACHE_TTL_SECONDS = 600


# 후속 질문 문맥으로 넘기는 직전 1턴의 최대 길이 (토큰 절약)
PREVIOUS_QUESTION_MAX_CHARS = 100
PREVIOUS_ANSWER_MAX_CHARS = 200
DAILY_LIMIT_REPLY = "오늘 사용할 수 있는 AI 상담 횟수를 모두 사용했어요. 내일 다시 이용해 주세요."
QUOTA_LIMIT_REPLY = "AI 상담이 일시적으로 제한됩니다. 잠시 후 다시 시도해 주세요."


def _normalize_question(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip())


def _build_user_message(body: ChatQueryRequest) -> str:
    if body.previousTurn is None:
        return body.message
    question = _normalize_question(body.previousTurn.question)[:PREVIOUS_QUESTION_MAX_CHARS]
    answer = _normalize_question(body.previousTurn.answer)[:PREVIOUS_ANSWER_MAX_CHARS]
    return f"[직전 대화]\n보호자: {question}\nAI: {answer}\n\n[현재 질문]\n{body.message}"


def _merge_notes(existing: str, new: str) -> str:
    if new in existing:
        return existing
    if existing in new:
        return new
    return f"{existing}, {new}"


async def _consume_daily_chat_quota(db, user_id: str) -> bool:
    """사용자별 하루 실제 LLM 호출 횟수를 1 늘리고, 한도 안이면 True를 반환한다."""
    if settings.CHAT_DAILY_LIMIT_PER_USER <= 0 or not is_live_mode():
        return True
    today = today_kst()
    doc = await db.chatDailyUsage.find_one_and_update(
        {"_id": f"{user_id}:{today.isoformat()}"},
        {"$inc": {"count": 1}, "$setOnInsert": {"expiresAt": datetime.now(timezone.utc) + timedelta(days=2)}},
        upsert=True,
        return_document=True,
    )
    return doc["count"] <= settings.CHAT_DAILY_LIMIT_PER_USER


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
        f"나이: {age_years(pet_doc['birthDate'])}세 / 현재 체중: {pet_doc['weight']}kg / "
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

    registration_suggestion = _detect_registration_intent(body.message)

    normalized_question = _normalize_question(body.message)
    # 직전 대화가 함께 오면 같은 질문이라도 문맥에 따라 답이 달라지므로 캐시 키에 포함한다.
    cache_source = f"{active_pet_id}:{normalized_question}"
    if body.previousTurn is not None:
        cache_source += f"|{_normalize_question(body.previousTurn.question)[:PREVIOUS_QUESTION_MAX_CHARS]}"
    cache_key = hashlib.sha256(cache_source.encode("utf-8")).hexdigest()
    cached_entry = await db.chatCache.find_one({"_id": cache_key})

    if cached_entry:
        result = cached_entry["result"]
    else:
        def _limited_reply(reply: str) -> ChatQueryResponse:
            return ChatQueryResponse(
                reply=reply,
                isSymptomDetected=False,
                detectedSymptom=None,
                suspectedSymptom=None,
                registrationSuggestion=registration_suggestion,
            )

        if not await _consume_daily_chat_quota(db, user_id):
            return _limited_reply(DAILY_LIMIT_REPLY)

        context_block = await _build_context_block(pet_doc)
        system_prompt = prompts.CONSULT_SYSTEM_PROMPT + "\n\n" + context_block
        try:
            result = await call_json(
                system_prompt,
                _build_user_message(body),
                kind="consult",
                mock=MOCK_CONSULT,
                replay_key=normalized_question,
            )
        except HaiGptError:
            return _limited_reply(QUOTA_LIMIT_REPLY)
        result["answerText"] = prompts.sanitize_source_labels(result.get("answerText", ""))
        result["suspectedSymptom"] = prompts.sanitize_source_labels(result.get("suspectedSymptom"))
        if result.get("symptomSummary"):
            result["symptomSummary"] = sanitize_symptom_summary(
                result["symptomSummary"], _extract_area(result["symptomSummary"])
            )
        await db.chatCache.update_one(
            {"_id": cache_key},
            {
                "$set": {
                    "result": result,
                    "expiresAt": datetime.now(timezone.utc) + timedelta(seconds=CHAT_CACHE_TTL_SECONDS),
                }
            },
            upsert=True,
        )

    is_detected = bool(result.get("isSymptomDetected"))
    symptom_summary = result.get("symptomSummary")
    suspected_symptom = result.get("suspectedSymptom")

    detected_symptom = None
    updated_pet = None
    # 캐시로 재사용된 응답은 이전 호출 때 이미 healthNotes에 기록되어 있으므로 중복 저장하지 않는다.
    if is_detected and symptom_summary:
        area = _extract_area(symptom_summary)
        detected_symptom = DetectedSymptom(area=area, description=symptom_summary)

        if not cached_entry:
            today = today_kst()
            notes = pet_doc.setdefault("healthNotes", [])
            # 같은 날 같은 부위 기록은 질문 문장이 달라도 한 건으로 합친다 (중복 기록 방지).
            # 부위를 특정하지 못한 기록("기타")은 서로 다른 증상일 수 있어 합치지 않는다.
            same_day_note = next(
                (n for n in notes if area and n["date"].date() == today and n.get("bodyPart") == area),
                None,
            )
            if same_day_note:
                same_day_note["note"] = _merge_notes(same_day_note["note"], symptom_summary)
                same_day_note["suspectedSymptom"] = suspected_symptom or same_day_note.get("suspectedSymptom")
                await db.pets.update_one(
                    {"_id": pet_doc["_id"], "healthNotes.id": same_day_note["id"]},
                    {"$set": {
                        "healthNotes.$.note": same_day_note["note"],
                        "healthNotes.$.suspectedSymptom": same_day_note["suspectedSymptom"],
                    }},
                )
            else:
                new_note = {
                    "id": str(ObjectId()),
                    "date": to_datetime(today),
                    "bodyPart": area or "기타",
                    "note": symptom_summary,
                    "suspectedSymptom": suspected_symptom,
                }
                await db.pets.update_one(
                    {"_id": pet_doc["_id"]},
                    {"$push": {"healthNotes": new_note}},
                )
                notes.append(new_note)
            # 프론트가 이 응답만으로 PetProvider 캐시를 즉시 동기화할 수 있도록,
            # 방금 반영한 기록을 메모리상의 pet_doc에도 반영해서 함께 내려준다.
            updated_pet = PetOut.from_mongo(pet_doc)

    return ChatQueryResponse(
        reply=result.get("answerText", ""),
        isSymptomDetected=is_detected,
        detectedSymptom=detected_symptom,
        suspectedSymptom=suspected_symptom,
        registrationSuggestion=registration_suggestion,
        pet=updated_pet,
    )


# "현재 세션"은 서버가 별도 sessionId를 추적하지 않으므로 "오늘 이 펫에 대해 감지된 증상들"로
# 정의한다 — healthNotes가 이미 날짜별로 쌓이므로 추가 저장소 없이 당일치만 필터링해서 재사용한다.
@router.post("/summary", response_model=ChatSummaryResponse)
async def chat_summary(user_id: str = Depends(get_current_user)):
    db = get_database()
    user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    active_pet_id = user_doc.get("activePetId") if user_doc else None
    if active_pet_id is None:
        raise HTTPException(status_code=404, detail="활성화된 반려동물이 없습니다")

    pet_doc = await db.pets.find_one({"_id": active_pet_id, "ownerId": ObjectId(user_id)})
    if pet_doc is None:
        raise HTTPException(status_code=404, detail="Pet not found")

    today = today_kst()
    today_notes = [n for n in pet_doc.get("healthNotes", []) if n["date"].date() == today]

    return ChatSummaryResponse(
        summaryTitle=f"{pet_doc['name']} 답변 요약 문서",
        uploadedSymptoms=[n["note"] for n in today_notes],
        suspectedSymptoms=[n["suspectedSymptom"] for n in today_notes if n.get("suspectedSymptom")],
        notice="본 요약에 대한 자세한 근거는 답변 전체를 확인해 주세요.",
    )
