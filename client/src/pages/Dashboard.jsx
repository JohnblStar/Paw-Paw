import { useEffect, useState } from 'react'
import EmptyPetState from '@/components/mainpage/EmptyPetState'
import LoadingPaws from '@/components/common/LoadingPaws'
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

async function loadDashboard(petId) {
  return api.get(ENDPOINTS.PETS.DASHBOARD(petId))
}

async function loadMonthCalendar(petId, month) {
  return api.get(ENDPOINTS.PETS.MEDICATIONS_CALENDAR(petId), { params: { month } })
}

// pet.id로 키를 주어, 활성 반려동물이 바뀌면 이전 반려동물의 대시보드 state를 이어받지 않고
// 깨끗하게 다시 마운트되도록 한다.
function DashboardContent({ pet }) {
  const { applyPetUpdate } = usePet()
  const { weightEntriesByPetId, ensureWeightEntries } = useWeight()
  const [dashboardData, setDashboardData] = useState(null)
  const [monthCalendar, setMonthCalendar] = useState([])
  const [viewMonth, setViewMonth] = useState(() => todayISO().slice(0, 7))

  useEffect(() => {
    let ignore = false
    loadDashboard(pet.id).then((data) => {
      if (ignore) return
      setDashboardData(data)
      // 체중 기록/챗봇 등으로 서버 쪽 pet 정보(체중·건강노트)가 바뀌었을 수 있으니,
      // 대시보드를 열 때마다 PetProvider 캐시도 최신 상태로 맞춰둔다.
      applyPetUpdate(data.pet)
    })
    return () => {
      ignore = true
    }
  }, [pet.id, applyPetUpdate])

  useEffect(() => {
    let ignore = false
    loadMonthCalendar(pet.id, viewMonth).then((data) => {
      if (!ignore) setMonthCalendar(data)
    })
    return () => {
      ignore = true
    }
  }, [pet.id, viewMonth])

  useEffect(() => {
    ensureWeightEntries(pet.id)
  }, [pet.id, ensureWeightEntries])

  if (!dashboardData) {
    return <LoadingPaws />
  }

  const weightEntries = weightEntriesByPetId[pet.id] ?? []
  const graphPoints = dashboardData.weights.filter((point) => point.weight !== null)

  const refetch = async () => {
    const [dashboard, calendar] = await Promise.all([loadDashboard(pet.id), loadMonthCalendar(pet.id, viewMonth)])
    setDashboardData(dashboard)
    setMonthCalendar(calendar)
    applyPetUpdate(dashboard.pet)
  }

  const handleToggleMedication = async (medicationId, slotIndex) => {
    try {
      await api.patch(ENDPOINTS.PETS.MEDICATION_CHECK(pet.id, medicationId), null, {
        params: { slotIndex },
      })
    } finally {
      // 응답이 실패해도 서버에 반영됐을 수 있으므로 항상 최신 상태로 다시 맞춘다.
      refetch()
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
      <div className="flex flex-col gap-6">
        <BasicInfoCard pet={pet} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TodayMedicationCard
            petId={pet.id}
            medications={dashboardData.medicationsToday}
            onToggle={handleToggleMedication}
            onSaved={refetch}
          />
          <VaccinationListCard petId={pet.id} vaccinations={dashboardData.schedules} onSaved={refetch} />
        </div>

        <WeightGraphCard petId={pet.id} data={graphPoints} entries={weightEntries} onSaved={refetch} />
      </div>

      <div className="flex flex-col gap-6">
        <MonthlyMedCalendarCard
          viewMonth={viewMonth}
          onMonthChange={setViewMonth}
          monthData={monthCalendar}
          todayMedications={dashboardData.medicationsToday}
          onToggleToday={handleToggleMedication}
        />
        <HealthNotesCard petId={pet.id} petName={pet.name} notes={pet.healthNotes} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { activePet, isLoading } = usePet()

  if (isLoading) {
    return <LoadingPaws />
  }

  if (!activePet) {
    return <EmptyPetState />
  }

  return <DashboardContent key={activePet.id} pet={activePet} />
}
