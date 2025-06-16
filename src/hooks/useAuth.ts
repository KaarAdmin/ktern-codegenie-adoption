'use client'

import { useState, useEffect } from 'react'
import { User, LoginRequest } from '@/types'
import { login as apiLogin, logout as apiLogout, isAuthenticated, getStoredToken, getStoredRefreshToken } from '@/lib/api'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is already authenticated on mount
    const checkExistingAuth = () => {
      if (typeof window !== 'undefined') {
        if (isAuthenticated()) {
          const token = getStoredToken()
          const refreshToken = getStoredRefreshToken()
          
          if (token && refreshToken) {
            setUser({
              email: '', // We don't store email in localStorage for security
              token,
              refreshToken,
            })
          }
        }
      }
      setLoading(false)
    }

    checkExistingAuth()
  }, [])

  const login = async (credentials: LoginRequest) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiLogin(credentials)
      
      const userData: User = {
        email: credentials.email,
        token: response.token,
        refreshToken: response.refreshToken,
      }
      
      setUser(userData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    apiLogout()
    setUser(null)
    setError(null)
  }

  // Function to update user when tokens are refreshed
  const updateTokens = (newToken: string) => {
    if (user) {
      setUser({
        ...user,
        token: newToken,
      })
    }
  }

  return {
    user,
    login,
    logout,
    loading,
    error,
    updateTokens,
  }
}