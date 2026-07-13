# SPEC_AXIOS.md — Axios 인스턴스 모듈화 명세

## 프로젝트 컨텍스트

- **프로젝트명**: PAW-PAW
- **프론트엔드**: React.js (Vite), Tailwind CSS v4
- **백엔드**: FastAPI (Port 8000)
- **프론트 개발 서버**: Port 5173
- **인증 방식**: JWT (Bearer Token)

---

## 목표

모든 API 요청에서 공통으로 필요한 설정을 중앙화한다.
각 컴포넌트에서 매번 URL, 토큰, 에러 처리를 반복하지 않도록 한다.

---

## 폴더 구조

아래 구조로 파일을 생성할 것.

```
client/
└── src/
    └── api/
        ├── instance.js       # Axios 인스턴스 설정
        └── endpoints.js      # API 엔드포인트 상수 모음
```

---

## instance.js 구현 명세

### 기본 설정

| 항목 | 값 |
|------|----|
| baseURL | `import.meta.env.VITE_API_URL` (환경변수에서 읽음) |
| timeout | 10000 (10초) |
| Content-Type | `application/json` |

### Request Interceptor (요청 전처리)

- `localStorage`에서 `access_token` 키로 JWT 토큰을 읽어옴
- 토큰이 존재하면 요청 헤더에 `Authorization: Bearer {token}` 자동 첨부
- 토큰이 없으면 헤더 미첨부 그대로 통과

### Response Interceptor (응답 후처리)

- **성공 (2xx)**: 응답 데이터 그대로 반환
- **401 Unauthorized**: `localStorage`에서 `access_token` 삭제 후 `/login` 페이지로 리다이렉트
- **그 외 에러**: `error.response.data.detail` 메시지를 콘솔에 출력 후 `Promise.reject`로 에러 전파

---

## endpoints.js 구현 명세

아래 상수들을 객체 형태로 정의할 것.

```
AUTH
  - LOGIN: '/api/auth/login'
  - REGISTER: '/api/auth/register'
  - ME: '/api/auth/me'

PETS
  - LIST: '/api/pets'
  - DETAIL: (id) => `/api/pets/${id}`
  - CREATE: '/api/pets'

CHAT
  - SEND: '/api/chat'

REPORT
  - GENERATE: '/api/report'
  - DETAIL: (id) => `/api/report/${id}`
```

---

## 환경변수 설정

`client/` 루트에 `.env` 파일 생성 및 `.env.example`도 함께 생성할 것.

```
# .env
VITE_API_URL=http://localhost:8000

# .env.example
VITE_API_URL=http://localhost:8000
```

`.gitignore`에 `.env`가 포함되어 있는지 확인할 것.

---

## 사용 예시 (참고용, 구현 불필요)

```js
import api from '@/api/instance';
import { ENDPOINTS } from '@/api/endpoints';

const response = await api.post(ENDPOINTS.AUTH.LOGIN, { email, password });
```

---

## 제약 조건

- `axios` 라이브러리는 이미 설치되어 있음. 추가 설치 불필요.
- 절대 경로 alias `@` → `src/`는 `vite.config.js`에 설정할 것.
- 토큰 저장 키는 반드시 `access_token`으로 통일할 것.
- 에러 처리 시 `alert()`는 사용하지 말 것. 콘솔 출력만 할 것.
