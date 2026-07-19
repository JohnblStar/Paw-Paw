function FeatureCard({ number, title, description, isAi = false }) {
  return (
    <div className="flex gap-4 rounded-3xl border border-border bg-bg p-5 shadow-sm">
      <span
        className={`text-2xl font-bold ${isAi ? 'text-primary-purple' : 'text-ink-secondary'}`}
      >
        {number}
      </span>
      <div>
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-sm text-ink-secondary">{description}</p>
      </div>
    </div>
  )
}

export default FeatureCard
