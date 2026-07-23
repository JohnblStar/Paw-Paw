from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # 1. 미들웨어 임포트
from contextlib import asynccontextmanager
# ... (기존에 임포트된 motor, dotenv 등은 그대로 유지)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # (기존 MongoDB 연결 코드 유지)
    print("MongoDB Atlas Connection Successful!")
    yield
    # (기존 종료 코드 유지)

app = FastAPI(lifespan=lifespan)

# 2. CORS 허용 주소 리스트 설정 (프론트엔드 개발 서버 주소)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# 3. FastAPI 마스터 방화벽에 허용 규칙 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, PUT, DELETE 모두 허용
    allow_headers=["*"],  # 모든 헤더 허용
)

@app.get("/health")
async def health_check():
    # (기존 헬스체크 코드 유지)
    return {"status": "healthy", "database": "connected"}