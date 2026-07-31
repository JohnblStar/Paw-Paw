import { useState } from 'react'
import Card from '@/components/common/Card'
import MedRatioBadge from '@/components/common/MedRatioBadge'
import RegistrationWizardModal from '@/components/chatbot/RegistrationWizardModal'
import MedicationEditModal from '@/components/dashboard/MedicationEditModal'

export default function TodayMedicationCard({ petId, medications, onToggle, onSaved }) {
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [editingMedication, setEditingMedication] = useState(null)
  const taken = medications.reduce((sum, med) => sum + med.takenSlots.filter(Boolean).length, 0)
  const total = medications.reduce((sum, med) => sum + med.frequencyPerDay, 0)

  return (
    <Card
      title="오늘 복용한 약"
      action={
        <div className="flex items-center gap-2">
          <MedRatioBadge taken={taken} total={total} />
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
              <span className="flex-1 text-sm text-ink">{med.name}</span>
              <span className="flex items-center gap-1.5">
                {med.takenSlots.map((isTaken, index) => (
                  <button
                    key={index}
                    type="button"
                    title={med.alertTimes?.[index] ?? `${index + 1}회`}
                    onClick={() => onToggle?.(med.id, index)}
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                      isTaken
                        ? 'bg-primary-mint text-ink'
                        : 'border border-border bg-white text-ink-secondary hover:border-primary-mint-dark'
                    }`}
                  >
                    {isTaken ? '✓' : index + 1}
                  </button>
                ))}
              </span>
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
