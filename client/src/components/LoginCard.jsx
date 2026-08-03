import KakaoLoginButton from './KakaoLoginButton'

function LoginCard() {
  return (
    <div className="flex flex-col items-center gap-7 rounded-3xl border border-border bg-white p-10 shadow-sm sm:p-12">
      <div className="text-center">
        <h2 className="text-3xl font-bold">
          <span className="text-ink">Paw</span>
          <span className="text-primary-purple">:Paw</span>
        </h2>
        <p className="mt-2 text-sm text-ink-secondary">가입 절차 없이 카카오 계정으로 바로 시작해요</p>
      </div>

      <KakaoLoginButton />

      <div className="flex w-full items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-border" />
        회원가입 없이 3초 만에 시작
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  )
}

export default LoginCard
