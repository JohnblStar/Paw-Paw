import { useCallback, useEffect, useMemo, useState } from 'react'
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

  const updateAge = useCallback(async (age) => {
    const updated = await api.patch(ENDPOINTS.USERS.ME, { age })
    setUser(updated)
  }, [])

  const value = useMemo(() => ({ user, updateAge }), [user, updateAge])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
