import { useState } from 'react'
import { Check, Pencil, Tablets, Plus } from 'lucide-react'
import Card from '@/components/common/Card'
import MedRatioBadge from '@/components/common/MedRatioBadge'
import RegistrationWizardModal from '@/components/chatbot/RegistrationWizardModal'
import MedicationEditModal from '@/components/dashboard/MedicationEditModal'
import { CHIP_BUTTON_CLASS } from '@/constants/formStyles'

export default function TodayMedicationCard({ petId, medications, onToggle, onSaved }) {
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [editingMedication, setEditingMedication] = useState(null)
  const taken = medications.reduce((sum, med) => sum + med.takenSlots.filter(Boolean).length, 0)
  const total = medications.reduce((sum, med) => sum + med.frequencyPerDay, 0)

  return (
    <Card
      title="오늘 복용한 약"
      icon={Tablets}
      tone="mint"
      action={
        <div className="flex items-center gap-2">
          <MedRatioBadge taken={taken} total={total} />
          <button
            type="button"
            onClick={() => setIsWizardOpen(true)}
            className={CHIP_BUTTON_CLASS}
          >
            <Plus size={13} strokeWidth={2.5} />
            복약 추가
          </button>
        </div>
      }
    >
      {medications.length === 0 ? (
        <p className="rounded-2xl bg-surface-muted/70 px-4 py-5 text-center text-sm text-ink-secondary">등록된 약이 없어요</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {medications.map((med) => (
            <li key={med.id} className="flex items-center gap-2 rounded-2xl border border-border px-3 py-2.5">
              <span className="flex-1 truncate text-sm font-medium text-ink">{med.name}</span>
              <span className="flex items-center gap-1.5">
                {med.takenSlots.map((isTaken, index) => (
                  <button
                    key={index}
                    type="button"
                    title={med.alertTimes?.[index] ?? `${index + 1}회`}
                    onClick={() => onToggle?.(med.id, index)}
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold tabular-nums transition-all active:scale-90 ${
                      isTaken
                        ? 'bg-primary-mint text-ink'
                        : 'border border-dashed border-border-strong bg-surface text-ink-secondary hover:border-primary-mint-dark hover:text-primary-mint-deep'
                    }`}
                  >
                    {isTaken ? <Check size={14} strokeWidth={3} /> : index + 1}
                  </button>
                ))}
              </span>
              <button
                type="button"
                onClick={() => setEditingMedication(med)}
                aria-label="수정"
                title="수정"
                className="shrink-0 rounded-full p-1.5 text-ink-secondary transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <Pencil size={14} />
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
