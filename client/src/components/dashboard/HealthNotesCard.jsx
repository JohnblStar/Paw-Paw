import { useState } from 'react'
import { HeartPulse, Pencil, Trash2 } from 'lucide-react'
import Card from '@/components/common/Card'
import { usePet } from '@/context/usePet'
import api from '@/api/instance'
import { ENDPOINTS } from '@/api/endpoints'
import { INPUT_CLASS, TEXT_ACTION_CLASS, TEXT_DANGER_ACTION_CLASS } from '@/constants/formStyles'

// AI 챗봇이 감지한 특이사항이 자동으로 쌓이는 목록 (병명 없이 증상만).
// id가 없는 기록은 이 필드가 추가되기 전에 저장된 것이라 편집/삭제를 지원하지 않는다.
export default function HealthNotesCard({ petId, petName, notes }) {
  const { applyPetUpdate } = usePet()
  const [editingId, setEditingId] = useState(null)
  const [bodyPart, setBodyPart] = useState('')
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const startEdit = (target) => {
    setEditingId(target.id)
    setBodyPart(target.bodyPart)
    setNote(target.note)
  }

  const cancelEdit = () => setEditingId(null)

  const handleSave = async (noteId) => {
    if (!note.trim() || !bodyPart.trim()) return
    setIsSaving(true)
    try {
      const updatedPet = await api.patch(ENDPOINTS.PETS.HEALTH_NOTE_DETAIL(petId, noteId), {
        bodyPart: bodyPart.trim(),
        note: note.trim(),
      })
      applyPetUpdate(updatedPet)
      setEditingId(null)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (noteId) => {
    if (!window.confirm('이 기록을 삭제할까요?')) return
    const updatedPet = await api.delete(ENDPOINTS.PETS.HEALTH_NOTE_DETAIL(petId, noteId))
    applyPetUpdate(updatedPet)
  }

  return (
    <Card title={`${petName}의 건강`} icon={HeartPulse} tone="purple">
      {notes.length === 0 ? (
        <p className="rounded-2xl bg-surface-muted/70 px-4 py-5 text-center text-sm text-ink-secondary">아직 기록된 특이사항이 없어요</p>
      ) : (
        <ul className="relative flex flex-col gap-4 before:absolute before:bottom-2 before:left-[3px] before:top-2 before:w-px before:bg-border">
          {notes.slice(-5).reverse().map((item, index) => (
            <li key={item.id ?? `${item.date}-${index}`} className="flex items-start gap-2 text-sm">
              <span className="relative mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full bg-primary-purple ring-4 ring-surface" />
              <div className="flex-1">
                {editingId === item.id ? (
                  <div className="flex flex-col gap-2">
                    <input
                      value={bodyPart}
                      onChange={(event) => setBodyPart(event.target.value)}
                      className={INPUT_CLASS}
                      placeholder="부위"
                    />
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      className={INPUT_CLASS}
                      rows={2}
                    />
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleSave(item.id)}
                        disabled={isSaving}
                        className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-ink/85 disabled:opacity-50"
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="text-xs text-ink-secondary hover:text-ink"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-ink">
                      <span className="mr-1.5 rounded-md bg-primary-purple-soft px-1.5 py-0.5 text-xs font-semibold text-primary-purple-deep">
                        {item.bodyPart}
                      </span>
                      {item.note}
                    </p>
                    <p className="mt-1 text-xs text-muted">{item.date}</p>
                    {item.id && (
                      <div className="mt-1.5 flex gap-3">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className={TEXT_ACTION_CLASS}
                        >
                          <Pencil size={12} />
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className={TEXT_DANGER_ACTION_CLASS}
                        >
                          <Trash2 size={12} />
                          삭제
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
