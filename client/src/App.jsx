import { Route, Routes } from 'react-router-dom'
import GuestOnly from './components/GuestOnly'
import RequireAuth from './components/RequireAuth'
import IntroPage from './pages/IntroPage'
import KakaoCallbackPage from './pages/KakaoCallbackPage'
import MainPage from './pages/MainPage'

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
      <Route
        path="/main"
        element={
          <RequireAuth>
            <MainPage />
          </RequireAuth>
        }
      />
    </Routes>
  )
}

export default App
