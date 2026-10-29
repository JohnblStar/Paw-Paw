import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/instance'
import { ENDPOINTS } from '../api/endpoints'
import { useAuth } from '../hooks/useAuth'

function KakaoCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const requested = useRef(false)
  const [error, setError] = useState(null)

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
      .catch((err) => {
        console.error('Kakao login failed:', err.response?.data ?? err.message)
        setError(err.response?.data?.detail ?? err.message ?? '알 수 없는 오류')
      })
  }, [searchParams, navigate, login])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center">
        <p className="text-base font-bold text-coral-deep">로그인에 실패했어요</p>
        <p className="max-w-md text-xs text-ink-secondary">{error}</p>
        <button
          type="button"
          onClick={() => navigate('/', { replace: true })}
          className="mt-3 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/85"
        >
          처음으로 돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <p className="animate-pulse text-sm text-ink-secondary">로그인 처리 중입니다...</p>
    </div>
  )
}

export default KakaoCallbackPage
