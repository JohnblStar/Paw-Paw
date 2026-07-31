import { useState } from 'react'
import Card from '@/components/common/Card'
import { usePet } from '@/context/usePet'
import api from '@/api/instance'
import { ENDPOINTS } from '@/api/endpoints'
import { INPUT_CLASS } from '@/constants/formStyles'

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
    <Card title={`${petName}의 건강`}>
      {notes.length === 0 ? (
        <p className="text-sm text-ink-secondary">아직 기록된 특이사항이 없어요</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.slice(-5).reverse().map((item, index) => (
            <li key={item.id ?? `${item.date}-${index}`} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-purple" />
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
                        className="text-xs font-semibold text-primary-mint-dark hover:underline disabled:opacity-50"
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
                      <span className="font-semibold">{item.bodyPart}</span> — {item.note}
                    </p>
                    <p className="text-xs text-ink-secondary">{item.date}</p>
                    {item.id && (
                      <div className="mt-1 flex gap-3">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="text-xs text-ink-secondary hover:text-ink"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="text-xs text-coral hover:text-coral/80"
                        >
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
