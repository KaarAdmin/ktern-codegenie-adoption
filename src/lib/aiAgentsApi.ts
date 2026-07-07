// AI Agents Analytics API layer — separated from CodeGenie api.ts
// Initially fetches from the same endpoints; will be swapped to MongoDB later.

import { AIAgentExtendedInsightsResponse } from '@/types/aiAgents'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function aiAgentsApiRequest<T>(
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

  const refreshTokenLocal = async (): Promise<string> => {
    const refreshToken = localStorage.getItem('krefreshToken')
    if (!refreshToken) throw new ApiError(401, 'No refresh token available')

    const LEGACY_APP_URL = process.env.NEXT_PUBLIC_LEGACY_APP_URL
    const response = await fetch(`${LEGACY_APP_URL}/api/generateAccessToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) throw new ApiError(response.status, 'Token refresh failed')
    
    const data = await response.json()
    if (!data.token) throw new ApiError(401, 'Invalid token refresh response')
    
    localStorage.setItem('ktoken', data.token)
    return data.token
  }

  try {
    let response = await makeRequest()
    const responseClone = response.clone()
    let responseData
    
    try {
      responseData = await responseClone.json()
    } catch (jsonError) {
      if (!response.ok) {
        throw new ApiError(response.status, `API request failed: ${response.statusText}`)
      }
      return await response.json()
    }    

    if ((responseData.detail || responseData.message) && (String(responseData.detail).includes("Token has expired") || String(responseData.detail).includes("invalid payload - Signature has expired") || String(responseData.message).includes("Token has expired"))) {
      try {
        await refreshTokenLocal()
        response = await makeRequest(true)
        
        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('ktoken')
            localStorage.removeItem('krefreshToken')
            window.location.reload()
          }
          throw new ApiError(401, 'Authentication required - please login again')
        }
      } catch (refreshError) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ktoken')
          localStorage.removeItem('krefreshToken')
          window.location.reload()
        }
        if (refreshError instanceof ApiError) throw refreshError
        throw new ApiError(401, 'Authentication required - please login again')
      }
    }

    if (!response.ok) {
      throw new ApiError(response.status, `API request failed: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(500, 'Network error occurred')
  }
}

// ──────────────────────────────────────────────────
// Data fetch — will be replaced with MongoDB queries
// ──────────────────────────────────────────────────

export async function getAIAgentExtendedInsights(
  filters: Record<string, string | undefined | boolean> = {}
): Promise<AIAgentExtendedInsightsResponse> {
  const queryParams = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, typeof value === 'boolean' ? String(value) : value)
    }
  })

  // Call the new internal Next.js API route connected to MongoDB
  const url = `/api/ai-agents${
    queryParams.toString() ? `?${queryParams.toString()}` : ''
  }`

  return aiAgentsApiRequest<AIAgentExtendedInsightsResponse>(url)
}

// ──────────────────────────────────────────────────
// Data update — will be replaced with MongoDB writes
// ──────────────────────────────────────────────────

export async function updateAIAgentExtendedData(
  data: any[]
): Promise<{ status_code: Number; detail: string }> {
  const url = `${API_BASE_URL}/codegenie/api/general/userLevelExtendedInsights`

  return aiAgentsApiRequest<{ status_code: Number; detail: string }>(url, {
    method: 'PUT',
    body: JSON.stringify({ users: data }),
  })
}
