import { useState } from 'react'
import Card from '@/components/common/Card'
import MedRatioBadge from '@/components/common/MedRatioBadge'
import RegistrationWizardModal from '@/components/chatbot/RegistrationWizardModal'
import MedicationEditModal from '@/components/dashboard/MedicationEditModal'

export default function TodayMedicationCard({ petId, medications, onToggle, onSaved }) {
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [editingMedication, setEditingMedication] = useState(null)
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
            <li key={med.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggle?.(med.id)}
                className="flex flex-1 items-center justify-between text-sm"
              >
                <span className="text-ink">{med.name}</span>
                <span className="flex items-center gap-2 text-ink-secondary">
                  {med.alertTimes?.join(', ')}
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${med.taken ? 'bg-primary-mint' : 'bg-coral/40'
                      }`}
                  />
                </span>
              </button>
              <button
                type="button"
                onClick={() => setEditingMedication(med)}
                className="shrink-0 rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-ink-secondary transition-colors hover:border-primary-mint-dark hover:text-ink"
              >
                수정
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

      <MedicationEditModal
        key={editingMedication?.id}
        isOpen={Boolean(editingMedication)}
        onClose={() => setEditingMedication(null)}
        petId={petId}
        medication={editingMedication}
        onSaved={onSaved}
      />
    </Card>
  )
}
