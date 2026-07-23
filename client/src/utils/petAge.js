export function calcAgeLabel(birthDate) {
  const birth = new Date(birthDate)
  const today = new Date()

  let years = today.getFullYear() - birth.getFullYear()
  let months = today.getMonth() - birth.getMonth()

  if (today.getDate() < birth.getDate()) {
    months -= 1
  }
  if (months < 0) {
    years -= 1
    months += 12
  }

  if (years <= 0) {
    return `${months}개월`
  }
  return `${years}세 ${months}개월`
}
