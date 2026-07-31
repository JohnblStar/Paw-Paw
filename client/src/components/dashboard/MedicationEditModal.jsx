import { useState } from 'react'
import Modal from '@/components/common/Modal'
import FormField, { ErrorText } from '@/components/common/FormField'
import { INPUT_CLASS } from '@/constants/formStyles'
import api from '@/api/instance'
import { ENDPOINTS } from '@/api/endpoints'

export default function MedicationEditModal({ isOpen, onClose, petId, medication, onSaved }) {
  const [title, setTitle] = useState(medication?.name ?? '')
  const [alertTimes, setAlertTimes] = useState(medication?.alertTimes ?? [])
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen || !medication) return null

  const handleSave = async (event) => {
    event.preventDefault()
    if (!title.trim() || alertTimes.some((t) => !t)) {
      setError('약 이름과 알림시간을 모두 입력해주세요.')
      return
    }
    setIsSaving(true)
    setError('')
    try {
      await api.patch(ENDPOINTS.PETS.MEDICATION_DETAIL(petId, medication.id), {
        title: title.trim(),
        alertTimes,
      })
      onSaved?.()
      onClose()
    } catch {
      setError('저장에 실패했어요.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsSaving(true)
    setError('')
    try {
      await api.delete(ENDPOINTS.PETS.MEDICATION_DETAIL(petId, medication.id))
      onSaved?.()
      onClose()
    } catch {
      setError('삭제에 실패했어요.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="복약 수정">
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <FormField label="약 이름" htmlFor="med-edit-title">
          <input
            id="med-edit-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="알림시간">
          <div className="flex flex-col gap-2">
            {alertTimes.map((time, index) => (
              <input
                key={index}
                type="time"
                value={time}
                onChange={(event) => {
                  const value = event.target.value
                  setAlertTimes((prev) => prev.map((t, i) => (i === index ? value : t)))
                }}
                className={INPUT_CLASS}
              />
            ))}
          </div>
        </FormField>
        {error && <ErrorText>{error}</ErrorText>}
        <div className="flex justify-between gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSaving}
            className="rounded-xl border border-coral px-4 py-2.5 text-sm font-semibold text-coral transition-colors hover:bg-coral/10 disabled:opacity-50"
          >
            삭제
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 rounded-xl bg-primary-mint px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-primary-mint-dark hover:text-white disabled:opacity-50"
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
