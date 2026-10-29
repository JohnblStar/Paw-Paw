export function ErrorText({ children }) {
  return <p className="mt-1.5 text-xs font-medium text-coral-deep">{children}</p>
}

export default function FormField({ label, htmlFor, error, hint, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-[13px] font-semibold text-ink">
        {label}
      </label>
      {children}
      {error ? <ErrorText>{error}</ErrorText> : hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  )
}
