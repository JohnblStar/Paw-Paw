import { useState } from 'react'
import Modal from '@/components/common/Modal'
import FormField, { ErrorText } from '@/components/common/FormField'
import ToggleButtonGroup from '@/components/mypetsy/ToggleButtonGroup'
import AlertTimesInput from '@/components/common/AlertTimesInput'
import { usePet } from '@/context/usePet'
import api from '@/api/instance'
import { ENDPOINTS } from '@/api/endpoints'
import { INPUT_CLASS, PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from '@/constants/formStyles'
import { todayISO } from '@/utils/date'

const TYPE_OPTIONS = [
  { value: 'medication', label: '복약' },
  { value: 'single_date', label: '예방접종/검진' },
]

const FREQUENCY_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n}회` }))

const TYPE_LABEL = { medication: '복약', single_date: '예방접종/검진' }

function emptyForm(initialType, petId) {
  return {
    petId,
    type: initialType ?? null,
    title: '',
    frequencyPerDay: 1,
    alertTimes: [''],
    date: todayISO(),
  }
}

function firstSlotStep(type) {
  return type === 'medication' ? 'med-title' : 'sched-title'
}

// 대시보드 버튼과 챗봇 등록 제안 두 진입점이 공유하는 슬롯필링 위저드.
// LLM 호출 없이 버튼/피커로만 데이터를 채운다 (CLAUDE.md 절대 규칙 4).
// 호출부가 isOpen이 바뀔 때마다 key를 바꿔 리마운트시키므로, 열릴 때마다 아래 초기값으로 새로 시작한다.
export default function RegistrationWizardModal({ isOpen, onClose, initialType = null, onSaved }) {
  const { pets, activePet } = usePet()
  const [step, setStep] = useState(() =>
    pets.length > 1 ? 'pet' : initialType ? firstSlotStep(initialType) : 'type',
  )
  const [history, setHistory] = useState([])
  const [form, setForm] = useState(() => emptyForm(initialType, activePet?.id ?? null))
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const goNext = (nextStep) => {
    setError('')
    setHistory((prev) => [...prev, step])
    setStep(nextStep)
  }

  const goBack = () => {
    setError('')
    setHistory((prev) => {
      const next = [...prev]
      const last = next.pop()
      if (last) setStep(last)
      return next
    })
  }

  const handleClose = () => {
    onClose()
  }

  const handlePetNext = () => {
    if (!form.petId) {
      setError('반려동물을 선택해주세요.')
      return
    }
    goNext(initialType ? firstSlotStep(initialType) : 'type')
  }

  const handleTypeNext = () => {
    if (!form.type) {
      setError('종류를 선택해주세요.')
      return
    }
    goNext(firstSlotStep(form.type))
  }

  const handleMedTitleNext = () => {
    if (!form.title.trim()) {
      setError('약 이름을 입력해주세요.')
      return
    }
    goNext('med-frequency')
  }

  const handleMedFrequencyNext = () => {
    const slotCount = Math.min(form.frequencyPerDay, 3)
    setForm((prev) => ({ ...prev, alertTimes: Array.from({ length: slotCount }, () => '') }))
    goNext('med-times')
  }

  const handleMedTimesNext = () => {
    if (form.alertTimes.some((t) => !t)) {
      setError('알림시간을 모두 선택해주세요.')
      return
    }
    goNext('summary')
  }

  const handleScheduleTitleNext = () => {
    if (!form.title.trim()) {
      setError('항목명을 입력해주세요.')
      return
    }
    goNext('sched-date')
  }

  const handleScheduleDateNext = () => {
    if (!form.date) {
      setError('날짜를 선택해주세요.')
      return
    }
    goNext('summary')
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    try {
      if (form.type === 'medication') {
        await api.post(ENDPOINTS.PETS.MEDICATIONS(form.petId), {
          title: form.title.trim(),
          frequencyPerDay: form.frequencyPerDay,
          alertTimes: form.alertTimes,
        })
      } else {
        await api.post(ENDPOINTS.PETS.SCHEDULES(form.petId), {
          title: form.title.trim(),
          date: form.date,
        })
      }
      onSaved?.()
      handleClose()
    } catch {
      setError('저장에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsSaving(false)
    }
  }

  const selectedPet = pets.find((pet) => pet.id === form.petId)

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="복약/예방접종 등록">
      {step === 'pet' && (
        <div className="flex flex-col gap-4">
          <FormField label="어떤 반려동물인가요?">
            <ToggleButtonGroup
              options={pets.map((pet) => ({ value: pet.id, label: pet.name }))}
              value={form.petId}
              onChange={(petId) => setForm((prev) => ({ ...prev, petId }))}
            />
          </FormField>
          {error && <ErrorText>{error}</ErrorText>}
          <WizardActions onNext={handlePetNext} />
        </div>
      )}

      {step === 'type' && (
        <div className="flex flex-col gap-4">
          <FormField label="무엇을 등록할까요?">
            <ToggleButtonGroup
              options={TYPE_OPTIONS}
              value={form.type}
              onChange={(type) => setForm((prev) => ({ ...prev, type }))}
            />
          </FormField>
          {error && <ErrorText>{error}</ErrorText>}
          <WizardActions onBack={history.length > 0 ? goBack : null} onNext={handleTypeNext} />
        </div>
      )}

      {step === 'med-title' && (
        <div className="flex flex-col gap-4">
          <FormField label="약 이름" htmlFor="wizard-med-title">
            <input
              id="wizard-med-title"
              type="text"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="예: 십이지장 궤양약"
              className={INPUT_CLASS}
            />
          </FormField>
          {error && <ErrorText>{error}</ErrorText>}
          <WizardActions onBack={history.length > 0 ? goBack : null} onNext={handleMedTitleNext} />
        </div>
      )}

      {step === 'med-frequency' && (
        <div className="flex flex-col gap-4">
          <FormField label="하루에 몇 번 먹나요?">
            <ToggleButtonGroup
              options={FREQUENCY_OPTIONS}
              value={form.frequencyPerDay}
              onChange={(frequencyPerDay) => setForm((prev) => ({ ...prev, frequencyPerDay }))}
            />
          </FormField>
          {error && <ErrorText>{error}</ErrorText>}
          <WizardActions onBack={goBack} onNext={handleMedFrequencyNext} />
        </div>
      )}

      {step === 'med-times' && (
        <div className="flex flex-col gap-4">
          <FormField label={`알림시간 (최대 3개)`}>
            <AlertTimesInput
              value={form.alertTimes}
              onChange={(alertTimes) => setForm((prev) => ({ ...prev, alertTimes }))}
            />
          </FormField>
          {error && <ErrorText>{error}</ErrorText>}
          <WizardActions onBack={goBack} onNext={handleMedTimesNext} />
        </div>
      )}

      {step === 'sched-title' && (
        <div className="flex flex-col gap-4">
          <FormField label="항목명" htmlFor="wizard-sched-title">
            <input
              id="wizard-sched-title"
              type="text"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="예: 광견병 예방접종"
              className={INPUT_CLASS}
            />
          </FormField>
          {error && <ErrorText>{error}</ErrorText>}
          <WizardActions onBack={history.length > 0 ? goBack : null} onNext={handleScheduleTitleNext} />
        </div>
      )}

      {step === 'sched-date' && (
        <div className="flex flex-col gap-4">
          <FormField label="날짜" htmlFor="wizard-sched-date">
            <input
              id="wizard-sched-date"
              type="date"
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              className={INPUT_CLASS}
            />
          </FormField>
          {error && <ErrorText>{error}</ErrorText>}
          <WizardActions onBack={goBack} onNext={handleScheduleDateNext} />
        </div>
      )}

      {step === 'summary' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-bg p-4 text-sm text-ink">
            <p className="font-semibold">{selectedPet?.name}</p>
            <p className="mt-1 text-ink-secondary">{TYPE_LABEL[form.type]}</p>
            <p className="mt-2 font-semibold">{form.title}</p>
            {form.type === 'medication' ? (
              <p className="mt-1 text-ink-secondary">
                하루 {form.frequencyPerDay}회 · 알림 {form.alertTimes.join(', ')}
              </p>
            ) : (
              <p className="mt-1 text-ink-secondary">{form.date}</p>
            )}
          </div>
          {error && <ErrorText>{error}</ErrorText>}
          <div className="flex justify-between gap-2">
            <button type="button" onClick={goBack} className={SECONDARY_BUTTON_CLASS}>
              수정
            </button>
            <button type="button" onClick={handleSave} disabled={isSaving} className={`flex-1 ${PRIMARY_BUTTON_CLASS}`}>
              {isSaving ? '저장 중...' : '확인'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function WizardActions({ onBack, onNext }) {
  return (
    <div className="flex justify-between gap-2">
      {onBack ? (
        <button type="button" onClick={onBack} className={SECONDARY_BUTTON_CLASS}>
          뒤로
        </button>
      ) : (
        <span />
      )}
      <button type="button" onClick={onNext} className={PRIMARY_BUTTON_CLASS}>
        다음
      </button>
    </div>
  )
}
