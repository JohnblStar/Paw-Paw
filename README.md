<div align="center">

# 🐾 Paw:Paw

### 반려동물의 건강 데이터를 기록하고, AI 챗봇과 함께 관리하는 펫 헬스케어 웹 서비스

[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)
[![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=flat-square&logo=railway&logoColor=white)](https://railway.app/)

</div>

---

## 📌 Overview

반려동물의 체중·복약·예방접종 기록을 한 곳에서 관리하고, AI 챗봇에게 증상을 상담하면
자동으로 대시보드에 기록이 쌓이는 반려동물 건강관리 웹 서비스입니다.

이 프로젝트는 **포트폴리오/시연 목적**으로 제작되었으며, 실사용 서비스를 목표로 하지 않습니다.
(AI 챗봇 API가 학교 제공 월간 할당량 안에서 동작하도록 설계되었습니다.)

> 팀 **404 Thinking**의 사이드 프로젝트

## ✨ Key Features

- 🏠 **대시보드** — 반려동물 캐릭터와 함께 체중·복약·예방접종 현황을 한눈에
- 🤖 **AI 챗봇 (자유 상담)** — 증상을 물어보면 완곡한 어조로 답변하고, 특이사항은 자동으로 대시보드에 기록 (병명 확진 없음)
- 💊 **AI 챗봇 (정보 등록)** — 복약·예방접종 정보를 대화 중 자연스럽게 언급하면 버튼 기반 슬롯필링으로 정확하게 등록
- 📊 **건강 리포트** — 월간 체중 변화, 증상 빈도, AI 진단 소견을 종합한 리포트
- 🐶 **마이펫이지** — 여러 반려동물을 한 계정에서 전환하며 관리
- 🔔 **인앱 알림** — 복약 시간 알림, 예방접종 D-Day 리마인드 (1주전·1일전·당일)를 벨 아이콘으로 확인

## 🛠 Tech Stack

| 분류 | 기술 |
|------|------|
| Frontend | React.js (Vite), Tailwind CSS v4 |
| Backend | FastAPI (Python) |
| Database | MongoDB Atlas (motor 비동기 드라이버) |
| 인증 | Kakao 소셜 로그인 + JWT 세션 |
| AI | 학교 제공 HAI-GPT (ChatGPT 계열 API) |
| 알림 | 인앱 알림 (벨 아이콘, 복약·예방접종 전용) — 카카오톡 알림톡은 발신 대행사 계약이 필요해 범위 밖 |
| 배포 | Vercel (Frontend), Railway (Backend) |

## 🖥 Getting Started

### 요구사항
- Node.js 18+
- Python 3.11+
- MongoDB Atlas 계정
- Kakao Developers 앱 (REST API 키, Redirect URI 등록)
- HAI-GPT API 키 (학교 발급)

### Frontend
```bash
cd client
npm install
npm run dev
```

### Backend
```bash
cd server
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 환경변수
```bash
# server/.env (전체 목록은 server/.env.example 참고)
PORT=8000
MONGO_URI=
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=
JWT_SECRET=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
KAKAO_REDIRECT_URI=http://localhost:5173/login/kakao/callback
FRONTEND_ORIGIN=  # 배포 시에만: 배포된 프론트엔드 origin (CORS 허용용)

# client/.env
VITE_API_URL=http://localhost:8000
VITE_KAKAO_JS_KEY=
```

## 🚀 Deployment

- **Frontend (Vercel)**: Root Directory를 `client`로 설정. `client/vercel.json`이 SPA 라우팅(새로고침 시 404 방지)을 처리한다. 환경변수는 위 client `.env` 항목 그대로 Vercel 프로젝트 설정에 등록.
- **Backend (Railway)**: Root Directory를 `server`로 설정. `server/Procfile`이 시작 명령(`uvicorn main:app --host 0.0.0.0 --port $PORT`)을 지정한다. 환경변수는 위 server `.env` 항목을 그대로 등록하되, `FRONTEND_ORIGIN`은 배포된 Vercel 도메인으로 채워야 CORS가 통과한다.
- **Kakao Developers 콘솔**: 배포된 프론트엔드 도메인의 `/login/kakao/callback`을 Redirect URI로 추가 등록해야 카카오 로그인이 동작한다.

## 📁 Project Structure

```
paw-paw/
├── CLAUDE.md                # 프로젝트 공통 개발 규칙
├── client/                  # React 프론트엔드
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   └── assets/
│   └── CLAUDE.md
├── server/                  # FastAPI 백엔드
│   ├── app/
│   │   ├── api/routes/      # pet, auth, dashboard, chat, report
│   │   ├── models/
│   │   ├── services/        # AI 챗봇 로직, 알림 스케줄러
│   │   └── core/
│   └── CLAUDE.md
└── docs/
    ├── SPEC.md               # 통합 기획 스펙
    ├── DESIGN.md             # 디자인 토큰 / UI 방향
    └── features/             # 기능별 상세 스펙
```

## 👥 Team 404 Thinking

| 이름 | 역할 |
|------|------|
| 정재훈 | 팀장 / 기획 / 디자인 |
| 이지원 | 기획 / 디자인 |
| 조한별 | 프론트엔드 |
| 김학래 | 백엔드 |

## 📄 License

MIT License © 2026 404 Thinking
