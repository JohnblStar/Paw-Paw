import { Link } from 'react-router-dom'
import { BadgeCheck, Megaphone, Pencil } from 'lucide-react'
import { calcAgeLabel } from '@/utils/petAge'
import { getPetAvatarDisplay } from '@/constants/petAvatarPresets'
import { SPECIES_LABEL, SEX_LABEL } from '@/constants/petLabels'

export default function PetCard({ pet, isActive, onCall }) {
  return (
    <div
      className={`rounded-3xl border bg-surface p-5 transition-shadow ${
        isActive ? 'border-primary-mint-dark shadow-card ring-4 ring-primary-mint-soft' : 'border-border hover:shadow-card'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-mint-soft text-2xl font-bold text-primary-mint-deep">
          {getPetAvatarDisplay(pet)}
        </div>
        <div>
          <p className="text-base font-extrabold tracking-tight text-ink">{pet.name}</p>
          <p className="text-xs text-ink-secondary">
            {SPECIES_LABEL[pet.species] ?? pet.species}
            {pet.breed ? ` · ${pet.breed}` : ''}
          </p>
        </div>
        {isActive && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary-mint-soft px-2.5 py-1 text-xs font-semibold text-primary-mint-deep">
            <BadgeCheck size={13} />
            현재 활성
          </span>
        )}
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

      <div className="mt-4 flex gap-2">
        {!isActive && (
          <button
            type="button"
            onClick={onCall}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-chip transition-all hover:bg-ink/85 active:scale-[0.98]"
          >
            <Megaphone size={15} />
            부르기
          </button>
        )}
        <Link
          to={`/mypetsy/${pet.id}/edit`}
          className={`inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-ink-secondary transition-colors hover:border-border-strong hover:text-ink ${
            isActive ? 'flex-1' : ''
          }`}
        >
          <Pencil size={14} />
          수정
        </Link>
      </div>
    </div>
  )
}
