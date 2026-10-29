import { Outlet } from 'react-router-dom'
import RequireAuth from '@/components/RequireAuth'
import { UserProvider } from '@/context/UserProvider'
import { PetProvider } from '@/context/PetProvider'
import { WeightProvider } from '@/context/WeightProvider'
import Navbar from '@/components/layout/Navbar'

// Navbar(와 그 안의 NotificationBell)를 라우트 전환과 무관하게 로그인 세션 내내 마운트된
// 상태로 유지하기 위해, 페이지별 PageLayout이 아니라 이 공통 레이아웃에서 한 번만 렌더링한다
// — 그래야 페이지 이동해도 알림 폴링/토스트 상태가 초기화되지 않는다.
export default function AuthenticatedLayout() {
  return (
    <RequireAuth>
      <UserProvider>
        <PetProvider>
          <WeightProvider>
            <div className="relative flex min-h-dvh flex-col overflow-hidden bg-bg print:overflow-visible">
              <div className="pointer-events-none absolute -right-40 -top-32 h-[28rem] w-[28rem] rounded-full bg-primary-mint/20 blur-3xl print:hidden" />
              <div className="pointer-events-none absolute -bottom-48 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary-purple/15 blur-3xl print:hidden" />

              <Navbar />
              <main className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-28 pt-6 sm:px-6 sm:pt-8 md:pb-12 print:p-0">
                <Outlet />
              </main>
            </div>
          </WeightProvider>
        </PetProvider>
      </UserProvider>
    </RequireAuth>
  )
}
