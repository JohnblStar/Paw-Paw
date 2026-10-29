import { Link, NavLink, useNavigate } from 'react-router-dom'
import { FileText, House, LayoutDashboard, LogOut, PawPrint, Sparkles } from 'lucide-react'
import { usePet } from '@/context/usePet'
import { useUser } from '@/context/useUser'
import { useAuth } from '@/hooks/useAuth'
import NotificationBell from '@/components/layout/NotificationBell'

const NAV_ITEMS = [
  { to: '/main', label: '메인페이지', shortLabel: '홈', icon: House },
  { to: '/dashboard', label: '대시보드', shortLabel: '대시보드', icon: LayoutDashboard },
  { to: '/chatbot', label: 'AI챗봇', shortLabel: 'AI챗봇', icon: Sparkles },
  { to: '/report', label: '건강 레포트', shortLabel: '레포트', icon: FileText },
  { to: '/mypetsy', label: '마이펫이지', shortLabel: '마이펫', icon: PawPrint },
]

function Wordmark() {
  return (
    <Link to="/main" className="flex items-baseline whitespace-nowrap text-xl font-extrabold tracking-tight">
      <span className="text-ink">Paw</span>
      <span className="text-primary-purple">:Paw</span>
    </Link>
  )
}

export default function Navbar() {
  const { activePet } = usePet()
  const { user } = useUser()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border/70 bg-bg/80 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Wordmark />

          {/* 데스크톱: 세그먼트 내비게이션 */}
          <nav className="hidden items-center gap-1 rounded-full border border-border bg-surface-muted/80 p-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
                    isActive ? 'bg-surface text-ink shadow-chip' : 'text-ink-secondary hover:text-ink'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={15} strokeWidth={isActive ? 2.25 : 2} />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 text-sm text-ink sm:gap-2">
            <NotificationBell />
            {user?.name && (
              <div className="hidden items-center gap-2 rounded-full py-1 pl-1 pr-3 lg:flex">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-mint-soft text-xs font-bold text-primary-mint-deep">
                  {user.name[0]}
                </span>
                <span className="whitespace-nowrap font-semibold">{user.name}</span>
                {activePet && (
                  <span className="whitespace-nowrap text-xs text-ink-secondary">· {activePet.name} 보호자</span>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-surface-muted hover:text-ink"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">로그아웃</span>
              <span className="sr-only sm:hidden">로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      {/* 모바일: 하단 탭 바 */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden print:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              aria-label={item.label}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-ink' : 'text-muted hover:text-ink-secondary'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                      isActive ? 'bg-primary-mint-soft text-primary-mint-deep' : ''
                    }`}
                  >
                    <item.icon size={19} strokeWidth={isActive ? 2.25 : 1.9} />
                  </span>
                  {item.shortLabel}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}
