// JWT token utilities for authorization
export interface DecodedToken {
  _id: string
  fullName: string
  email: string
  orgID: string
  subscription: any
  iat: number
  exp: number
}

export function decodeJWT(token: string): DecodedToken | null {
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // Decode the payload (second part)
    const payload = parts[1]
    
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4)
    
    // Decode base64
    const decodedPayload = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'))
    
    // Parse JSON
    const tokenData = JSON.parse(decodedPayload) as DecodedToken
    
    return tokenData
  } catch (error) {
    console.error('Error decoding JWT token:', error)
    return null
  }
}

export function getTokenFromStorage(): string | null {
  try {
    return localStorage.getItem('ktoken')
  } catch (error) {
    console.error('Error accessing localStorage:', error)
    return null
  }
}

export function isAuthorizedUser(): boolean {
  const token = getTokenFromStorage()
  if (!token) {
    return false
  }

  const decodedToken = decodeJWT(token)
  if (!decodedToken) {
    return false
  }

  // Check if the email matches the authorized email
  return decodedToken.email === "customersuccess@ktern.com"
}

export function getCurrentUserEmail(): string | null {
  const token = getTokenFromStorage()
  if (!token) {
    return null
  }

  const decodedToken = decodeJWT(token)
  return decodedToken?.email || null
}