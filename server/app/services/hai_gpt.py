import json

from openai import AsyncOpenAI

from app.core.config import settings

_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL)


class HaiGptError(Exception):
    pass


async def call_json(system_prompt: str, user_message: str, *, max_tokens: int = 600) -> dict:
    """HAI-GPT를 JSON 모드로 호출하고 파싱된 dict를 반환한다."""
    try:
        response = await _client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            max_tokens=max_tokens,
            response_format={"type": "json_object"},
        )
    except Exception as exc:
        raise HaiGptError(str(exc)) from exc

    content = response.choices[0].message.content
    try:
        return json.loads(content)
    except (json.JSONDecodeError, TypeError) as exc:
        raise HaiGptError(f"HAI-GPT가 유효한 JSON을 반환하지 않음: {content!r}") from exc


async def call_text(system_prompt: str, user_message: str, *, max_tokens: int = 1800) -> str:
    """HAI-GPT를 일반 텍스트 모드로 호출한다 (건강 레포트용)."""
    try:
        response = await _client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            max_tokens=max_tokens,
        )
    except Exception as exc:
        raise HaiGptError(str(exc)) from exc

    return response.choices[0].message.content
