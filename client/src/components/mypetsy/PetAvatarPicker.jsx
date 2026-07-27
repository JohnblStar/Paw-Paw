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
            className={`flex flex-col items-center gap-1 rounded-2xl border p-3 transition-colors ${
              isSelected
                ? 'border-primary-mint-dark bg-primary-mint/40'
                : 'border-border bg-white hover:border-primary-mint-dark'
            }`}
          >
            <span className="text-3xl">{preset.emoji}</span>
            <span className="text-xs text-ink-secondary">{preset.label}</span>
          </button>
        )
      })}
    </div>
  )
}
