import { LoginRequest, LoginResponse, RefreshTokenRequest, AdoptionSummaryResponse, AdoptionInsightsRequest, AdoptionInsightsResponse, AdoptionTableTooLargeDetail, TokenAllocationResponse, UpdateTokenAllocationRequest, UpdateTokenAllocationResponse } from '@/types'

const LEGACY_APP_URL = process.env.NEXT_PUBLIC_LEGACY_APP_URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Raised when `/insights` returns `400` with a `TABLE_TOO_LARGE` detail.
 * Carries the offending `rowCount` so the UI can prompt the user to narrow the
 * selection or pick a coarser granularity.
 */
export class TableTooLargeError extends ApiError {
  constructor(public rowCount: number, message: string) {
    super(400, message)
    this.name = 'TableTooLargeError'
  }
}

/**
 * Raised when the backend rejects a token-allocation request because the user
 * lacks the restricted access required to view or edit it. Callers should
 * redirect the user to `/dashboard`.
 */
export class TokenAllocationForbiddenError extends ApiError {
  constructor(message: string) {
    super(403, message)
    this.name = 'TokenAllocationForbiddenError'
  }
}

/** Backend message returned when the user may not view/edit token allocation. */
const TOKEN_ALLOCATION_FORBIDDEN_DETAIL =
  'You are not authorized to edit adoption dashboard token allocation'

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

    // Authorization failure for token allocation — surface a dedicated error so
    // callers can redirect the user to /dashboard.
    if (
      responseData?.detail &&
      String(responseData.detail).includes(TOKEN_ALLOCATION_FORBIDDEN_DETAIL)
    ) {
      throw new TokenAllocationForbiddenError(String(responseData.detail))
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

// ===== Adoption Dashboard =====

export async function getAdoptionSummary(): Promise<AdoptionSummaryResponse> {
  const url = `${API_BASE_URL}/codegenie/api/adoptionDashboard/summary`
  return apiRequest<AdoptionSummaryResponse>(url)
}

/**
 * Fetches the adoption dashboard insights: summary cards plus the full, capped,
 * granularity-grouped table in one request. There is no pagination — the entire
 * dataset is loaded into the client-side grid, which also feeds the chart.
 *
 * Throws {@link TableTooLargeError} when the backend rejects the request with a
 * `400 TABLE_TOO_LARGE` payload, so callers can surface the row count.
 */
export async function getAdoptionInsights(body: AdoptionInsightsRequest = {}): Promise<AdoptionInsightsResponse> {
  const url = `${API_BASE_URL}/codegenie/api/adoptionDashboard/insights`
  const token = typeof window !== 'undefined' ? localStorage.getItem('ktoken') : null

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(body),
  })

  let data: unknown
  try {
    data = await response.json()
  } catch {
    if (!response.ok) {
      throw new ApiError(response.status, `API request failed: ${response.statusText}`)
    }
    throw new ApiError(500, 'Invalid insights response')
  }

  if (response.status === 400) {
    const detail = (data as { detail?: AdoptionTableTooLargeDetail })?.detail
    if (detail && typeof detail === 'object' && detail.code === 'TABLE_TOO_LARGE') {
      throw new TableTooLargeError(detail.rowCount, detail.message)
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, `API request failed: ${response.statusText}`)
  }

  return data as AdoptionInsightsResponse
}

/**
 * Fetches the list of projects with their CodeGenie token allocation state.
 */
export async function getTokenAllocation(): Promise<TokenAllocationResponse> {
  const url = `${API_BASE_URL}/codegenie/api/adoptionDashboard/token-allocation`
  return apiRequest<TokenAllocationResponse>(url)
}

/**
 * Updates the CodeGenie token allocation for a single project.
 *
 * Both fields are optional, but at least one must be provided. `isCodeGenie`
 * is a one-way enable — the UI never sends `false`.
 */
export async function updateTokenAllocation(
  projectId: string,
  body: UpdateTokenAllocationRequest
): Promise<UpdateTokenAllocationResponse> {
  const url = `${API_BASE_URL}/codegenie/api/adoptionDashboard/token-allocation/${projectId}`
  return apiRequest<UpdateTokenAllocationResponse>(url, {
    method: 'PATCH',
    body: JSON.stringify(body),
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
