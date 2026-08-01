import { useMemo, useState } from 'react'
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
    <Card title="월간 복약 캘린더">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(shiftMonth(viewMonth, -1))}
          aria-label="이전 달"
          className="rounded-full px-2 py-1 text-2xl font-bold text-ink-secondary transition-colors hover:text-ink"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-ink">
          {year}년 {month}월
        </span>
        <button
          type="button"
          onClick={() => onMonthChange(shiftMonth(viewMonth, 1))}
          aria-label="다음 달"
          className="rounded-full px-2 py-1 text-2xl font-bold text-ink-secondary transition-colors hover:text-ink"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center">
        {DAY_LABELS.map((label) => (
          <span key={label} className="text-xs text-ink-secondary">
            {label}
          </span>
        ))}

        {weeks.flat().map((cell, index) => {
          if (!cell) return <div key={`blank-${index}`} />

          const clickable = Boolean(cell.data)
          const complete = cell.data && cell.data.taken === cell.data.total

          return (
            <button
              key={cell.date}
              type="button"
              disabled={!clickable}
              onClick={() => openDay(cell)}
              className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-xs ${
                cell.date === todayStr ? 'ring-1 ring-primary-purple' : ''
              } ${clickable ? 'cursor-pointer hover:bg-bg' : 'cursor-default'}`}
            >
              <span className="text-ink-secondary">{cell.day}</span>
              {cell.data && (
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${
                    complete ? 'bg-primary-mint text-ink' : 'bg-coral/15 text-coral'
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
                <li key={med.id}>
                  <button
                    type="button"
                    onClick={() => onToggleToday(med.id)}
                    className="flex w-full items-center justify-between rounded-xl border border-border px-3 py-2 text-sm"
                  >
                    <span className="text-ink">
                      {med.name}
                      <span className="ml-2 text-xs text-ink-secondary">{med.alertTimes?.join(', ')}</span>
                    </span>
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        med.taken ? 'bg-primary-mint text-ink' : 'bg-bg border border-border text-muted'
                      }`}
                    >
                      {med.taken ? '✓' : ''}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
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
