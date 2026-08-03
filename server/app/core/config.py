from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PORT: int = 8000
    MONGO_URI: str
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = ""
    OPENAI_MODEL: str = ""
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7

    KAKAO_CLIENT_ID: str
    KAKAO_CLIENT_SECRET: str = ""
    KAKAO_REDIRECT_URI: str

    # 배포된 프론트엔드 origin (예: https://paw-paw.vercel.app). CORS 허용 목록에 추가된다.
    FRONTEND_ORIGIN: str = ""


settings = Settings()