from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PORT: int = 8000
    MONGO_URI: str
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = ""
    OPENAI_MODEL: str = ""

    # SPEC.md §7.6/7.7 — live: 실제 HAI-GPT 호출 (성공 응답은 재생용으로 함께 기록),
    # mock: 고정 목업 응답 (개발기 토큰 절약), replay: 기록해둔 실제 응답 재생 (시연용, 미기록 질문은 목업)
    AI_MODE: Literal["live", "mock", "replay"] = "live"
    # SPEC.md §7.8 — 월간 토큰 한도. 0이면 사용량 기록만 하고 차단하지 않는다.
    AI_MONTHLY_TOKEN_LIMIT: int = 0
    # 한도에 닿기 전에 미리 차단하는 비율 (마지막 호출이 한도를 넘겨버리는 것을 방지)
    AI_QUOTA_SAFETY_RATIO: float = 0.9
    # 사용자 1명이 하루에 실제 LLM을 호출할 수 있는 상담 횟수 (캐시 응답은 미포함). 0이면 제한 없음.
    CHAT_DAILY_LIMIT_PER_USER: int = 20
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7

    KAKAO_CLIENT_ID: str
    KAKAO_CLIENT_SECRET: str = ""
    KAKAO_REDIRECT_URI: str

    # 배포된 프론트엔드 origin (예: https://paw-paw.vercel.app). CORS 허용 목록에 추가된다.
    FRONTEND_ORIGIN: str = ""


settings = Settings()