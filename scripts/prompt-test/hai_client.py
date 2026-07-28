"""HAI-GPT 호출 래퍼. server/.env 의 자격증명을 그대로 읽어서 사용한다.
서버 기동/DB 연결 없이 독립적으로 동작한다 (본 구현 전 프롬프트 검증용).
"""
import json
from pathlib import Path

from dotenv import load_dotenv
import os

SERVER_ENV_PATH = Path(__file__).resolve().parents[2] / "server" / ".env"
load_dotenv(dotenv_path=SERVER_ENV_PATH)

from openai import OpenAI

_client = OpenAI(
    api_key=os.environ["OPENAI_API_KEY"],
    base_url=os.environ["OPENAI_BASE_URL"],
)
_MODEL = os.environ["OPENAI_MODEL"]

_session_total_tokens = 0


def call_hai_gpt(system_prompt: str, user_message: str, *, json_mode: bool = False, max_tokens: int = 800):
    """HAI-GPT에 system+user 메시지를 보내고 (content, usage_dict)를 반환한다."""
    kwargs = {}
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    response = _client.chat.completions.create(
        model=_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        max_tokens=max_tokens,
        **kwargs,
    )

    content = response.choices[0].message.content
    usage = {
        "prompt_tokens": response.usage.prompt_tokens,
        "completion_tokens": response.usage.completion_tokens,
        "total_tokens": response.usage.total_tokens,
    }

    global _session_total_tokens
    _session_total_tokens += usage["total_tokens"]

    return content, usage


def print_usage(label: str, usage: dict):
    print(f"[토큰 사용량 — {label}] prompt={usage['prompt_tokens']} "
          f"completion={usage['completion_tokens']} total={usage['total_tokens']}")


def print_session_total():
    print(f"[세션 누적 토큰] {_session_total_tokens}")


def pretty_json(content: str):
    try:
        return json.dumps(json.loads(content), ensure_ascii=False, indent=2)
    except (json.JSONDecodeError, TypeError):
        return content
