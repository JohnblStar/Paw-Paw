import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/instance'
import { ENDPOINTS } from '../api/endpoints'
import { useAuth } from '../hooks/useAuth'

function KakaoCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const requested = useRef(false)

  useEffect(() => {
    if (requested.current) return
    requested.current = true

    const code = searchParams.get('code')
    if (!code) {
      navigate('/', { replace: true })
      return
    }

    api
      .post(ENDPOINTS.AUTH.KAKAO_CALLBACK, { code })
      .then((data) => {
        login(data.accessToken)
        navigate('/main', { replace: true })
      })
      .catch(() => {
        navigate('/', { replace: true })
      })
  }, [searchParams, navigate, login])

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <p className="text-sm text-ink-secondary">로그인 처리 중입니다...</p>
    </div>
  )
}

export default KakaoCallbackPage
