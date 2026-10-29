import { CalendarClock, Tablets } from 'lucide-react'
import WeeklyMedCalendar from '@/components/mainpage/WeeklyMedCalendar'

export default function LeftWidget({ pet, upcomingDday, week }) {
  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-border bg-surface p-6 shadow-card">
      <div>
        <p className="text-xs font-medium text-ink-secondary">우리 아이</p>
        <p className="mt-0.5 text-xl font-extrabold tracking-tight text-ink">{pet.name}</p>
        <p className="mt-1 text-sm text-ink-secondary">
          현재 체중 <span className="font-semibold tabular-nums text-ink">{pet.weight}kg</span>
        </p>
      </div>

      {upcomingDday && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink-secondary">
            <CalendarClock size={13} />
            다가오는 일정
          </p>
          <div className="flex items-center justify-between rounded-2xl bg-amber-soft px-4 py-3">
            <p className="text-sm font-medium text-ink">{upcomingDday.name}</p>
            <p className="text-sm font-extrabold text-amber-deep">D-{upcomingDday.dday}</p>
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink-secondary">
          <Tablets size={13} />
          이번주 복약
        </p>
        <WeeklyMedCalendar week={week} />
      </div>
    </div>
  )
}
