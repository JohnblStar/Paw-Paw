function toLocalISODate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayISO() {
  return toLocalISODate(new Date())
}

// 'YYYY-MM-DD'의 1년 뒤 날짜. 2/29처럼 다음 해에 없는 날짜는 그 달 말일(2/28)로 맞춘다.
export function addOneYear(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number)
  const lastDay = new Date(year + 1, month, 0).getDate()
  return `${year + 1}-${String(month).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`
}

// 'YYYY-MM' 문자열을 delta개월만큼 이동한 'YYYY-MM' 문자열로 반환한다.
export function shiftMonth(monthStr, delta) {
  const [year, month] = monthStr.split('-').map(Number)
  const d = new Date(year, month - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// 이번 주 월~일 7일의 날짜(YYYY-MM-DD) 배열을 반환한다.
export function getWeekDates(date = new Date()) {
  const mondayOffset = (date.getDay() + 6) % 7
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - mondayOffset)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
    return toLocalISODate(d)
  })
}
