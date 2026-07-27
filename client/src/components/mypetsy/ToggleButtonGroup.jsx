export default function ToggleButtonGroup({ options, value, onChange }) {
  return (
    <div className="flex gap-2">
      {options.map((option) => {
        const isSelected = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
              isSelected
                ? 'border-primary-mint-dark bg-primary-mint text-ink'
                : 'border-border bg-white text-ink-secondary hover:border-primary-mint-dark'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
