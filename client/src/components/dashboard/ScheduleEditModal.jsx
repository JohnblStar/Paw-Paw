import { useState } from 'react'
import Modal from '@/components/common/Modal'
import FormField, { ErrorText } from '@/components/common/FormField'
import { INPUT_CLASS } from '@/constants/formStyles'
import api from '@/api/instance'
import { ENDPOINTS } from '@/api/endpoints'

export default function ScheduleEditModal({ isOpen, onClose, petId, schedule, onSaved }) {
    const [title, setTitle] = useState(schedule?.name ?? '')
    const [date, setDate] = useState(schedule?.date ?? '')
    const [error, setError] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    if (!isOpen || !schedule) return null

    const handleSave = async (event) => {
        event.preventDefault()
        if (!title.trim() || !date) {
            setError('항목명과 날짜를 모두 입력해주세요.')
            return
        }
        setIsSaving(true)
        setError('')
        try {
            await api.patch(ENDPOINTS.PETS.SCHEDULE_DETAIL(petId, schedule.id), { title: title.trim(), date })
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
            await api.delete(ENDPOINTS.PETS.SCHEDULE_DETAIL(petId, schedule.id))
            onSaved?.()
            onClose()
        } catch {
            setError('삭제에 실패했어요.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="예방접종/검진 수정">
            <form onSubmit={handleSave} className="flex flex-col gap-4">
                <FormField label="항목명" htmlFor="schedule-edit-title">
                    <input
                        id="schedule-edit-title"
                        type="text"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        className={INPUT_CLASS}
                    />
                </FormField>
                <FormField label="날짜" htmlFor="schedule-edit-date">
                    <input
                        id="schedule-edit-date"
                        type="date"
                        value={date}
                        onChange={(event) => setDate(event.target.value)}
                        className={INPUT_CLASS}
                    />
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
