export const ENDPOINTS = {
  AUTH: {
    KAKAO_CALLBACK: '/api/v1/auth/kakao/callback',
  },
  // NOTE: docs/features/mypetsy.md와 실제 백엔드(server/app/api/routes/pets.py, prefix=/api/v1/pets)는
  // 이 파일과 경로 표기가 다르다. pet 라우트 실연동 시 백엔드 쪽과 재조율 필요.
  PETS: {
    LIST: '/api/pets',
    DETAIL: (id) => `/api/pets/${id}`,
    CREATE: '/api/pets',
    UPDATE: (id) => `/api/pets/${id}`,
    DELETE: (id) => `/api/pets/${id}`,
  },
  CHAT: {
    SEND: '/api/chat',
  },
  REPORT: {
    GENERATE: '/api/report',
    DETAIL: (id) => `/api/report/${id}`,
  },
}
