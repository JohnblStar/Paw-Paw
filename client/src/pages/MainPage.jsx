import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const totalDoses = dashboard.medicationsToday.reduce((sum, med) => sum + med.frequencyPerDay, 0)
  const weekCalendar = weekDates.map(
    (date) =>
      calendar.find((entry) => entry.date === date) ?? {
        date,
        taken: 0,
        total: totalDoses,
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
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center gap-10 pt-10 sm:pt-14">
      <div className="text-center">
        <p className="text-base text-ink-secondary">{today}</p>
        <p className="mt-1 text-4xl font-bold text-ink">{pet.name}와 함께하는 하루</p>
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
        className="rounded-full border border-primary-mint-dark px-6 py-2 text-sm font-semibold text-primary-mint-dark transition-colors hover:bg-primary-mint hover:text-ink"
      >
        자세히 보기
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
