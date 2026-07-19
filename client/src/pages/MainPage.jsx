import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function MainPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg">
      <p className="text-lg font-semibold text-ink">메인페이지 (준비 중)</p>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-full border border-border px-4 py-2 text-sm text-ink-secondary"
      >
        로그아웃
      </button>
    </div>
  )
}

export default MainPage
