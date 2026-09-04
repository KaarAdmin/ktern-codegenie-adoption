'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { AdoptionDashboard } from '@/components/dashboard/AdoptionDashboard'
import { LogOut } from 'lucide-react'

export default function AdoptionPage() {
  const { user, logout, loading: authLoading } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <img
                src="https://app.ktern.com/codegenie/frontend/_next/static/media/KTern.d14aee5e.png"
                alt="KTern Logo"
                className="h-8 w-auto"
              />
              <div className="hidden sm:block border-l border-gray-200 pl-4">
                <h1 className="text-lg font-semibold text-gray-900">Adoption Dashboard</h1>
                <p className="text-xs text-gray-500">Cross-project usage insights</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-1"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-2">
        <AdoptionDashboard />
      </main>
    </div>
  )
}