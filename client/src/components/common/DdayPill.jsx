export default function DdayPill({ label, dday, urgent }) {
  return (
    <div
      className={`rounded-2xl px-4 py-3 ${
        urgent ? 'bg-amber/40' : 'bg-bg border border-border'
      }`}
    >
      <p className="text-xs font-medium text-ink-secondary">{label}</p>
      <p className="text-sm font-bold text-ink">{dday >= 0 ? `D-${dday}` : `D+${Math.abs(dday)}`}</p>
    </div>
  )
}
