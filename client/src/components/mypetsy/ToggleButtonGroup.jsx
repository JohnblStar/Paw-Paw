export default function ToggleButtonGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-2xl bg-surface-muted p-1">
      {options.map((option) => {
        const isSelected = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
            className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              isSelected ? 'bg-surface text-ink shadow-chip' : 'text-ink-secondary hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
