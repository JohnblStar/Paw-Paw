export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

// 이번 주 월~일 7일의 날짜(YYYY-MM-DD) 배열을 반환한다.
export function getWeekDates(date = new Date()) {
  const mondayOffset = (date.getDay() + 6) % 7
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - mondayOffset)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}
