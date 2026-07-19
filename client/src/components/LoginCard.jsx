import KakaoLoginButton from './KakaoLoginButton'

function LoginCard() {
  return (
    <div className="flex flex-col items-center gap-6 rounded-3xl border border-border bg-bg p-8 shadow-sm sm:p-10">
      <h2 className="text-2xl font-bold">
        <span className="text-ink">Paw</span>
        <span className="text-primary-purple">:Paw</span>
      </h2>

      <KakaoLoginButton />

      <p className="text-xs text-ink-secondary">카카오 계정으로 간편하게 시작하세요</p>
    </div>
  )
}

export default LoginCard
