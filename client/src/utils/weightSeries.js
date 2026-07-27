// 특정 날짜에 입력이 없으면 직전 입력값을 그대로 이어서 그래프 선이 끊기지 않게 한다 (절대 규칙).
// entries는 사용자가 실제 입력한 날짜만 있는 sparse 배열이라고 가정한다.
export function buildMonthlyWeightSeries(entries, month) {
  const [year, mon] = month.split('-').map(Number)
  const lastDay = new Date(year, mon, 0).getDate()
  const weightByDate = new Map(entries.map((entry) => [entry.date, entry.weight]))

  const series = []
  let lastValue = null
  for (let day = 1; day <= lastDay; day += 1) {
    const date = `${year}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (weightByDate.has(date)) {
      lastValue = weightByDate.get(date)
    }
    if (lastValue !== null) {
      series.push({ date, weight: lastValue })
    }
  }
  return series
}
