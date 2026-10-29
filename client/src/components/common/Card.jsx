import IconChip from '@/components/common/IconChip'

export default function Card({ title, action, icon, tone = 'neutral', children, className = '' }) {
  return (
    <div className={`rounded-3xl border border-border bg-surface p-6 shadow-card ${className}`}>
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          {title && (
            <div className="flex min-w-0 items-center gap-2.5">
              {icon && <IconChip icon={icon} tone={tone} size="sm" />}
              <h2 className="truncate text-[15px] font-bold tracking-tight text-ink">{title}</h2>
            </div>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
