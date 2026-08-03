import { Outlet } from 'react-router-dom'
import RequireAuth from '@/components/RequireAuth'
import { UserProvider } from '@/context/UserProvider'
import { PetProvider } from '@/context/PetProvider'
import { WeightProvider } from '@/context/WeightProvider'

export default function AuthenticatedLayout() {
  return (
    <RequireAuth>
      <UserProvider>
        <PetProvider>
          <WeightProvider>
            <Outlet />
          </WeightProvider>
        </PetProvider>
      </UserProvider>
    </RequireAuth>
  )
}
