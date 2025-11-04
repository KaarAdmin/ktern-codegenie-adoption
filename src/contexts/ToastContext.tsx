'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Toast, ToastType, ToastContainer } from '@/components/ui/Toast'

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  clearAllToasts: () => void
  // Convenience methods
  showSuccess: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => string
  showError: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => string
  showWarning: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => string
  showInfo: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => string
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

interface ToastProviderProps {
  children: ReactNode
  maxToasts?: number
  defaultDuration?: number
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  maxToasts = 5,
  defaultDuration = 5000 
}) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = generateId()
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? defaultDuration
    }

    setToasts(prevToasts => {
      const updatedToasts = [...prevToasts, newToast]
      // Remove oldest toasts if we exceed maxToasts
      if (updatedToasts.length > maxToasts) {
        return updatedToasts.slice(-maxToasts)
      }
      return updatedToasts
    })

    return id
  }, [generateId, defaultDuration, maxToasts])

  const removeToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  const showSuccess = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => {
    return addToast({
      type: 'success',
      message,
      ...options
    })
  }, [addToast])

  const showError = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => {
    return addToast({
      type: 'error',
      message,
      duration: options?.duration ?? 8000, // Longer duration for errors
      ...options
    })
  }, [addToast])

  const showWarning = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => {
    return addToast({
      type: 'warning',
      message,
      duration: options?.duration ?? 6000, // Slightly longer for warnings
      ...options
    })
  }, [addToast])

  const showInfo = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => {
    return addToast({
      type: 'info',
      message,
      ...options
    })
  }, [addToast])

  const contextValue: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Export individual hook functions for convenience
export const useToastActions = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast()
  return { showSuccess, showError, showWarning, showInfo }
}