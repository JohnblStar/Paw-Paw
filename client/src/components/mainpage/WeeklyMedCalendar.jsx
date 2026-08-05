import { todayISO } from '@/utils/date'

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

export default function WeeklyMedCalendar({ week }) {
  const todayStr = todayISO()

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {week.map((day, index) => {
        const hasMedication = day.total > 0
        const complete = day.taken === day.total
        const isFuture = day.date > todayStr

        return (
          <div key={day.date} className="flex flex-col items-center gap-1">
            <span className="text-xs text-ink-secondary">{DAY_LABELS[index]}</span>
            {hasMedication ? (
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  isFuture
                    ? 'bg-bg text-ink-secondary/70'
                    : complete
                      ? 'bg-primary-mint text-ink'
                      : 'bg-coral/15 text-coral'
                }`}
              >
                {day.taken}/{day.total}
              </div>
            ) : (
              <div className="h-8 w-8" />
            )}
          </div>
        )
      })}
    </div>
  )
}
