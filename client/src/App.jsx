import { Route, Routes } from 'react-router-dom'
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout'
import GuestOnly from './components/GuestOnly'
import IntroPage from './pages/IntroPage'
import KakaoCallbackPage from './pages/KakaoCallbackPage'
import MainPage from './pages/MainPage'
import Dashboard from './pages/Dashboard'
import ComingSoon from './pages/ComingSoon'

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <GuestOnly>
            <IntroPage />
          </GuestOnly>
        }
      />
      <Route path="/auth/kakao/callback" element={<KakaoCallbackPage />} />

      <Route element={<AuthenticatedLayout />}>
        <Route path="/main" element={<MainPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chatbot" element={<ComingSoon label="AI챗봇" />} />
        <Route path="/report" element={<ComingSoon label="건강 레포트" />} />
        <Route path="/mypetsy" element={<ComingSoon label="마이펫이지" />} />
      </Route>
    </Routes>
  )
}

export default App
