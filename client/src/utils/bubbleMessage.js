import { flavorMessages } from '@/mocks/petMock'

/**
 * 메인페이지 말풍선 문구를 결정한다. docs/features/dashboard.md의 우선순위를 그대로 따른다.
 * 1) 오늘 미복용 약 2) D-day 3일 이내 예방접종 3) 오늘 신규 기록된 특이사항 4) flavor 멘트
 */
export function getBubbleMessage({ medicationsToday, upcomingDday, todayHealthNote }) {
  const unfinished = medicationsToday.find((med) => !med.taken)
  if (unfinished) {
    return { type: 'medication', text: '오늘 약 아직 안 먹었어요!' }
  }

  if (upcomingDday && upcomingDday.dday <= 3) {
    return { type: 'dday', text: `${upcomingDday.name}이 D-${upcomingDday.dday}예요!` }
  }

  if (todayHealthNote) {
    return { type: 'health', text: '오늘 좀 컨디션이 안 좋았어요...' }
  }

  const flavor = flavorMessages[Math.floor(Math.random() * flavorMessages.length)]
  return { type: 'flavor', text: flavor }
}
