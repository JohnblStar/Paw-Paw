import { useState } from 'react'
import Card from '@/components/common/Card'

export default function HealthNotesCard({ notes: initialNotes }) {
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState(initialNotes)

  const updateNote = (index, field, value) => {
    setNotes((prev) => prev.map((note, i) => (i === index ? { ...note, [field]: value } : note)))
  }

  const removeNote = (index) => {
    setNotes((prev) => prev.filter((_, i) => i !== index))
  }

  const addNote = () => {
    setNotes((prev) => [
      { date: new Date().toISOString().slice(0, 10), bodyPart: '', note: '' },
      ...prev,
    ])
  }

  return (
    <Card
      title="뽀삐의 건강"
      action={
        <button
          type="button"
          onClick={() => setEditing((prev) => !prev)}
          className="text-xs font-semibold text-primary-mint-dark hover:underline"
        >
          {editing ? '완료' : '편집하기'}
        </button>
      }
    >
      {editing && (
        <button
          type="button"
          onClick={addNote}
          className="mb-3 w-full rounded-xl border border-dashed border-border py-2 text-xs text-ink-secondary hover:border-primary-mint-dark hover:text-primary-mint-dark"
        >
          + 기록 추가
        </button>
      )}

      {notes.length === 0 ? (
        <p className="text-sm text-ink-secondary">아직 기록된 특이사항이 없어요</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((note, index) =>
            editing ? (
              <li key={`${note.date}-${index}`} className="flex flex-col gap-1.5 rounded-xl border border-border p-3">
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={note.date}
                    onChange={(e) => updateNote(index, 'date', e.target.value)}
                    className="rounded-lg border border-border px-2 py-1 text-xs text-ink"
                  />
                  <input
                    type="text"
                    value={note.bodyPart}
                    placeholder="부위"
                    onChange={(e) => updateNote(index, 'bodyPart', e.target.value)}
                    className="w-20 rounded-lg border border-border px-2 py-1 text-xs text-ink"
                  />
                  <button
                    type="button"
                    onClick={() => removeNote(index)}
                    className="ml-auto text-xs text-coral hover:underline"
                  >
                    삭제
                  </button>
                </div>
                <textarea
                  value={note.note}
                  placeholder="어떤 증상이 있었는지 적어주세요 (병명 대신 증상만)"
                  onChange={(e) => updateNote(index, 'note', e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-border px-2 py-1 text-xs text-ink"
                />
              </li>
            ) : (
              <li key={`${note.date}-${index}`} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-purple" />
                <div>
                  <p className="text-ink">
                    <span className="font-semibold">{note.bodyPart}</span> — {note.note}
                  </p>
                  <p className="text-xs text-ink-secondary">{note.date}</p>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </Card>
  )
}
