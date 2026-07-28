import { useEffect, useMemo, useState } from 'react'
import { UserContext } from '@/context/UserContext'
import api from '@/api/instance'
import { ENDPOINTS } from '@/api/endpoints'

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    let cancelled = false
    api.get(ENDPOINTS.USERS.ME).then((data) => {
      if (!cancelled) setUser(data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(() => ({ user }), [user])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
