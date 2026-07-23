import { useEffect } from 'react'

function KakaoLoginButton() {
  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(import.meta.env.VITE_KAKAO_JS_KEY)
    }
  }, [])

  const handleLogin = () => {
    window.Kakao?.Auth.authorize({
      redirectUri: `${window.location.origin}/login/kakao/callback`,
    })
  }

  return (
    <button
      type="button"
      onClick={handleLogin}
      className="w-full rounded-full bg-primary-mint px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-mint-dark"
    >
      카카오톡 로그인
    </button>
  )
}

export default KakaoLoginButton
