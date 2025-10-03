import { LoginRequest, LoginResponse, RefreshTokenRequest, OrganizationLevelInsightsResponse, ProjectLevelInsightsResponse, UserLevelInsightsResponse, UserLevelExtendedInsightsResponse } from '@/types'

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
    
    // Check if the response contains a valid token
    if (!data.token) {
      throw new ApiError(401, 'Invalid token refresh response')
    }
    
    // Update token in localStorage
    localStorage.setItem('ktoken', data.token)
    
    return data.token
  } catch (error) {
    // Clear tokens if refresh fails
    localStorage.removeItem('ktoken')
    localStorage.removeItem('krefreshToken')
    
    // Reload window to redirect to login on refresh failure
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.reload()
      }, 100) // Small delay to ensure cleanup completes
    }
    
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
  const makeRequest = async (useRefreshedToken = false): Promise<Response> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ktoken') : null
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    }

    return await fetch(url, config)
  }

  try {
    let response = await makeRequest()
    // Clone the response to read the body without consuming the original stream
    const responseClone = response.clone()
    let responseData
    
    try {
      responseData = await responseClone.json()
    } catch (jsonError) {
      // If response is not JSON, proceed with original response
      if (!response.ok) {
        throw new ApiError(response.status, `API request failed: ${response.statusText}`)
      }
      return await response.json()
    }    
    // Check for token expiration error
    if ((responseData.detail || responseData.message) && (String(responseData.detail).includes("Token has expired") || String(responseData.detail).includes("invalid payload - Signature has expired") || String(responseData.message).includes("Token has expired"))) {
      try {
        const newToken = await refreshToken()
        
        // Make the request again with the new token
        response = await makeRequest(true)
        
        // If still unauthorized after refresh, clear tokens and reload window
        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('ktoken')
            localStorage.removeItem('krefreshToken')
            // Reload the window to redirect to login
            window.location.reload()
          }
          throw new ApiError(401, 'Authentication required - please login again')
        }
      } catch (refreshError) {
        // Clear tokens and reload window on refresh failure
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ktoken')
          localStorage.removeItem('krefreshToken')
          // Reload the window to redirect to login
          window.location.reload()
        }
        
        if (refreshError instanceof ApiError) {
          throw refreshError
        }
        throw new ApiError(401, 'Authentication required - please login again')
      }
    }

    // Return the new response data
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

export async function getOrganizationLevelInsightsResponse(filters: Record<string, string | undefined | boolean> = {}): Promise<OrganizationLevelInsightsResponse> {
  const queryParams = new URLSearchParams()
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      // Convert boolean to string
      queryParams.append(key, typeof value === 'boolean' ? String(value) : value)
    }
  })
  // console.log('Query Params:', queryParams.toString())
  const url = `${API_BASE_URL}/codegenie/api/general/organizationLevelInsights${queryParams.toString()? `?${queryParams.toString()}` : ''}`

  return apiRequest<OrganizationLevelInsightsResponse>(url)
}

export async function getprojectLevelInsights(filters: Record<string, string | undefined | boolean> = {}): Promise<ProjectLevelInsightsResponse> {
  const queryParams = new URLSearchParams()
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      // Convert boolean to string
      queryParams.append(key, typeof value === 'boolean' ? String(value) : value)
    }
  })
  // console.log('Query Params:', queryParams.toString())
  const url = `${API_BASE_URL}/codegenie/api/general/projectLevelInsights${queryParams.toString()? `?${queryParams.toString()}` : ''}`

  return apiRequest<ProjectLevelInsightsResponse>(url)
}

export async function getUserLevelInsightsResponse(filters: Record<string, string | undefined | boolean> = {}): Promise<UserLevelInsightsResponse> {
  const queryParams = new URLSearchParams()
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      // Convert boolean to string
      queryParams.append(key, typeof value === 'boolean' ? String(value) : value)
    }
  })
  // console.log('Query Params:', queryParams.toString())
  const url = `${API_BASE_URL}/codegenie/api/general/userLevelInsights${queryParams.toString()? `?${queryParams.toString()}` : ''}`

  return apiRequest<UserLevelInsightsResponse>(url)
}

export async function getUserLevelExtendedInsightsResponse(filters: Record<string, string | undefined | boolean> = {}): Promise<UserLevelExtendedInsightsResponse> {
  const queryParams = new URLSearchParams()
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      // Convert boolean to string
      queryParams.append(key, typeof value === 'boolean' ? String(value) : value)
    }
  })
  // console.log('Query Params:', queryParams.toString())
  const url = `${API_BASE_URL}/codegenie/api/general/userLevelExtendedInsights${queryParams.toString()? `?${queryParams.toString()}` : ''}`

  return apiRequest<UserLevelExtendedInsightsResponse>(url)
}

// Update functions for pivot table data
export async function updateOrganizationData(data: any[]): Promise<{ status_code: Number; detail: string }> {
  const url = `${API_BASE_URL}/codegenie/api/general/organizationLevelInsights`
  
  return apiRequest<{ status_code: Number; detail: string }>(url, {
    method: 'PUT',
    body: JSON.stringify({ organizations: data }),
  })
}

export async function updateProjectData(data: any[]): Promise<{ status_code: Number; detail: string }> {
  const url = `${API_BASE_URL}/codegenie/api/general/projectLevelInsights`
  
  return apiRequest<{ status_code: Number; detail: string }>(url, {
    method: 'PUT',
    body: JSON.stringify({ projects: data }),
  })
}

export async function updateUserData(data: any[]): Promise<{ status_code: Number; detail: string }> {
  const url = `${API_BASE_URL}/codegenie/api/general/userLevelInsights`
  
  return apiRequest<{ status_code: Number; detail: string }>(url, {
    method: 'PUT',
    body: JSON.stringify({ users: data }),
  })
}

// Update functions for pivot table data
export async function updateUserExtendedData(data: any[]): Promise<{ status_code: Number; detail: string }> {
  const url = `${API_BASE_URL}/codegenie/api/general/userLevelExtendedInsights`
  
  return apiRequest<{ status_code: Number; detail: string }>(url, {
    method: 'PUT',
    body: JSON.stringify({ users: data }),
  })
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

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem('krefreshToken')
}
