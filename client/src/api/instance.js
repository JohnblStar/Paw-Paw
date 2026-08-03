import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // HAI-GPT를 직접 호출하는 /chat/query, /report/monthly는 응답에 10초 가까이 걸릴 수 있어
  // 여유를 두고 30초로 설정한다 (나머지 엔드포인트는 모두 1초 이내 응답).
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/'
    } else {
      console.error(error.response?.data?.detail)
    }
    return Promise.reject(error)
  }
)

export default api
