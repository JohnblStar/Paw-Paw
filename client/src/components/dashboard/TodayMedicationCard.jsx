import { useState } from 'react'
import Card from '@/components/common/Card'
import MedRatioBadge from '@/components/common/MedRatioBadge'
import RegistrationWizardModal from '@/components/chatbot/RegistrationWizardModal'

export default function TodayMedicationCard({ medications, onToggle, onSaved }) {
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const taken = medications.filter((med) => med.taken).length

  return (
    <Card
      title="오늘 복용한 약"
      action={
        <div className="flex items-center gap-2">
          <MedRatioBadge taken={taken} total={medications.length} />
          <button
            type="button"
            onClick={() => setIsWizardOpen(true)}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink-secondary transition-colors hover:border-primary-mint-dark hover:text-ink"
          >
            + 복약 추가
          </button>
        </div>
      }
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

      <RegistrationWizardModal
        key={isWizardOpen}
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        initialType="medication"
        onSaved={onSaved}
      />
    </Card>
  )
}
