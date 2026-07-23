import Card from '@/components/common/Card'
import WeightLineChart from '@/components/common/WeightLineChart'

export default function WeightGraphCard({ data }) {
  return (
    <Card title="체중 변화">
      <WeightLineChart points={data} />
    </Card>
  )
}
