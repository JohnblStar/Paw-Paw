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

// 이번달 체중 기록. 미입력일은 이미 직전 값으로 carry-forward된 상태로 내려온다고 가정
// (그래프는 이 값을 그대로 그리면 자연히 끊김 없는 선이 된다).
export const mockMonthlyWeight = [
  { date: '2026-07-01', weight: 3.05 },
  { date: '2026-07-02', weight: 3.05 },
  { date: '2026-07-03', weight: 3.08 },
  { date: '2026-07-04', weight: 3.08 },
  { date: '2026-07-05', weight: 3.08 },
  { date: '2026-07-06', weight: 3.1 },
  { date: '2026-07-07', weight: 3.1 },
  { date: '2026-07-08', weight: 3.12 },
  { date: '2026-07-09', weight: 3.12 },
  { date: '2026-07-10', weight: 3.12 },
  { date: '2026-07-11', weight: 3.12 },
  { date: '2026-07-12', weight: 3.15 },
  { date: '2026-07-13', weight: 3.15 },
  { date: '2026-07-14', weight: 3.15 },
  { date: '2026-07-15', weight: 3.18 },
  { date: '2026-07-16', weight: 3.18 },
  { date: '2026-07-17', weight: 3.2 },
  { date: '2026-07-18', weight: 3.2 },
  { date: '2026-07-19', weight: 3.2 },
  { date: '2026-07-20', weight: 3.19 },
  { date: '2026-07-21', weight: 3.19 },
  { date: '2026-07-22', weight: 3.21 },
  { date: '2026-07-23', weight: 3.21 },
]

// mockWeeklyMedCalendar와 동일한 shape을 월 전체로 확장 (오늘까지만 존재)
export const mockMonthlyMedCalendar = [
  { date: '2026-07-01', taken: 3, total: 3 },
  { date: '2026-07-02', taken: 3, total: 3 },
  { date: '2026-07-03', taken: 2, total: 3 },
  { date: '2026-07-04', taken: 3, total: 3 },
  { date: '2026-07-05', taken: 3, total: 3 },
  { date: '2026-07-06', taken: 3, total: 3 },
  { date: '2026-07-07', taken: 2, total: 3 },
  { date: '2026-07-08', taken: 3, total: 3 },
  { date: '2026-07-09', taken: 3, total: 3 },
  { date: '2026-07-10', taken: 3, total: 3 },
  { date: '2026-07-11', taken: 3, total: 3 },
  { date: '2026-07-12', taken: 2, total: 3 },
  { date: '2026-07-13', taken: 3, total: 3 },
  { date: '2026-07-14', taken: 3, total: 3 },
  { date: '2026-07-15', taken: 2, total: 3 },
  { date: '2026-07-16', taken: 3, total: 3 },
  { date: '2026-07-17', taken: 3, total: 3 },
  { date: '2026-07-18', taken: 3, total: 3 },
  { date: '2026-07-19', taken: 2, total: 3 },
  { date: '2026-07-20', taken: 3, total: 3 },
  { date: '2026-07-21', taken: 3, total: 3 },
  { date: '2026-07-22', taken: 3, total: 3 },
  { date: '2026-07-23', taken: 2, total: 3 },
]

// 월간 캘린더 날짜 클릭 시 보여줄 상세 목록. 대표 날짜만 명시하고 나머지는
// 컴포넌트가 mockMedicationsToday 템플릿 + mockMonthlyMedCalendar의 taken/total로 조합한다.
export const mockMedicationCalendarDetail = {
  '2026-07-15': [
    { id: 'med-1', name: '심장사상충 예방약', time: '09:00', taken: true },
    { id: 'med-2', name: '관절 영양제', time: '09:00', taken: true },
    { id: 'med-3', name: '안구 건조증 점안액', time: '20:00', taken: false },
  ],
  '2026-07-23': [
    { id: 'med-1', name: '심장사상충 예방약', time: '09:00', taken: true },
    { id: 'med-2', name: '관절 영양제', time: '09:00', taken: true },
    { id: 'med-3', name: '안구 건조증 점안액', time: '20:00', taken: false },
  ],
}

// 예방접종/검진 목록 (단일날짜형). dday/urgent는 저장하지 않고 utils/dday.js로 렌더링 시점에 계산한다.
export const mockVaccinations = [
  { id: 'vac-1', name: '광견병 예방접종', date: '2026-07-26' },
  { id: 'vac-2', name: '종합 건강검진', date: '2026-08-15' },
  { id: 'vac-3', name: '켄넬코프 접종', date: '2026-09-02' },
]

// 뽀삐의 건강 — 증상 기록 히스토리. 병명 필드는 절대 두지 않는다 (프로젝트 절대 규칙).
export const mockHealthNotes = [
  { date: '2026-07-20', bodyPart: '왼쪽 눈', note: '눈을 자주 비비고 눈곱이 조금 있었어요' },
  { date: '2026-07-10', bodyPart: '피부', note: '배 쪽을 긁는 모습이 보였어요' },
  { date: '2026-07-02', bodyPart: '다리', note: '산책 중 잠깐 다리를 절뚝였어요' },
]
