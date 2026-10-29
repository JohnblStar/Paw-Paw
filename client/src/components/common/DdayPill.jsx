import { ChevronRight } from 'lucide-react'

export default function DdayPill({ label, dday, urgent }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors group-hover:border-border-strong ${
        urgent ? 'border-amber/60 bg-amber-soft' : 'border-border bg-surface'
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{label}</p>
        <p className={`text-xs font-bold ${urgent ? 'text-amber-deep' : 'text-ink-secondary'}`}>
          {dday === 0 ? 'D-DAY' : dday > 0 ? `D-${dday}` : `D+${Math.abs(dday)}`}
        </p>
      </div>
      <ChevronRight size={16} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
    </div>
  )
}
