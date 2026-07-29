import Card from '@/components/common/Card'
import MedRatioBadge from '@/components/common/MedRatioBadge'

export default function TodayMedicationCard({ medications, onToggle }) {
  const taken = medications.filter((med) => med.taken).length

  return (
    <Card
      title="오늘 복용한 약"
      action={<MedRatioBadge taken={taken} total={medications.length} />}
    >
      {medications.length === 0 ? (
        <p className="text-sm text-ink-secondary">등록된 약이 없어요</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {medications.map((med) => (
            <li key={med.id}>
              <button
                type="button"
                onClick={() => onToggle?.(med.id)}
                className="flex w-full items-center justify-between text-sm"
              >
                <span className="text-ink">{med.name}</span>
                <span className="flex items-center gap-2 text-ink-secondary">
                  {med.alertTimes?.join(', ')}
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      med.taken ? 'bg-primary-mint' : 'bg-coral/40'
                    }`}
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
