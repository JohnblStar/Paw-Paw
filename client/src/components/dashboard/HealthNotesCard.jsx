import Card from '@/components/common/Card'

// AI 챗봇이 감지한 특이사항이 자동으로 쌓이는 목록 (병명 없이 증상만).
// 수동 편집 API는 아직 명세/구현되지 않아 읽기 전용으로 보여준다.
export default function HealthNotesCard({ petName, notes }) {
  return (
    <Card title={`${petName}의 건강`}>
      {notes.length === 0 ? (
        <p className="text-sm text-ink-secondary">아직 기록된 특이사항이 없어요</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((note, index) => (
            <li key={`${note.date}-${index}`} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-purple" />
              <div>
                <p className="text-ink">
                  <span className="font-semibold">{note.bodyPart}</span> — {note.note}
                </p>
                <p className="text-xs text-ink-secondary">{note.date}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
