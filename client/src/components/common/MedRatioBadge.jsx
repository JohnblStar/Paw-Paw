export default function MedRatioBadge({ taken, total, className = '' }) {
  const complete = taken === total
  return (
    <span className={`text-sm font-semibold ${complete ? 'text-ink' : 'text-coral'} ${className}`}>
      {taken}/{total}
    </span>
  )
}
