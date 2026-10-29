import hashlib
import json
from datetime import datetime, timezone

from openai import AsyncOpenAI

from app.core.config import settings
from app.core.database import get_database
from app.core.pet_helpers import now_kst

_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL)


class HaiGptError(Exception):
    pass


class HaiGptQuotaError(HaiGptError):
    """월간 토큰 한도에 근접해 호출을 미리 차단한 경우 (SPEC.md §7.8)."""


def is_live_mode() -> bool:
    """mock/replay 응답은 실제 분석 결과가 아니므로, 호출부는 이 값이 False면 영구 캐시에 저장하지 않는다."""
    return settings.AI_MODE == "live"


def _usage_month_key() -> str:
    return now_kst().strftime("%Y-%m")


def _replay_id(kind: str, replay_key: str) -> str:
    return hashlib.sha256(f"{kind}:{replay_key}".encode("utf-8")).hexdigest()


async def _ensure_quota() -> None:
    if settings.AI_MONTHLY_TOKEN_LIMIT <= 0:
        return
    usage = await get_database().aiUsage.find_one({"_id": _usage_month_key()})
    used = usage.get("totalTokens", 0) if usage else 0
    if used >= settings.AI_MONTHLY_TOKEN_LIMIT * settings.AI_QUOTA_SAFETY_RATIO:
        raise HaiGptQuotaError(f"월간 토큰 한도 근접: {used}/{settings.AI_MONTHLY_TOKEN_LIMIT}")


async def _record_usage(total: int) -> None:
    await get_database().aiUsage.update_one(
        {"_id": _usage_month_key()},
        {"$inc": {"totalTokens": total, "calls": 1}},
        upsert=True,
    )


async def _request(system_prompt: str, user_message: str, max_tokens: int, *, json_mode: bool) -> tuple[str, int]:
    """실제 HAI-GPT API 요청. (응답 텍스트, 사용 토큰 수)를 반환한다."""
    kwargs = {"response_format": {"type": "json_object"}} if json_mode else {}
    try:
        response = await _client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            max_tokens=max_tokens,
            **kwargs,
        )
    except Exception as exc:
        raise HaiGptError(str(exc)) from exc
    usage = getattr(response, "usage", None)
    return response.choices[0].message.content, getattr(usage, "total_tokens", 0) or 0


async def _run(kind, system_prompt, user_message, max_tokens, *, json_mode, replay_key, mock):
    """AI_MODE에 따라 실제 호출/목업/재생을 분기한다. live 모드의 성공 응답은 replay_key로 기록해두어
    발표 날 replay 모드로 같은 질문을 토큰 소모 없이 재생할 수 있게 한다 (SPEC.md §7.7)."""
    if settings.AI_MODE == "mock":
        return mock

    replay_collection = get_database().aiReplay
    if settings.AI_MODE == "replay":
        if replay_key is None:
            return mock
        recorded = await replay_collection.find_one({"_id": _replay_id(kind, replay_key)})
        return recorded["result"] if recorded else mock

    await _ensure_quota()
    content, total_tokens = await _request(system_prompt, user_message, max_tokens, json_mode=json_mode)
    await _record_usage(total_tokens)
    if json_mode:
        try:
            result = json.loads(content)
        except (json.JSONDecodeError, TypeError) as exc:
            raise HaiGptError(f"HAI-GPT가 유효한 JSON을 반환하지 않음: {content!r}") from exc
    else:
        result = content

    if replay_key is not None:
        await replay_collection.update_one(
            {"_id": _replay_id(kind, replay_key)},
            {"$set": {"kind": kind, "replayKey": replay_key, "result": result,
                      "recordedAt": datetime.now(timezone.utc)}},
            upsert=True,
        )
    return result


async def call_json(
    system_prompt: str,
    user_message: str,
    *,
    kind: str,
    mock: dict,
    max_tokens: int = 600,
    replay_key: str | None = None,
) -> dict:
    """HAI-GPT를 JSON 모드로 호출하고 파싱된 dict를 반환한다."""
    result = await _run(kind, system_prompt, user_message, max_tokens,
                        json_mode=True, replay_key=replay_key, mock=mock)
    return dict(result)


async def call_text(
    system_prompt: str,
    user_message: str,
    *,
    kind: str,
    mock: str,
    max_tokens: int = 1800,
    replay_key: str | None = None,
) -> str:
    """HAI-GPT를 일반 텍스트 모드로 호출한다 (건강 레포트용)."""
    return await _run(kind, system_prompt, user_message, max_tokens,
                      json_mode=False, replay_key=replay_key, mock=mock)
