function FeatureCard({ number, title, description, isAi = false }) {
  return (
    <div className="flex items-center gap-5 rounded-3xl border border-border bg-white p-6 shadow-sm">
      <span
        className={`text-3xl font-bold ${isAi ? 'text-primary-purple' : 'text-ink-secondary'}`}
      >
        {number}
      </span>
      <div>
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-sm text-ink-secondary">{description}</p>
      </div>
    </div>
  )
}

export default FeatureCard
