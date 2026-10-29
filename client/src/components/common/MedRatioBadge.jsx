export default function MedRatioBadge({ taken, total, className = '' }) {
  const complete = taken === total
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
        complete ? 'bg-primary-mint-soft text-primary-mint-deep' : 'bg-coral-soft text-coral-deep'
      } ${className}`}
    >
      {taken}/{total}
    </span>
  )
}
