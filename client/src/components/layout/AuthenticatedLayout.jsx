import { Outlet } from 'react-router-dom'
import RequireAuth from '@/components/RequireAuth'
import { PetProvider } from '@/context/PetProvider'

export default function AuthenticatedLayout() {
  return (
    <RequireAuth>
      <PetProvider>
        <Outlet />
      </PetProvider>
    </RequireAuth>
  )
}
