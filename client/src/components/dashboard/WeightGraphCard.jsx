import { useState } from 'react'
import Card from '@/components/common/Card'
import WeightLineChart from '@/components/common/WeightLineChart'
import WeightLogModal from '@/components/dashboard/WeightLogModal'

export default function WeightGraphCard({ petId, data, entries }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <Card
      title="체중 변화"
      action={
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink-secondary transition-colors hover:border-primary-mint-dark hover:text-ink"
        >
          + 체중 기록
        </button>
      }
    >
      <WeightLineChart points={data} />

      <WeightLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        petId={petId}
        entries={entries}
      />
    </Card>
  )
}
