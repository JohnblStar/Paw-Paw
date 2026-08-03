import { useState } from 'react'
import FormField, { ErrorText } from '@/components/common/FormField'
import ToggleButtonGroup from '@/components/mypetsy/ToggleButtonGroup'
import PetAvatarPicker from '@/components/mypetsy/PetAvatarPicker'
import { getAvatarPresetsForSpecies } from '@/constants/petAvatarPresets'
import { INPUT_CLASS } from '@/constants/formStyles'
import { todayISO } from '@/utils/date'
import { isValidWeight } from '@/utils/validation'
import api from '@/api/instance'
import { ENDPOINTS } from '@/api/endpoints'

const SPECIES_OPTIONS = [
  { value: 'dog', label: '강아지' },
  { value: 'cat', label: '고양이' },
]
const SEX_OPTIONS = [
  { value: 'female', label: '여아' },
  { value: 'male', label: '남아' },
]
const NEUTERED_OPTIONS = [
  { value: true, label: '완료' },
  { value: false, label: '미완료' },
]

function validate(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = '이름을 입력해주세요.'
  if (!values.birthDate) {
    errors.birthDate = '생일을 선택해주세요.'
  } else if (values.birthDate > todayISO()) {
    errors.birthDate = '오늘 이후 날짜는 선택할 수 없어요.'
  }
  if (!isValidWeight(values.weight)) {
    errors.weight = '체중을 올바르게 입력해주세요.'
  }
  return errors
}

export default function PetForm({ initialValues, submitLabel, onSubmit, petId }) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [breedGuide, setBreedGuide] = useState(null)
  const [isGeneratingBreedGuide, setIsGeneratingBreedGuide] = useState(false)
  const [breedGuideError, setBreedGuideError] = useState('')

  const updateField = (field, value) => setValues((prev) => ({ ...prev, [field]: value }))

  const handleGenerateBreedGuide = async () => {
    if (!values.breed.trim() || isGeneratingBreedGuide) return
    setIsGeneratingBreedGuide(true)
    setBreedGuideError('')
    try {
      const data = await api.post(ENDPOINTS.PETS.AI_BREED(petId), { rawBreedInput: values.breed.trim() })
      updateField('breed', data.breed)
      setBreedGuide(data.feedback)
    } catch {
      setBreedGuideError('품종 정보 생성에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsGeneratingBreedGuide(false)
    }
  }

  const handleSpeciesChange = (species) => {
    const presets = getAvatarPresetsForSpecies(species)
    setValues((prev) => ({
      ...prev,
      species,
      photoKey: presets.some((preset) => preset.key === prev.photoKey)
        ? prev.photoKey
        : (presets[0]?.key ?? ''),
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const validationErrors = validate(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    onSubmit({ ...values, weight: Number(values.weight) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormField label="이름" htmlFor="pet-name" error={errors.name}>
        <input
          id="pet-name"
          type="text"
          value={values.name}
          onChange={(event) => updateField('name', event.target.value)}
          className={INPUT_CLASS}
          placeholder="예: 뽀삐"
        />
      </FormField>

      <FormField label="종">
        <ToggleButtonGroup options={SPECIES_OPTIONS} value={values.species} onChange={handleSpeciesChange} />
      </FormField>

      <FormField label="품종" htmlFor="pet-breed" hint="선택 입력이에요">
        <div className="flex gap-2">
          <input
            id="pet-breed"
            type="text"
            value={values.breed}
            onChange={(event) => {
              updateField('breed', event.target.value)
              setBreedGuide(null)
            }}
            className={INPUT_CLASS}
            placeholder="예: 포메라니안"
          />
          {petId && (
            <button
              type="button"
              onClick={handleGenerateBreedGuide}
              disabled={!values.breed.trim() || isGeneratingBreedGuide}
              className="shrink-0 rounded-xl border border-border px-3 py-2.5 text-xs font-semibold text-ink-secondary transition-colors hover:border-primary-mint-dark hover:text-ink disabled:opacity-50"
            >
              {isGeneratingBreedGuide ? '생성 중...' : 'AI로 품종 정보 확인'}
            </button>
          )}
        </div>
        {breedGuideError && <ErrorText>{breedGuideError}</ErrorText>}
        {breedGuide && (
          <div className="mt-2 rounded-xl border border-border bg-bg p-3 text-xs text-ink-secondary">
            <p><span className="font-semibold text-ink">훈련 팁</span> · {breedGuide.trainingTip}</p>
            <p className="mt-1"><span className="font-semibold text-ink">주의할 만성질환</span> · {breedGuide.chronicDiseases}</p>
            {breedGuide.specialCare && (
              <p className="mt-1"><span className="font-semibold text-ink">특별 케어</span> · {breedGuide.specialCare}</p>
            )}
          </div>
        )}
      </FormField>

      <FormField label="생일" htmlFor="pet-birthDate" error={errors.birthDate}>
        <input
          id="pet-birthDate"
          type="date"
          value={values.birthDate}
          max={todayISO()}
          onChange={(event) => updateField('birthDate', event.target.value)}
          className={INPUT_CLASS}
        />
      </FormField>

      <FormField label="성별">
        <ToggleButtonGroup
          options={SEX_OPTIONS}
          value={values.sex}
          onChange={(value) => updateField('sex', value)}
        />
      </FormField>

      <FormField label="중성화">
        <ToggleButtonGroup
          options={NEUTERED_OPTIONS}
          value={values.neutered}
          onChange={(value) => updateField('neutered', value)}
        />
      </FormField>

      <FormField label="체중(kg)" htmlFor="pet-weight" error={errors.weight}>
        <input
          id="pet-weight"
          type="number"
          step="0.01"
          value={values.weight}
          onChange={(event) => updateField('weight', event.target.value)}
          className={INPUT_CLASS}
          placeholder="예: 3.2"
        />
      </FormField>

      <FormField label="아바타">
        <PetAvatarPicker
          species={values.species}
          value={values.photoKey}
          onChange={(value) => updateField('photoKey', value)}
        />
      </FormField>

      <button
        type="submit"
        className="w-full rounded-full bg-primary-mint px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-primary-mint-dark hover:text-white"
      >
        {submitLabel}
      </button>
    </form>
  )
}
