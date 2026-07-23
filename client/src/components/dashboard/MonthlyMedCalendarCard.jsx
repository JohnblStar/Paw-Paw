import { useMemo, useState } from 'react'
import Card from '@/components/common/Card'
import Modal from '@/components/common/Modal'
import { buildMonthGrid } from '@/utils/calendarGrid'

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

function synthesizeDayMeds(template, dayData) {
  if (!dayData) return []
  let remainingTaken = dayData.taken
  return template.map((med) => {
    const taken = remainingTaken > 0
    if (taken) remainingTaken -= 1
    return { ...med, taken }
  })
}

export default function MonthlyMedCalendarCard({ monthData, detailByDate, medicationTemplate }) {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  const [selectedDate, setSelectedDate] = useState(null)
  const [dayMeds, setDayMeds] = useState([])

  const dataByDate = useMemo(() => {
    const map = {}
    monthData.forEach((entry) => {
      map[entry.date] = entry
    })
    return map
  }, [monthData])

  const year = today.getFullYear()
  const month = today.getMonth() + 1

  const weeks = useMemo(() => buildMonthGrid(year, month, dataByDate), [year, month, dataByDate])

  const openDay = (cell) => {
    if (!cell?.data || cell.date > todayStr) return
    const detail = detailByDate[cell.date] ?? synthesizeDayMeds(medicationTemplate, cell.data)
    setSelectedDate(cell.date)
    setDayMeds(detail)
  }

  const toggleMed = (id) => {
    setDayMeds((prev) => prev.map((med) => (med.id === id ? { ...med, taken: !med.taken } : med)))
  }

  return (
    <Card title="월간 복약 캘린더">
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {DAY_LABELS.map((label) => (
          <span key={label} className="text-xs text-ink-secondary">
            {label}
          </span>
        ))}

        {weeks.flat().map((cell, index) => {
          if (!cell) return <div key={`blank-${index}`} />

          const clickable = cell.data && cell.date <= todayStr
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
        <ul className="flex flex-col gap-2">
          {dayMeds.map((med) => (
            <li key={med.id}>
              <button
                type="button"
                onClick={() => toggleMed(med.id)}
                className="flex w-full items-center justify-between rounded-xl border border-border px-3 py-2 text-sm"
              >
                <span className="text-ink">
                  {med.name}
                  <span className="ml-2 text-xs text-ink-secondary">{med.time}</span>
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
          ))}
        </ul>
      </Modal>
    </Card>
  )
}
