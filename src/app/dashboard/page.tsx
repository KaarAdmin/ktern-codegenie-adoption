'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { EnhancedPivotDashboard } from '@/components/dashboard/EnhancedPivotDashboard'
import { AIAgentsDashboard } from '@/components/ai-agents-analytics/AIAgentsDashboard'
import { DashboardNavigator, DashboardView } from '@/components/dashboard/DashboardNavigator'
import { LogOut } from 'lucide-react'

export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth()
  const router = useRouter()
  const [activeView, setActiveView] = useState<DashboardView>('ai-agents-analytics')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

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

  const viewTitle =
    activeView === 'ai-agents-analytics' ? 'AI Agents Analytics' : 'CodeGenie Dashboard'

  return (
    <div className="dashboard-shell">
      {/* Collapsible Left Navigator */}
      <DashboardNavigator
        activeView={activeView}
        onViewChange={setActiveView}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Right Content Pane */}
      <div className="dashboard-content-pane">
        {/* Top Header */}
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <h1 className="topbar-title">{viewTitle}</h1>
          </div>
          <div className="topbar-right">
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
        </header>

        {/* Main Content — render both, hide inactive to preserve data */}
        <main className="dashboard-main">
          <div style={{ display: activeView === 'ai-agents-analytics' ? 'block' : 'none' }}>
            <AIAgentsDashboard />
          </div>
          <div style={{ display: activeView === 'codegenie-dashboard' ? 'block' : 'none' }}>
            <EnhancedPivotDashboard />
          </div>
        </main>
      </div>
    </div>
  )
}
