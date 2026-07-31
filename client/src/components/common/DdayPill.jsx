export default function DdayPill({ label, dday, urgent }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 transition-colors group-hover:border-primary-mint-dark ${
        urgent ? 'border-transparent bg-amber/40' : 'border-border bg-bg'
      }`}
    >
      <p className="text-xs font-medium text-ink-secondary">{label}</p>
      <p className="text-sm font-bold text-ink">{dday === 0 ? 'D-DAY' : dday > 0 ? `D-${dday}` : `D+${Math.abs(dday)}`}</p>
    </div>
  )
}