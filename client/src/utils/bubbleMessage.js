import { flavorMessages } from '@/constants/flavorMessages'

// 시간대별로 다른 flavor 멘트 풀을 쓰기 위한 구간 판정 (예: 한밤중엔 "산책 나갈까요?"가 안 나오게).
function getTimeBucket(hour = new Date().getHours()) {
  if (hour < 6) return 'night'
  if (hour < 11) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 21) return 'evening'
  return 'night'
}

/**
 * 메인페이지 말풍선 문구를 결정한다. docs/features/dashboard.md의 우선순위를 그대로 따른다.
 * 1) 오늘 미복용 약 2) D-day 3일 이내 예방접종 3) 오늘 신규 기록된 특이사항 4) flavor 멘트
 * flavor 멘트는 장식이 아니라 종/시간대에 맞는 행동 가이드 역할도 겸하므로(산책은 강아지 전용 등),
 * species(dog|cat)와 현재 시간대에 맞는 풀에서만 고른다.
 */
export function getBubbleMessage({ medicationsToday, upcomingDday, todayHealthNote, species }) {
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

  const pool = (flavorMessages[species] ?? flavorMessages.dog)[getTimeBucket()]
  const flavor = pool[Math.floor(Math.random() * pool.length)]
  return { type: 'flavor', text: flavor }
}
