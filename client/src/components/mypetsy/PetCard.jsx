import { Link } from 'react-router-dom'
import { calcAgeLabel } from '@/utils/petAge'
import { getPetAvatarDisplay } from '@/constants/petAvatarPresets'
import { SPECIES_LABEL, SEX_LABEL } from '@/constants/petLabels'

export default function PetCard({ pet, isActive, onCall }) {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 ${
        isActive ? 'border-primary-mint-dark ring-2 ring-primary-mint-dark' : 'border-border'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-mint text-xl font-bold text-ink">
          {getPetAvatarDisplay(pet)}
        </div>
        <div>
          <p className="font-bold text-ink">{pet.name}</p>
          <p className="text-xs text-ink-secondary">
            {SPECIES_LABEL[pet.species] ?? pet.species}
            {pet.breed ? ` · ${pet.breed}` : ''}
          </p>
        </div>
        {isActive && (
          <span className="ml-auto rounded-full bg-primary-mint px-2.5 py-1 text-xs font-semibold text-ink">
            현재 활성
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-ink-secondary">나이</p>
          <p className="text-sm font-semibold text-ink">{calcAgeLabel(pet.birthDate)}</p>
        </div>
        <div>
          <p className="text-xs text-ink-secondary">성별</p>
          <p className="text-sm font-semibold text-ink">
            {SEX_LABEL[pet.sex] ?? pet.sex}
            {pet.neutered ? ' · 중성화' : ''}
          </p>
        </div>
        <div>
          <p className="text-xs text-ink-secondary">체중</p>
          <p className="text-sm font-semibold text-ink">{pet.weight}kg</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {!isActive && (
          <button
            type="button"
            onClick={onCall}
            className="flex-1 rounded-full bg-primary-mint px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-primary-mint-dark hover:text-white"
          >
            부르기
          </button>
        )}
        <Link
          to={`/mypetsy/${pet.id}/edit`}
          className={`rounded-full border border-border px-4 py-2 text-center text-sm font-semibold text-ink-secondary transition-colors hover:border-primary-mint-dark hover:text-ink ${
            isActive ? 'flex-1' : ''
          }`}
        >
          수정
        </Link>
      </div>
    </div>
  )
}
