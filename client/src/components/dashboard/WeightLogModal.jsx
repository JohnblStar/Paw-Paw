import { useMemo, useState } from 'react'
import Modal from '@/components/common/Modal'
import FormField, { ErrorText } from '@/components/common/FormField'
import { useWeight } from '@/context/useWeight'
import { INPUT_CLASS, PRIMARY_BUTTON_CLASS } from '@/constants/formStyles'
import { todayISO } from '@/utils/date'
import { isValidWeight } from '@/utils/validation'

export default function WeightLogModal({ isOpen, onClose, petId, entries, onSaved }) {
  const { addWeightEntry, updateWeightEntry, deleteWeightEntry } = useWeight()
  const [editingId, setEditingId] = useState(null)
  const [date, setDate] = useState(todayISO())
  const [weight, setWeight] = useState('')
  const [error, setError] = useState('')

  const resetForm = () => {
    setEditingId(null)
    setDate(todayISO())
    setWeight('')
    setError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!date) {
      setError('날짜를 선택해주세요.')
      return
    }
    if (!isValidWeight(weight)) {
      setError('체중을 올바르게 입력해주세요.')
      return
    }

    if (editingId) {
      await updateWeightEntry(petId, editingId, { date, weight: Number(weight) })
    } else {
      await addWeightEntry(petId, { date, weight: Number(weight) })
    }
    resetForm()
    onSaved?.()
  }

  const handleEditClick = (entry) => {
    setEditingId(entry.id)
    setDate(entry.date)
    setWeight(String(entry.weight))
    setError('')
  }

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [entries],
  )

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="체중 기록">
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1">
          <FormField label="날짜" htmlFor="weight-log-date">
            <input
              id="weight-log-date"
              type="date"
              value={date}
              max={todayISO()}
              onChange={(event) => setDate(event.target.value)}
              className={INPUT_CLASS}
            />
          </FormField>
        </div>
        <div className="flex-1">
          <FormField label="체중(kg)" htmlFor="weight-log-value">
            <input
              id="weight-log-value"
              type="number"
              step="0.01"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              className={INPUT_CLASS}
              placeholder="예: 3.2"
            />
          </FormField>
        </div>
        <button type="submit" className={PRIMARY_BUTTON_CLASS}>
          {editingId ? '수정' : '기록'}
        </button>
      </form>
      {error && <ErrorText>{error}</ErrorText>}
      {editingId && (
        <button
          type="button"
          onClick={resetForm}
          className="mt-1 text-xs text-ink-secondary underline-offset-2 hover:underline"
        >
          취소하고 새로 기록하기
        </button>
      )}

      <div className="mt-5 max-h-64 space-y-2 overflow-y-auto">
        {sortedEntries.length === 0 && <p className="text-sm text-ink-secondary">기록이 없어요</p>}
        {sortedEntries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between rounded-xl border border-border px-3 py-2"
          >
            <span className="text-sm text-ink">{entry.date}</span>
            <span className="text-sm font-semibold text-ink">{entry.weight}kg</span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleEditClick(entry)}
                className="text-xs text-ink-secondary hover:text-ink"
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('이 체중 기록을 삭제할까요?')) {
                    deleteWeightEntry(petId, entry.id).then(() => onSaved?.())
                  }
                }}
                className="text-xs text-coral hover:text-coral/80"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
