export const INPUT_CLASS =
  'w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-muted transition-colors hover:border-border-strong focus:border-primary-mint-dark focus:outline-none focus:ring-4 focus:ring-primary-mint-soft'

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50'

export const PRIMARY_BUTTON_CLASS = `${BUTTON_BASE} bg-ink text-white shadow-chip hover:bg-ink/85`

export const SECONDARY_BUTTON_CLASS = `${BUTTON_BASE} border border-border bg-surface text-ink-secondary hover:border-border-strong hover:text-ink`

export const DANGER_BUTTON_CLASS = `${BUTTON_BASE} border border-coral/40 bg-surface text-coral-deep hover:bg-coral-soft`

// 카드 헤더 등에 붙는 작은 보조 버튼 (아이콘 + 짧은 라벨)
export const CHIP_BUTTON_CLASS =
  'inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink-secondary transition-colors hover:border-border-strong hover:text-ink disabled:opacity-50'

// 텍스트형 인라인 액션 (수정/삭제 등)
export const TEXT_ACTION_CLASS =
  'inline-flex items-center gap-1 rounded-md text-xs font-medium text-ink-secondary transition-colors hover:text-ink'

export const TEXT_DANGER_ACTION_CLASS =
  'inline-flex items-center gap-1 rounded-md text-xs font-medium text-coral-deep transition-colors hover:text-coral'
