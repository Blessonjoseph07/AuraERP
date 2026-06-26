import React, { createContext, useState, useEffect, useContext } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if token exists on app launch
    const checkAuth = async () => {
      const token = localStorage.getItem('smarterp_token')
      const storedUser = localStorage.getItem('smarterp_user')
      
      if (token && storedUser) {
        try {
          // Fetch fresh user profile to verify token validity
          const res = await api.get('/api/auth/me')
          setUser(res.data)
        } catch (err) {
          console.error("Token verification failed, logging out...", err)
          logout()
        }
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  const login = async (username, password) => {
    // Request standard OAuth2 form login
    const params = new URLSearchParams()
    params.append('username', username)
    params.append('password', password)

    const res = await api.post('/api/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    const { access_token, role, username: returnedUsername } = res.data
    localStorage.setItem('smarterp_token', access_token)
    
    // Fetch profile to populate full user details (email, etc.)
    const profileRes = await api.get('/api/auth/me')
    const fullUser = profileRes.data

    localStorage.setItem('smarterp_user', JSON.stringify(fullUser))
    setUser(fullUser)
    return fullUser
  }

  const logout = () => {
    localStorage.removeItem('smarterp_token')
    localStorage.removeItem('smarterp_user')
    setUser(null)
  }

  const register = async (username, email, password, role = 'Employee') => {
    const res = await api.post('/api/auth/register', {
      username,
      email,
      password,
      role
    })
    return res.data
  }

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    isAdmin: user?.role === 'Admin',
    isManager: user?.role === 'Admin' || user?.role === 'Manager',
    isEmployee: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
export default AuthContext
