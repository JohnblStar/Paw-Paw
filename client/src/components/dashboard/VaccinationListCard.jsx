import Card from '@/components/common/Card'
import DdayPill from '@/components/common/DdayPill'
import { getDday, isUrgent } from '@/utils/dday'

export default function VaccinationListCard({ vaccinations }) {
  return (
    <Card title="예방접종/검진">
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
    </Card>
  )
}
