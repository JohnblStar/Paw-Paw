import PageLayout from '@/components/layout/PageLayout'
import EmptyPetState from '@/components/mainpage/EmptyPetState'
import BasicInfoCard from '@/components/dashboard/BasicInfoCard'
import TodayMedicationCard from '@/components/dashboard/TodayMedicationCard'
import VaccinationListCard from '@/components/dashboard/VaccinationListCard'
import WeightGraphCard from '@/components/dashboard/WeightGraphCard'
import MonthlyMedCalendarCard from '@/components/dashboard/MonthlyMedCalendarCard'
import HealthNotesCard from '@/components/dashboard/HealthNotesCard'
import { usePet } from '@/context/usePet'
import {
  mockHealthNotes,
  mockMedicationCalendarDetail,
  mockMedicationsToday,
  mockMonthlyMedCalendar,
  mockMonthlyWeight,
  mockVaccinations,
} from '@/mocks/petMock'

export default function Dashboard() {
  const { activePet } = usePet()

  if (!activePet) {
    return (
      <PageLayout>
        <EmptyPetState />
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="flex flex-col gap-6">
          <BasicInfoCard pet={activePet} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TodayMedicationCard medications={mockMedicationsToday} />
            <VaccinationListCard vaccinations={mockVaccinations} />
          </div>

          <WeightGraphCard data={mockMonthlyWeight} />
        </div>

        <div className="flex flex-col gap-6">
          <MonthlyMedCalendarCard
            monthData={mockMonthlyMedCalendar}
            detailByDate={mockMedicationCalendarDetail}
            medicationTemplate={mockMedicationsToday}
          />
          <HealthNotesCard notes={mockHealthNotes} />
        </div>
      </div>
    </PageLayout>
  )
}
