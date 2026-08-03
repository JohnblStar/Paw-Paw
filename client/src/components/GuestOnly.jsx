import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function GuestOnly({ children }) {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/main" replace />
  }

  return children
}

export default GuestOnly
