import { createContext, useContext, useEffect, useState } from 'react'
import axiosClient from '../api/axiosClient'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light'
  })

  const applyTheme = (nextTheme) => {
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', nextTheme)
    setTheme(nextTheme)
  }

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token')

      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }

      const res = await axiosClient.get('/auth/me')
      const me = res.data.user

      setUser(me)
      localStorage.setItem('user', JSON.stringify(me))

      if (typeof me.darkMode === 'boolean') {
        applyTheme(me.darkMode ? 'dark' : 'light')
      }
    } catch (error) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    applyTheme(localStorage.getItem('theme') || 'light')
    fetchProfile()
  }, [])

  const login = async (email, password) => {
    const res = await axiosClient.post('/auth/login', { email, password })

    const { token, user, mustChangePassword } = res.data

    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)

    if (typeof user.darkMode === 'boolean') {
      applyTheme(user.darkMode ? 'dark' : 'light')
    }

    return { user, mustChangePassword }
  }

  const register = async (payload) => {
    const res = await axiosClient.post('/auth/register', payload)
    return res.data
  }

  const toggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(nextTheme)

    if (user) {
      try {
        const res = await axiosClient.put('/auth/update-profile', {
          darkMode: nextTheme === 'dark',
        })

        const updatedUser = res.data.user
        setUser(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))
      } catch (error) {
        console.error(error)
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        register,
        logout,
        fetchProfile,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)