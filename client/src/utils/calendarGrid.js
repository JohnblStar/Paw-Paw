function toDateStr(year, month, day) {
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

// 월요일 시작 요일 인덱스 (JS의 getDay()는 일요일=0 이라 월요일 시작으로 보정)
function mondayFirstWeekday(date) {
  return (date.getDay() + 6) % 7
}

// year/month(1~12)의 달력을 월~일 주 단위 행으로 만든다.
// dataByDate: { 'YYYY-MM-DD': any } — 각 날짜 셀에 붙일 데이터. 없는 날짜는 data가 null.
export function buildMonthGrid(year, month, dataByDate = {}) {
  const firstDay = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const leadingBlanks = mondayFirstWeekday(firstDay)

  const cells = []
  for (let i = 0; i < leadingBlanks; i += 1) {
    cells.push(null)
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = toDateStr(year, month, day)
    cells.push({ date, day, data: dataByDate[date] ?? null })
  }
  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  return weeks
}
