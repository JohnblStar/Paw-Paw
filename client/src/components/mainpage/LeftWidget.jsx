import WeeklyMedCalendar from '@/components/mainpage/WeeklyMedCalendar'

export default function LeftWidget({ pet, upcomingDday, week }) {
  return (
    <div className="flex h-full flex-col gap-5 rounded-3xl border border-border bg-white p-6">
      <div>
        <p className="text-xs text-ink-secondary">우리 아이</p>
        <p className="text-lg font-bold text-ink">{pet.name}</p>
      </div>

      {upcomingDday && (
        <div className="rounded-2xl bg-amber/40 px-4 py-3">
          <p className="text-xs font-medium text-ink-secondary">{upcomingDday.name}</p>
          <p className="text-sm font-bold text-ink">D-{upcomingDday.dday}</p>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-medium text-ink-secondary">이번주 복약</p>
        <WeeklyMedCalendar week={week} />
      </div>
    </div>
  )
}
