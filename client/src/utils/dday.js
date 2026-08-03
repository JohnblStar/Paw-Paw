export const URGENT_THRESHOLD_DAYS = 3

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function getDday(dateStr, today = new Date()) {
  const target = startOfDay(new Date(dateStr))
  const base = startOfDay(today)
  const diffMs = target.getTime() - base.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

export function isUrgent(dday) {
  return dday >= 0 && dday <= URGENT_THRESHOLD_DAYS
}
