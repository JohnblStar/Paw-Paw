import IconChip from '@/components/common/IconChip'

function FeatureCard({ number, title, description, icon, isAi = false }) {
  return (
    <div className="group flex items-center gap-4 rounded-3xl border border-border bg-surface/80 p-5 shadow-card backdrop-blur transition-transform hover:-translate-y-0.5 sm:gap-5 sm:p-6">
      <IconChip icon={icon} tone={isAi ? 'purple' : 'mint'} size="lg" />
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-bold tracking-tight text-ink sm:text-lg">{title}</h3>
        <p className="mt-0.5 text-sm text-ink-secondary">{description}</p>
      </div>
      <span
        className={`text-sm font-bold tabular-nums ${isAi ? 'text-primary-purple-deep' : 'text-muted'}`}
      >
        {number}
      </span>
    </div>
  )
}

export default FeatureCard
