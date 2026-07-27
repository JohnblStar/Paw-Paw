import { Outlet } from 'react-router-dom'
import RequireAuth from '@/components/RequireAuth'
import { PetProvider } from '@/context/PetProvider'
import { WeightProvider } from '@/context/WeightProvider'

export default function AuthenticatedLayout() {
  return (
    <RequireAuth>
      <PetProvider>
        <WeightProvider>
          <Outlet />
        </WeightProvider>
      </PetProvider>
    </RequireAuth>
  )
}
