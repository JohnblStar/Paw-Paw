import { useState } from 'react'
import Modal from '@/components/common/Modal'
import FormField, { ErrorText } from '@/components/common/FormField'
import AlertTimesInput from '@/components/common/AlertTimesInput'
import EditModalActions from '@/components/common/EditModalActions'
import { INPUT_CLASS } from '@/constants/formStyles'
import api from '@/api/instance'
import { ENDPOINTS } from '@/api/endpoints'

export default function MedicationEditModal({ isOpen, onClose, petId, medication, onSaved }) {
  const [title, setTitle] = useState(medication?.name ?? '')
  const [alertTimes, setAlertTimes] = useState(medication?.alertTimes ?? [])
  const [startDate, setStartDate] = useState(medication?.startDate ?? '')
  const [endDate, setEndDate] = useState(medication?.endDate ?? null)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen || !medication) return null

  const handleSave = async (event) => {
    event.preventDefault()
    if (!title.trim() || alertTimes.some((t) => !t) || !startDate) {
      setError('약 이름, 알림시간, 복용 시작일을 모두 입력해주세요.')
      return
    }
    if (endDate && endDate < startDate) {
      setError('종료일은 시작일 이후여야 해요.')
      return
    }
    setIsSaving(true)
    setError('')
    try {
      await api.patch(ENDPOINTS.PETS.MEDICATION_DETAIL(petId, medication.id), {
        title: title.trim(),
        alertTimes,
        startDate,
        endDate,
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
          <AlertTimesInput value={alertTimes} onChange={setAlertTimes} />
        </FormField>
        <FormField label="복용 시작일" htmlFor="med-edit-start">
          <input
            id="med-edit-start"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="복용 종료일">
          <label className="mb-2 flex items-center gap-2 text-sm text-ink-secondary">
            <input
              type="checkbox"
              checked={endDate === null}
              onChange={(event) => setEndDate(event.target.checked ? null : startDate)}
            />
            종료일 미정 (계속 복용)
          </label>
          {endDate !== null && (
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className={INPUT_CLASS}
            />
          )}
        </FormField>
        {error && <ErrorText>{error}</ErrorText>}
        <EditModalActions onDelete={handleDelete} isSaving={isSaving} />
      </form>
    </Modal>
  )
}
