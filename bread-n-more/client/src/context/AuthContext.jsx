import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

// Any component can call:  const { user, login, logout } = useAuth()
export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null) // { id, name, email, role, status } or null
  // true while we check a saved token with the server, so pages do not flash the login screen
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('breadToken')))

  // When the website opens: if a token was saved, ask the server who it belongs to
  useEffect(() => {
    if (!localStorage.getItem('breadToken')) return
    api
      .get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch((error) => {
        const status = error.response?.status
        if (status === 401 || status === 403) localStorage.removeItem('breadToken')
      })
      .finally(() => setLoading(false))
  }, [])

  // The axios helper announces "bread:logout" when the server says the token is no good
  useEffect(() => {
    const onLogout = () => setUser(null)
    window.addEventListener('bread:logout', onLogout)
    return () => window.removeEventListener('bread:logout', onLogout)
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('breadToken', data.token)
    setUser(data.user)
    return data.user
  }

  // returns the server's message ("An admin must approve it...")
  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    return data.message
  }

  const logout = () => {
    localStorage.removeItem('breadToken')
    setUser(null)
  }

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
