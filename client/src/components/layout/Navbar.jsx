import { Link, NavLink, useNavigate } from 'react-router-dom'
import { usePet } from '@/context/usePet'
import { useAuth } from '@/hooks/useAuth'
import { mockOwner } from '@/mocks/petMock'

const NAV_ITEMS = [
  { to: '/dashboard', label: '대시보드' },
  { to: '/chatbot', label: 'AI챗봇' },
  { to: '/report', label: '건강 레포트' },
  { to: '/mypetsy', label: '마이펫이지' },
]

export default function Navbar() {
  const { activePet } = usePet()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/main" className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-ink">Paw</span>
          <span className="text-xl font-bold text-primary-purple">:Paw</span>
        </Link>

        <nav className="flex items-center gap-6">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive ? 'text-primary-mint-dark' : 'text-ink-secondary hover:text-ink'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-sm text-ink">
          <span className="font-medium">{mockOwner.name}</span>
          <span className="text-ink-secondary">
            {activePet ? `· ${activePet.name} 보호자` : ''}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs text-ink-secondary underline-offset-2 hover:underline"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  )
}
