export function ErrorText({ children }) {
  return <p className="mt-1 text-xs text-coral">{children}</p>
}

export default function FormField({ label, htmlFor, error, hint, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {error ? <ErrorText>{error}</ErrorText> : hint && <p className="mt-1 text-xs text-ink-secondary">{hint}</p>}
    </div>
  )
}
