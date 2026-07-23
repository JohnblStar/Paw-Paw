import { useCallback, useState } from 'react'

const TOKEN_KEY = 'access_token'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem(TOKEN_KEY))

  const login = useCallback((accessToken) => {
    localStorage.setItem(TOKEN_KEY, accessToken)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setIsAuthenticated(false)
  }, [])

  return { isAuthenticated, login, logout }
}
