export default function Card({ title, action, children, className = '' }) {
  return (
    <div className={`rounded-3xl border border-border bg-white p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="text-base font-bold text-ink">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
