import { useState } from 'react'
import { CalendarPlus } from 'lucide-react'
import Modal from '@/components/common/Modal'
import FormField, { ErrorText } from '@/components/common/FormField'
import EditModalActions from '@/components/common/EditModalActions'
import { INPUT_CLASS } from '@/constants/formStyles'
import api from '@/api/instance'
import { ENDPOINTS } from '@/api/endpoints'
import { addOneYear } from '@/utils/date'

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

    // 종합백신·광견병처럼 매년 맞는 접종은 같은 항목을 1년 뒤 날짜로 한 번에 다시 등록한다 (기존 일정은 그대로 둔다).
    const handleRepeatNextYear = async () => {
        setIsSaving(true)
        setError('')
        try {
            await api.post(ENDPOINTS.PETS.SCHEDULES(petId), { title: schedule.name, date: addOneYear(schedule.date) })
            onSaved?.()
            onClose()
        } catch {
            setError('재등록에 실패했어요.')
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
                <button
                    type="button"
                    onClick={handleRepeatNextYear}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border-strong bg-surface-muted/60 px-4 py-2.5 text-xs font-semibold text-ink-secondary transition-colors hover:border-amber-dark hover:bg-amber-soft hover:text-amber-deep disabled:opacity-50"
                >
                    <CalendarPlus size={14} />
                    1년 뒤 같은 항목 다시 등록 ({addOneYear(schedule.date)})
                </button>
                <EditModalActions onDelete={handleDelete} isSaving={isSaving} />
            </form>
        </Modal>
    )
}
