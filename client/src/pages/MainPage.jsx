import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '@/components/layout/PageLayout'
import EmptyPetState from '@/components/mainpage/EmptyPetState'
import LeftWidget from '@/components/mainpage/LeftWidget'
import MascotPlaceholder from '@/components/mainpage/MascotPlaceholder'
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
  const weekCalendar = weekDates.map(
    (date) =>
      calendar.find((entry) => entry.date === date) ?? {
        date,
        taken: 0,
        total: dashboard.medicationsToday.length,
      },
  )
  return { dashboard, weekCalendar }
}

// pet.id로 키를 주어, 활성 반려동물이 바뀌면 이전 상태를 이어받지 않고 다시 마운트되도록 한다.
function MainPageContent({ pet }) {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState(null)
  const [weekCalendar, setWeekCalendar] = useState([])

  useEffect(() => {
    let ignore = false
    loadMainPageData(pet.id).then((result) => {
      if (ignore) return
      setDashboardData(result.dashboard)
      setWeekCalendar(result.weekCalendar)
    })
    return () => {
      ignore = true
    }
  }, [pet.id])

  if (!dashboardData) {
    return (
      <PageLayout>
        <p className="text-sm text-ink-secondary">불러오는 중...</p>
      </PageLayout>
    )
  }

  const upcomingDday = dashboardData.upcomingSchedule
    ? { name: dashboardData.upcomingSchedule.name, dday: dashboardData.upcomingSchedule.dDay }
    : null
  const todayHealthNote = pet.healthNotes.find((note) => note.date === todayISO()) ?? null

  const bubbleMessage = getBubbleMessage({
    medicationsToday: dashboardData.medicationsToday,
    upcomingDday,
    todayHealthNote,
  })

  const today = new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <PageLayout>
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-10">
        <div className="text-center">
          <p className="text-sm text-ink-secondary">{today}</p>
          <p className="mt-1 text-2xl font-bold text-ink">{pet.name}와 함께하는 하루</p>
        </div>

        <div className="grid w-full grid-cols-1 items-center gap-6 lg:grid-cols-[300px_1fr_300px]">
          <LeftWidget pet={pet} upcomingDday={upcomingDday} week={weekCalendar} />
          <MascotPlaceholder />
          <div className="flex justify-center lg:justify-start">
            <SpeechBubble message={bubbleMessage} />
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="rounded-full border border-primary-mint-dark px-6 py-2 text-sm font-semibold text-primary-mint-dark transition-colors hover:bg-primary-mint hover:text-ink"
        >
          자세히 보기
        </button>
      </div>
    </PageLayout>
  )
}

export default function MainPage() {
  const { activePet, isLoading } = usePet()

  if (isLoading) {
    return (
      <PageLayout>
        <p className="text-sm text-ink-secondary">불러오는 중...</p>
      </PageLayout>
    )
  }

  if (!activePet) {
    return (
      <PageLayout>
        <EmptyPetState />
      </PageLayout>
    )
  }

  return <MainPageContent key={activePet.id} pet={activePet} />
}
