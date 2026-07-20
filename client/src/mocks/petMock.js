// 백엔드 연동 전까지 사용하는 mock 데이터.
// 실제 API 연동 시 이 파일의 형태를 그대로 응답 스키마로 대체한다.

export const mockOwner = {
  name: '김보호',
}

export const mockPets = [
  {
    id: 'pet-1',
    name: '뽀삐',
    species: 'dog',
    breed: '포메라니안',
    birthDate: '2023-05-12',
    sex: 'female',
    neutered: true,
    weight: 3.21,
    managedConditions: [],
  },
]

export const mockMedicationsToday = [
  { id: 'med-1', name: '심장사상충 예방약', time: '09:00', taken: true },
  { id: 'med-2', name: '관절 영양제', time: '09:00', taken: true },
  { id: 'med-3', name: '안구 건조증 점안액', time: '20:00', taken: false },
]

// 이번주 월~일, 오늘까지만 taken 데이터가 존재한다고 가정
export const mockWeeklyMedCalendar = [
  { date: '2026-07-13', taken: 3, total: 3 },
  { date: '2026-07-14', taken: 3, total: 3 },
  { date: '2026-07-15', taken: 2, total: 3 },
  { date: '2026-07-16', taken: 3, total: 3 },
  { date: '2026-07-17', taken: 3, total: 3 },
  { date: '2026-07-18', taken: 2, total: 3 },
  { date: '2026-07-19', taken: 3, total: 3 },
]

export const mockUpcomingDday = {
  id: 'dday-1',
  name: '심장사상충 예방약',
  date: '2026-07-23',
  dday: 3,
  urgent: true,
}

// 오늘 새로 기록된 특이사항이 없는 기본 상태 (flavor 멘트로 폴백되는 케이스)
export const mockTodayHealthNote = null

export const flavorMessages = [
  '배고파여...',
  '오늘 산책 언제 가요?',
  '기분이 좋아요!',
  '낮잠 잘래요 zzz',
]
