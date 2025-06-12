import { LoginRequest, LoginResponse, RefreshTokenRequest, BuildSpaceInsightsResponse, FilterOptions } from '@/types'

const LEGACY_APP_URL = process.env.NEXT_PUBLIC_LEGACY_APP_URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await fetch(`${LEGACY_APP_URL}/api/authenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      throw new ApiError(response.status, 'Authentication failed')
    }

    const data = await response.json()
    
    if (!data.status) {
      throw new ApiError(401, 'Invalid credentials')
    }

    // Store tokens in localStorage
    localStorage.setItem('ktoken', data.token)
    localStorage.setItem('krefreshToken', data.refreshToken)

    return data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(500, 'Network error occurred')
  }
}

export async function refreshToken(): Promise<string> {
  try {
    const refreshToken = localStorage.getItem('krefreshToken')
    
    if (!refreshToken) {
      throw new ApiError(401, 'No refresh token available')
    }

    const response = await fetch(`${LEGACY_APP_URL}/api/generateAccessToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      throw new ApiError(response.status, 'Token refresh failed')
    }

    const data = await response.json()
    
    // Update token in localStorage
    localStorage.setItem('ktoken', data.token)
    
    return data.token
  } catch (error) {
    // Clear tokens if refresh fails
    localStorage.removeItem('ktoken')
    localStorage.removeItem('krefreshToken')
    
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(500, 'Token refresh failed')
  }
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ktoken') : null
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  }

  try {
    let response = await fetch(url, config)

    // If token expired, try to refresh and retry
    if (response.status === 401) {
      try {
        const newToken = await refreshToken()
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${newToken}`,
        }
        response = await fetch(url, config)
      } catch (refreshError) {
        // Clear tokens and throw authentication error
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ktoken')
          localStorage.removeItem('krefreshToken')
        }
        throw new ApiError(401, 'Authentication required')
      }
    }

    if (!response.ok) {
      throw new ApiError(response.status, `API request failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(500, 'Network error occurred')
  }
}

export async function getBuildSpaceInsights(filters: FilterOptions = {}): Promise<BuildSpaceInsightsResponse> {
  const queryParams = new URLSearchParams()
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      queryParams.append(key, value)
    }
  })

  const url = `${API_BASE_URL}/codegenie/api/general/buildSpaceInsgihts?${queryParams.toString()}`
  
  return apiRequest<BuildSpaceInsightsResponse>(url)
}

export function logout(): void {
  localStorage.removeItem('ktoken')
  localStorage.removeItem('krefreshToken')
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('ktoken')
}

export function getStoredToken(): string | null {
  return localStorage.getItem('ktoken')
}
