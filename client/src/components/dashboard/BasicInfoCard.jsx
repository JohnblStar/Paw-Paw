import Card from '@/components/common/Card'
import { calcAgeLabel } from '@/utils/petAge'
import { getPetAvatarDisplay } from '@/constants/petAvatarPresets'
import { SPECIES_LABEL, SEX_LABEL } from '@/constants/petLabels'

export default function BasicInfoCard({ pet }) {
  return (
    <Card>
      <div className="flex items-start gap-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-mint-soft text-2xl font-bold text-primary-mint-deep ring-1 ring-primary-mint/50">
          {getPetAvatarDisplay(pet)}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xl font-extrabold tracking-tight text-ink">{pet.name}</p>
            <span className="rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-ink-secondary">
              {SPECIES_LABEL[pet.species] ?? pet.species}
              {pet.breed ? ` · ${pet.breed}` : ''}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 divide-x divide-border rounded-2xl bg-surface-muted/70 py-3 text-center">
            <div>
              <p className="text-xs text-ink-secondary">나이</p>
              <p className="mt-0.5 text-sm font-bold text-ink">{calcAgeLabel(pet.birthDate)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-secondary">성별</p>
              <p className="mt-0.5 text-sm font-bold text-ink">
                {SEX_LABEL[pet.sex] ?? pet.sex}
                {pet.neutered ? ' · 중성화' : ''}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-secondary">체중</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-ink">{pet.weight}kg</p>
            </div>
          </div>

          {pet.managedConditions?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {pet.managedConditions.map((condition) => (
                <span
                  key={condition}
                  className="rounded-full bg-primary-purple-soft px-2.5 py-1 text-xs font-medium text-primary-purple-deep"
                >
                  {condition}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
