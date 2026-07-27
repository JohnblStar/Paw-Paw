import { useState } from 'react'
import Modal from '@/components/common/Modal'
import FormField from '@/components/common/FormField'
import { usePet } from '@/context/usePet'

const inputClass =
  'w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-ink focus:border-primary-mint-dark focus:outline-none'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function WeightLogModal({ isOpen, onClose, petId, entries }) {
  const { addWeightEntry, updateWeightEntry, deleteWeightEntry } = usePet()
  const [editingId, setEditingId] = useState(null)
  const [date, setDate] = useState(today())
  const [weight, setWeight] = useState('')
  const [error, setError] = useState('')

  const resetForm = () => {
    setEditingId(null)
    setDate(today())
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
    if (weight === '' || Number.isNaN(Number(weight)) || Number(weight) <= 0) {
      setError('체중을 올바르게 입력해주세요.')
      return
    }

    if (editingId) {
      await updateWeightEntry(petId, editingId, { date, weight: Number(weight) })
    } else {
      await addWeightEntry(petId, { date, weight: Number(weight) })
    }
    resetForm()
  }

  const handleEditClick = (entry) => {
    setEditingId(entry.id)
    setDate(entry.date)
    setWeight(String(entry.weight))
    setError('')
  }

  const sortedEntries = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1))

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="체중 기록">
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1">
          <FormField label="날짜" htmlFor="weight-log-date">
            <input
              id="weight-log-date"
              type="date"
              value={date}
              max={today()}
              onChange={(event) => setDate(event.target.value)}
              className={inputClass}
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
              className={inputClass}
              placeholder="예: 3.2"
            />
          </FormField>
        </div>
        <button
          type="submit"
          className="rounded-xl bg-primary-mint px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-primary-mint-dark hover:text-white"
        >
          {editingId ? '수정' : '기록'}
        </button>
      </form>
      {error && <p className="mt-1 text-xs text-coral">{error}</p>}
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
                onClick={() => deleteWeightEntry(petId, entry.id)}
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
