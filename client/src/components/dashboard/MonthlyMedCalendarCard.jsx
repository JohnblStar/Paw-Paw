import { useMemo, useState } from 'react'
import { CalendarDays, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import Card from '@/components/common/Card'
import Modal from '@/components/common/Modal'
import { buildMonthGrid } from '@/utils/calendarGrid'
import { todayISO, shiftMonth } from '@/utils/date'

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

export default function MonthlyMedCalendarCard({ viewMonth, onMonthChange, monthData, todayMedications, onToggleToday }) {
  const todayStr = todayISO()

  const [selectedDate, setSelectedDate] = useState(null)

  const dataByDate = useMemo(() => {
    const map = {}
    monthData.forEach((entry) => {
      map[entry.date] = entry
    })
    return map
  }, [monthData])

  const [year, month] = viewMonth.split('-').map(Number)

  const weeks = useMemo(() => buildMonthGrid(year, month, dataByDate), [year, month, dataByDate])

  const openDay = (cell) => {
    if (!cell?.data) return
    setSelectedDate(cell.date)
  }

  const isTodaySelected = selectedDate === todayStr
  const selectedSummary = selectedDate ? dataByDate[selectedDate] : null

  return (
    <Card title="월간 복약 캘린더" icon={CalendarDays} tone="mint">
      <div className="mb-4 flex items-center justify-between rounded-full bg-surface-muted/70 p-1">
        <button
          type="button"
          onClick={() => onMonthChange(shiftMonth(viewMonth, -1))}
          aria-label="이전 달"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-secondary transition-colors hover:bg-surface hover:text-ink hover:shadow-chip"
        >
          <ChevronLeft size={17} />
        </button>
        <span className="text-sm font-bold tabular-nums text-ink">
          {year}년 {month}월
        </span>
        <button
          type="button"
          onClick={() => onMonthChange(shiftMonth(viewMonth, 1))}
          aria-label="다음 달"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-secondary transition-colors hover:bg-surface hover:text-ink hover:shadow-chip"
        >
          <ChevronRight size={17} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center">
        {DAY_LABELS.map((label) => (
          <span key={label} className="pb-1 text-[11px] font-semibold text-muted">
            {label}
          </span>
        ))}

        {weeks.flat().map((cell, index) => {
          if (!cell) return <div key={`blank-${index}`} />

          const clickable = Boolean(cell.data)
          const complete = cell.data && cell.data.taken === cell.data.total
          const isFuture = cell.date > todayStr

          return (
            <button
              key={cell.date}
              type="button"
              disabled={!clickable}
              onClick={() => openDay(cell)}
              className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-xs transition-colors ${
                cell.date === todayStr ? 'bg-ink/[0.04] ring-1 ring-ink/70' : ''
              } ${clickable ? 'cursor-pointer hover:bg-surface-muted' : 'cursor-default'}`}
            >
              <span className={`tabular-nums ${cell.date === todayStr ? 'font-bold text-ink' : 'text-ink-secondary'}`}>{cell.day}</span>
              {cell.data && (
                <span
                  className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums ${
                    isFuture
                      ? 'bg-surface-muted text-muted'
                      : complete
                        ? 'bg-primary-mint text-ink'
                        : 'bg-coral-soft text-coral-deep'
                  }`}
                >
                  {cell.data.taken}/{cell.data.total}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <Modal isOpen={Boolean(selectedDate)} onClose={() => setSelectedDate(null)} title={`${selectedDate} 복약 목록`}>
        {isTodaySelected ? (
          <ul className="flex flex-col gap-2">
            {todayMedications.length === 0 ? (
              <p className="text-sm text-ink-secondary">등록된 약이 없어요</p>
            ) : (
              todayMedications.map((med) => (
                <li
                  key={med.id}
                  className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm"
                >
                  <span className="text-ink">{med.name}</span>
                  <span className="flex items-center gap-1.5">
                    {med.takenSlots.map((isTaken, index) => (
                      <button
                        key={index}
                        type="button"
                        title={med.alertTimes?.[index] ?? `${index + 1}회`}
                        onClick={() => onToggleToday(med.id, index)}
                        className={`flex h-7 w-7 items-center justify-center rounded-full transition-all active:scale-90 ${
                          isTaken
                            ? 'bg-primary-mint text-ink'
                            : 'border border-dashed border-border-strong bg-surface text-muted hover:border-primary-mint-dark'
                        }`}
                      >
                        {isTaken ? <Check size={14} strokeWidth={3} /> : ''}
                      </button>
                    ))}
                  </span>
                </li>
              ))
            )}
          </ul>
        ) : selectedDate > todayStr ? (
          <p className="text-sm text-ink-secondary">
            그 날 예정된 복약은 {selectedSummary?.total}개예요. 미래 날짜는 개별 내역을 미리 확인만 할 수
            있어요.
          </p>
        ) : (
          <p className="text-sm text-ink-secondary">
            그 날 복약 {selectedSummary?.taken}/{selectedSummary?.total}개 완료했어요. 지난 날짜의 개별 내역
            수정은 지원하지 않아요.
          </p>
        )}
      </Modal>
    </Card>
  )
}
