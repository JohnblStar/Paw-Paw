import { useEffect, useState } from 'react'
import PageLayout from '@/components/layout/PageLayout'
import EmptyPetState from '@/components/mainpage/EmptyPetState'
import BasicInfoCard from '@/components/dashboard/BasicInfoCard'
import TodayMedicationCard from '@/components/dashboard/TodayMedicationCard'
import VaccinationListCard from '@/components/dashboard/VaccinationListCard'
import WeightGraphCard from '@/components/dashboard/WeightGraphCard'
import MonthlyMedCalendarCard from '@/components/dashboard/MonthlyMedCalendarCard'
import HealthNotesCard from '@/components/dashboard/HealthNotesCard'
import { usePet } from '@/context/usePet'
import { useWeight } from '@/context/useWeight'
import api from '@/api/instance'
import { ENDPOINTS } from '@/api/endpoints'
import { todayISO } from '@/utils/date'

async function loadDashboardData(petId) {
  const [dashboard, monthCalendar] = await Promise.all([
    api.get(ENDPOINTS.PETS.DASHBOARD(petId)),
    api.get(ENDPOINTS.PETS.MEDICATIONS_CALENDAR(petId), { params: { month: todayISO().slice(0, 7) } }),
  ])
  return { dashboard, monthCalendar }
}

// pet.id로 키를 주어, 활성 반려동물이 바뀌면 이전 반려동물의 대시보드 state를 이어받지 않고
// 깨끗하게 다시 마운트되도록 한다.
function DashboardContent({ pet }) {
  const { weightEntriesByPetId, ensureWeightEntries } = useWeight()
  const [dashboardData, setDashboardData] = useState(null)
  const [monthCalendar, setMonthCalendar] = useState([])

  useEffect(() => {
    let ignore = false
    loadDashboardData(pet.id).then((result) => {
      if (ignore) return
      setDashboardData(result.dashboard)
      setMonthCalendar(result.monthCalendar)
    })
    return () => {
      ignore = true
    }
  }, [pet.id])

  useEffect(() => {
    ensureWeightEntries(pet.id)
  }, [pet.id, ensureWeightEntries])

  if (!dashboardData) {
    return (
      <PageLayout>
        <p className="text-sm text-ink-secondary">불러오는 중...</p>
      </PageLayout>
    )
  }

  const weightEntries = weightEntriesByPetId[pet.id] ?? []
  const graphPoints = dashboardData.weights.filter((point) => point.weight !== null)

  const refetch = async () => {
    const result = await loadDashboardData(pet.id)
    setDashboardData(result.dashboard)
    setMonthCalendar(result.monthCalendar)
  }

  const handleToggleMedication = async (medicationId) => {
    await api.patch(ENDPOINTS.PETS.MEDICATION_CHECK(pet.id, medicationId))
    refetch()
  }

  return (
    <PageLayout>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="flex flex-col gap-6">
          <BasicInfoCard pet={pet} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TodayMedicationCard
              medications={dashboardData.medicationsToday}
              onToggle={handleToggleMedication}
              onSaved={refetch}
            />
            <VaccinationListCard vaccinations={dashboardData.schedules} onSaved={refetch} />
          </div>

          <WeightGraphCard petId={pet.id} data={graphPoints} entries={weightEntries} />
        </div>

        <div className="flex flex-col gap-6">
          <MonthlyMedCalendarCard
            monthData={monthCalendar}
            todayMedications={dashboardData.medicationsToday}
            onToggleToday={handleToggleMedication}
          />
          <HealthNotesCard petName={pet.name} notes={pet.healthNotes} />
        </div>
      </div>
    </PageLayout>
  )
}

export default function Dashboard() {
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

  return <DashboardContent key={activePet.id} pet={activePet} />
}
