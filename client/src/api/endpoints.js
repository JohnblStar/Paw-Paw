export const ENDPOINTS = {
  AUTH: {
    KAKAO_CALLBACK: '/api/v1/auth/kakao/callback',
  },
  USERS: {
    ME: '/api/v1/users/me',
    PETS: '/api/v1/users/pets',
    CALL_PET: (petId) => `/api/v1/users/pets/${petId}/call`,
  },
  PETS: {
    CREATE: '/api/v1/pets',
    UPDATE: (petId) => `/api/v1/pets/${petId}`,
    DELETE: (petId) => `/api/v1/pets/${petId}`,
    DASHBOARD: (petId) => `/api/v1/pets/${petId}/dashboard`,
    WEIGHTS: (petId) => `/api/v1/pets/${petId}/weights`,
    WEIGHT_DETAIL: (petId, weightId) => `/api/v1/pets/${petId}/weights/${weightId}`,
    MEDICATIONS_TODAY: (petId) => `/api/v1/pets/${petId}/medications/today`,
    MEDICATIONS_CALENDAR: (petId) => `/api/v1/pets/${petId}/medications/calendar`,
    MEDICATION_CHECK: (petId, medicationId) => `/api/v1/pets/${petId}/medications/${medicationId}/check`,
    REPORT_MONTHLY: (petId) => `/api/v1/pets/${petId}/report/monthly`,
  },
  CHAT: {
    QUERY: '/api/v1/chat/query',
  },
}
