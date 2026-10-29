import { useState } from 'react'
import { Plus, Scale } from 'lucide-react'
import Card from '@/components/common/Card'
import WeightLineChart from '@/components/common/WeightLineChart'
import WeightLogModal from '@/components/dashboard/WeightLogModal'
import { CHIP_BUTTON_CLASS } from '@/constants/formStyles'

export default function WeightGraphCard({ petId, data, entries, standardRange, onSaved }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <Card
      title="체중 변화"
      icon={Scale}
      action={
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={CHIP_BUTTON_CLASS}
        >
          <Plus size={13} strokeWidth={2.5} />
          체중 기록
        </button>
      }
    >
      <WeightLineChart points={data} standardRange={standardRange} />

      <WeightLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        petId={petId}
        entries={entries}
        onSaved={onSaved}
      />
    </Card>
  )
}
