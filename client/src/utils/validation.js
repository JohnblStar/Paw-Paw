export function isValidWeight(value) {
  return value !== '' && !Number.isNaN(Number(value)) && Number(value) > 0
}
