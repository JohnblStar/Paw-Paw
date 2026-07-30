import { useState } from 'react'
import Card from '@/components/common/Card'
import DdayPill from '@/components/common/DdayPill'
import RegistrationWizardModal from '@/components/chatbot/RegistrationWizardModal'
import { getDday, isUrgent } from '@/utils/dday'

export default function VaccinationListCard({ vaccinations, onSaved }) {
  const [isWizardOpen, setIsWizardOpen] = useState(false)

  return (
    <Card
      title="예방접종/검진"
      action={
        <button
          type="button"
          onClick={() => setIsWizardOpen(true)}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink-secondary transition-colors hover:border-primary-mint-dark hover:text-ink"
        >
          + 접종 추가
        </button>
      }
    >
      <ul className="flex flex-col gap-2.5">
        {vaccinations.map((item) => {
          const dday = getDday(item.date)
          return (
            <li key={item.id}>
              <DdayPill label={item.name} dday={dday} urgent={isUrgent(dday)} />
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
    </Card>
  )
}
