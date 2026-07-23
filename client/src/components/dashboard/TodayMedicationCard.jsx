import Card from '@/components/common/Card'
import MedRatioBadge from '@/components/common/MedRatioBadge'

export default function TodayMedicationCard({ medications }) {
  const taken = medications.filter((med) => med.taken).length

  return (
    <Card
      title="오늘 복용한 약"
      action={<MedRatioBadge taken={taken} total={medications.length} />}
    >
      <ul className="flex flex-col gap-2">
        {medications.map((med) => (
          <li key={med.id} className="flex items-center justify-between text-sm">
            <span className="text-ink">{med.name}</span>
            <span className="flex items-center gap-2 text-ink-secondary">
              {med.time}
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  med.taken ? 'bg-primary-mint' : 'bg-coral/40'
                }`}
              />
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
