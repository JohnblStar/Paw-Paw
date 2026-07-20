import { useNavigate } from 'react-router-dom'

export default function EmptyPetState() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-white text-center">
      <p className="text-lg font-medium text-ink">
        아직 등록된 반려동물이 없어요
      </p>
      <p className="text-sm text-ink-secondary">
        반려동물을 등록하면 건강 현황을 한눈에 볼 수 있어요
      </p>
      <button
        type="button"
        onClick={() => navigate('/mypetsy')}
        className="mt-2 rounded-full bg-primary-mint px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-primary-mint-dark hover:text-white"
      >
        반려동물 등록하기
      </button>
    </div>
  )
}
