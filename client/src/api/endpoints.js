export const ENDPOINTS = {
  AUTH: {
    KAKAO_CALLBACK: '/api/v1/auth/kakao/callback',
  },
  PETS: {
    LIST: '/api/pets',
    DETAIL: (id) => `/api/pets/${id}`,
    CREATE: '/api/pets',
  },
  CHAT: {
    SEND: '/api/chat',
  },
  REPORT: {
    GENERATE: '/api/report',
    DETAIL: (id) => `/api/report/${id}`,
  },
}
