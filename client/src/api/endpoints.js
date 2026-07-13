export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
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
