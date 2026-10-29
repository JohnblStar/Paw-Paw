import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import EmptyPetState from '@/components/mainpage/EmptyPetState'
import LoadingPaws from '@/components/common/LoadingPaws'
import LeftWidget from '@/components/mainpage/LeftWidget'
import Mascot from '@/components/mainpage/Mascot'
import SpeechBubble from '@/components/mainpage/SpeechBubble'
import { usePet } from '@/context/usePet'
import api from '@/api/instance'
import { ENDPOINTS } from '@/api/endpoints'
import { getBubbleMessage } from '@/utils/bubbleMessage'
import { getWeekDates, todayISO } from '@/utils/date'

async function loadMainPageData(petId) {
  const [dashboard, calendar] = await Promise.all([
    api.get(ENDPOINTS.PETS.DASHBOARD(petId)),
    api.get(ENDPOINTS.PETS.MEDICATIONS_CALENDAR(petId), { params: { month: todayISO().slice(0, 7) } }),
  ])
  const weekDates = getWeekDates()
  const weekCalendar = weekDates.map((date) => {
    const found = calendar.find((entry) => entry.date === date)
    // 캘린더 응답에 없다는 건 그 날 활성화된 약이 없다는 뜻(과거/미래 공통).
    return found ?? { date, taken: 0, total: 0 }
  })
  return { dashboard, weekCalendar }
}

// pet.id로 키를 주어, 활성 반려동물이 바뀌면 이전 상태를 이어받지 않고 다시 마운트되도록 한다.
function MainPageContent({ pet }) {
  const navigate = useNavigate()
  const { applyPetUpdate } = usePet()
  const [dashboardData, setDashboardData] = useState(null)
  const [weekCalendar, setWeekCalendar] = useState([])

  useEffect(() => {
    let ignore = false
    loadMainPageData(pet.id).then((result) => {
      if (ignore) return
      setDashboardData(result.dashboard)
      setWeekCalendar(result.weekCalendar)
      // 다른 화면에서 바뀐 체중/건강노트가 반영되도록 PetProvider 캐시도 같이 최신화한다.
      applyPetUpdate(result.dashboard.pet)
    })
    return () => {
      ignore = true
    }
  }, [pet.id, applyPetUpdate])

  if (!dashboardData) {
    return <LoadingPaws />
  }

  const upcomingDday = dashboardData.upcomingSchedule
    ? { name: dashboardData.upcomingSchedule.name, dday: dashboardData.upcomingSchedule.dDay }
    : null
  const todayHealthNote = pet.healthNotes.find((note) => note.date === todayISO()) ?? null

  const bubbleMessage = getBubbleMessage({
    medicationsToday: dashboardData.medicationsToday,
    upcomingDday,
    todayHealthNote,
    species: pet.species,
  })

  const today = new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center gap-10 pt-6 sm:pt-12">
      <div className="text-center">
        <p className="inline-flex items-center rounded-full border border-border bg-surface/70 px-3 py-1 text-xs font-medium text-ink-secondary">
          {today}
        </p>
        <p className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-[2.6rem]">{pet.name}와 함께하는 하루</p>
      </div>

      <div className="grid w-full grid-cols-1 items-center gap-6 lg:grid-cols-[340px_1fr_340px]">
        <LeftWidget pet={pet} upcomingDday={upcomingDday} week={weekCalendar} />
        <Mascot species={pet.species} />
        <div className="flex justify-center lg:justify-start">
          <SpeechBubble message={bubbleMessage} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white shadow-chip transition-all hover:bg-ink/85 active:scale-[0.98]"
      >
        자세히 보기
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  )
}

export default function MainPage() {
  const { activePet, isLoading } = usePet()

  if (isLoading) {
    return <LoadingPaws />
  }

  if (!activePet) {
    return <EmptyPetState />
  }

  return <MainPageContent key={activePet.id} pet={activePet} />
}
