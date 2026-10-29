import { getAvatarPresetsForSpecies } from '@/constants/petAvatarPresets'

export default function PetAvatarPicker({ species, value, onChange }) {
  const presets = getAvatarPresetsForSpecies(species)

  return (
    <div className="grid grid-cols-3 gap-3">
      {presets.map((preset) => {
        const isSelected = preset.key === value
        return (
          <button
            key={preset.key}
            type="button"
            onClick={() => onChange(preset.key)}
            aria-label={preset.label}
            aria-pressed={isSelected}
            className={`flex flex-col items-center gap-1 rounded-2xl border p-3 transition-all ${
              isSelected
                ? 'border-primary-mint-dark bg-primary-mint-soft ring-4 ring-primary-mint-soft'
                : 'border-border bg-surface hover:-translate-y-0.5 hover:border-border-strong'
            }`}
          >
            <span className="text-3xl">{preset.emoji}</span>
            <span className={`text-xs ${isSelected ? 'font-semibold text-primary-mint-deep' : 'text-ink-secondary'}`}>{preset.label}</span>
          </button>
        )
      })}
    </div>
  )
}
