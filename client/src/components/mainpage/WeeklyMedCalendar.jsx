const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

export default function WeeklyMedCalendar({ week }) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {week.map((day, index) => {
        const complete = day.taken === day.total
        return (
          <div key={day.date} className="flex flex-col items-center gap-1">
            <span className="text-xs text-ink-secondary">{DAY_LABELS[index]}</span>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                complete ? 'bg-primary-mint text-ink' : 'bg-coral/15 text-coral'
              }`}
            >
              {day.taken}/{day.total}
            </div>
          </div>
        )
      })}
    </div>
  )
}
