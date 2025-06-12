'use client'

import { LoginRequest, LoginResponse } from '@/types'

const LEGACY_APP_URL = process.env.NEXT_PUBLIC_LEGACY_APP_URL

export async function authenticateUser(credentials: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await fetch(`${LEGACY_APP_URL}/api/authenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      throw new Error('Authentication failed')
    }

    const data = await response.json()
    
    if (!data.status) {
      throw new Error('Invalid credentials')
    }

    // Store tokens in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('ktoken', data.token)
      localStorage.setItem('krefreshToken', data.refreshToken)
    }

    return data
  } catch (error) {
    throw error instanceof Error ? error : new Error('Network error occurred')
  }
}

export async function refreshAuthToken(): Promise<string> {
  try {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('krefreshToken') : null
    
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await fetch(`${LEGACY_APP_URL}/api/generateAccessToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      throw new Error('Token refresh failed')
    }

    const data = await response.json()
    
    // Update token in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('ktoken', data.token)
    }
    
    return data.token
  } catch (error) {
    // Clear tokens if refresh fails
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ktoken')
      localStorage.removeItem('krefreshToken')
    }
    throw error instanceof Error ? error : new Error('Token refresh failed')
  }
}

export function logoutUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ktoken')
    localStorage.removeItem('krefreshToken')
  }
}

export function isUserAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('ktoken')
}

export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('ktoken')
}
