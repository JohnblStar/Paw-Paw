export const PET_AVATAR_PRESETS = [
  { key: 'dog-brown', species: 'dog', emoji: '🐶', label: '갈색 강아지' },
  { key: 'dog-white', species: 'dog', emoji: '🐩', label: '하얀 강아지' },
  { key: 'dog-black', species: 'dog', emoji: '🐕‍🦺', label: '까만 강아지' },
  { key: 'cat-tricolor', species: 'cat', emoji: '🐈', label: '삼색 고양이' },
  { key: 'cat-cheese', species: 'cat', emoji: '🐱', label: '치즈 고양이' },
  { key: 'cat-black', species: 'cat', emoji: '🐈‍⬛', label: '까만 고양이' },
]

export function getAvatarPresetsForSpecies(species) {
  return PET_AVATAR_PRESETS.filter((preset) => preset.species === species)
}

export function resolvePetAvatar(pet) {
  return PET_AVATAR_PRESETS.find((preset) => preset.key === pet.photoKey) ?? null
}

// 프리셋이 없는(구버전) pet도 항상 렌더링 가능한 값을 돌려준다 (이모지 또는 이름 이니셜).
export function getPetAvatarDisplay(pet) {
  return resolvePetAvatar(pet)?.emoji ?? pet.name.slice(0, 1)
}
