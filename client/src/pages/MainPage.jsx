import { useNavigate } from 'react-router-dom'
import PageLayout from '@/components/layout/PageLayout'
import EmptyPetState from '@/components/mainpage/EmptyPetState'
import LeftWidget from '@/components/mainpage/LeftWidget'
import MascotPlaceholder from '@/components/mainpage/MascotPlaceholder'
import SpeechBubble from '@/components/mainpage/SpeechBubble'
import { usePet } from '@/context/usePet'
import {
  mockMedicationsToday,
  mockTodayHealthNote,
  mockUpcomingDday,
  mockWeeklyMedCalendar,
} from '@/mocks/petMock'
import { getBubbleMessage } from '@/utils/bubbleMessage'

export default function MainPage() {
  const { activePet } = usePet()
  const navigate = useNavigate()

  if (!activePet) {
    return (
      <PageLayout>
        <EmptyPetState />
      </PageLayout>
    )
  }

  const bubbleMessage = getBubbleMessage({
    medicationsToday: mockMedicationsToday,
    upcomingDday: mockUpcomingDday,
    todayHealthNote: mockTodayHealthNote,
  })

  return (
    <PageLayout>
      <div className="flex min-h-[calc(100vh-8rem)] flex-col justify-between gap-6">
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[300px_1fr_300px]">
          <LeftWidget pet={activePet} upcomingDday={mockUpcomingDday} week={mockWeeklyMedCalendar} />
          <MascotPlaceholder />
          <div className="flex justify-center lg:justify-start lg:pt-8">
            <SpeechBubble message={bubbleMessage} />
          </div>
        </div>

        <div className="flex justify-center pb-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-full border border-primary-mint-dark px-6 py-2 text-sm font-semibold text-primary-mint-dark transition-colors hover:bg-primary-mint hover:text-ink"
          >
            자세히 보기
          </button>
        </div>
      </div>
    </PageLayout>
  )
}
