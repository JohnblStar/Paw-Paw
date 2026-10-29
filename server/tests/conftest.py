import os

# Settings()가 import 시점에 필수 환경변수를 검증하므로, 순수 함수 테스트용 더미 값을 먼저 채운다.
# 테스트는 DB/LLM에 접속하지 않는다.
for key, value in {
    "MONGO_URI": "mongodb://localhost:27017",
    "JWT_SECRET": "test-secret",
    "KAKAO_CLIENT_ID": "test",
    "KAKAO_REDIRECT_URI": "http://localhost/callback",
    "AI_MODE": "mock",
}.items():
    os.environ.setdefault(key, value)
