import { useNavigate } from 'react-router-dom'
import { PawPrint, Plus } from 'lucide-react'
import IconChip from '@/components/common/IconChip'
import { PRIMARY_BUTTON_CLASS } from '@/constants/formStyles'

export default function EmptyPetState({ to = '/mypetsy' }) {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border-strong bg-surface/70 px-6 text-center">
      <IconChip icon={PawPrint} tone="mint" size="lg" className="mb-2" />
      <p className="text-lg font-bold tracking-tight text-ink">
        아직 등록된 반려동물이 없어요
      </p>
      <p className="text-sm text-ink-secondary">
        반려동물을 등록하면 건강 현황을 한눈에 볼 수 있어요
      </p>
      <button type="button" onClick={() => navigate(to)} className={`mt-3 ${PRIMARY_BUTTON_CLASS}`}>
        <Plus size={16} />
        반려동물 등록하기
      </button>
    </div>
  )
}
