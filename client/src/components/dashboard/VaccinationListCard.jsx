import { useState } from 'react'
import { Plus, Syringe } from 'lucide-react'
import Card from '@/components/common/Card'
import DdayPill from '@/components/common/DdayPill'
import RegistrationWizardModal from '@/components/chatbot/RegistrationWizardModal'
import ScheduleEditModal from '@/components/dashboard/ScheduleEditModal'
import { getDday, isUrgent } from '@/utils/dday'
import { CHIP_BUTTON_CLASS } from '@/constants/formStyles'

export default function VaccinationListCard({ petId, vaccinations, onSaved }) {
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)

  return (
    <Card
      title="예방접종/검진"
      icon={Syringe}
      tone="amber"
      action={
        <button
          type="button"
          onClick={() => setIsWizardOpen(true)}
          className={CHIP_BUTTON_CLASS}
        >
          <Plus size={13} strokeWidth={2.5} />
          접종 추가
        </button>
      }
    >
      {vaccinations.length === 0 && (
        <p className="rounded-2xl bg-surface-muted/70 px-4 py-5 text-center text-sm text-ink-secondary">예정된 일정이 없어요</p>
      )}
      <ul className="flex flex-col gap-2">
        {vaccinations.map((item) => {
          const dday = getDday(item.date)
          return (
            <li key={item.id}>
              <button type="button" onClick={() => setEditingSchedule(item)} className="group w-full text-left">
                <DdayPill label={item.name} dday={dday} urgent={isUrgent(dday)} />
              </button>
            </li>
          )
        })}
      </ul>

      <RegistrationWizardModal
        key={isWizardOpen}
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        initialType="single_date"
        onSaved={onSaved}
      />

      <ScheduleEditModal
        key={editingSchedule?.id}
        isOpen={Boolean(editingSchedule)}
        onClose={() => setEditingSchedule(null)}
        petId={petId}
        schedule={editingSchedule}
        onSaved={onSaved}
      />
    </Card>
  )
}