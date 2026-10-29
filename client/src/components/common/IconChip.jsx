// 카드 헤더·목록 앞에 붙는 의미 색 아이콘 칩.
// 색 규칙(docs/DESIGN.md): mint=완료·정상, purple=AI 전용, amber=일정, coral=경고, neutral=일반 정보
const TONE_CLASS = {
  mint: 'bg-primary-mint-soft text-primary-mint-deep',
  purple: 'bg-primary-purple-soft text-primary-purple-deep',
  amber: 'bg-amber-soft text-amber-deep',
  coral: 'bg-coral-soft text-coral-deep',
  neutral: 'bg-surface-muted text-ink-secondary',
}

const SIZE_CLASS = {
  sm: 'h-7 w-7 rounded-lg',
  md: 'h-9 w-9 rounded-xl',
  lg: 'h-12 w-12 rounded-2xl',
}

const ICON_SIZE = { sm: 15, md: 18, lg: 22 }

export default function IconChip({ icon: Icon, tone = 'neutral', size = 'md', className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center ${SIZE_CLASS[size]} ${TONE_CLASS[tone]} ${className}`}
    >
      <Icon size={ICON_SIZE[size]} strokeWidth={2} />
    </span>
  )
}
