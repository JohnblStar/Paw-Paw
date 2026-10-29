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
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-kakao px-6 py-3.5 text-[15px] font-semibold text-kakao-ink transition-all hover:brightness-95 active:scale-[0.99]"
    >
      {/* 카카오 로그인 공식 버튼 가이드: 노란 배경 + 말풍선 심볼 + 검정 라벨 */}
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="fill-kakao-ink">
        <path d="M12 3C6.48 3 2 6.48 2 10.78c0 2.77 1.86 5.2 4.66 6.58l-.95 3.5c-.08.3.26.54.52.37l4.17-2.76c.52.06 1.05.09 1.6.09 5.52 0 10-3.48 10-7.78S17.52 3 12 3Z" />
      </svg>
      카카오톡 로그인
    </button>
  )
}

export default KakaoLoginButton
