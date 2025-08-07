'use client'

import React, { useState } from 'react'
import { OrganizationPivotTable } from './OrganizationPivotTable'
import { ProjectPivotTable } from './ProjectPivotTable'
import { UserPivotTable } from './UserPivotTable'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { BarChart3, Building2, FolderOpen, Users, Filter, Download, RefreshCw } from 'lucide-react'

interface PivotDashboardProps {
  className?: string
}

export function PivotDashboard({ className = '' }: PivotDashboardProps) {
  const [activeTab, setActiveTab] = useState<'organization' | 'project' | 'user'>('organization')
  const [globalFilters, setGlobalFilters] = useState<Record<string, string | undefined>>({})
  const [showFilters, setShowFilters] = useState(false)

  const tabs = [
    {
      id: 'organization' as const,
      label: 'Organizations',
      icon: Building2,
      description: 'Organization-level insights and analytics'
    },
    {
      id: 'project' as const,
      label: 'Projects',
      icon: FolderOpen,
      description: 'Project-level insights and analytics'
    },
    {
      id: 'user' as const,
      label: 'Users',
      icon: Users,
      description: 'User-level insights and analytics'
    }
  ]

  const handleFilterChange = (key: string, value: string) => {
    setGlobalFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }))
  }

  const clearFilters = () => {
    setGlobalFilters({})
  }

  const exportData = () => {
    // This would trigger export functionality in the active pivot table
    console.log('Export data for:', activeTab)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Real-time insights with auto-refresh capabilities</p>
          </div>
        </div>
        
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon
                  className={`-ml-0.5 mr-2 h-5 w-5 ${
                    activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">
          {tabs.find(tab => tab.id === activeTab)?.description}
        </p>
      </div>


      {/* Pivot Table Content */}
      <div className="min-h-[600px]">
        {activeTab === 'organization' && (
          <OrganizationPivotTable 
            filters={globalFilters}
            className="w-full"
          />
        )}
        
        {activeTab === 'project' && (
          <ProjectPivotTable 
            filters={globalFilters}
            className="w-full"
          />
        )}
        
        {activeTab === 'user' && (
          <UserPivotTable 
            filters={globalFilters}
            className="w-full"
          />
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>• Auto-refresh: DISABLED by default (manual control available)</span>
            <span>• Batch loading: PAUSED by default (500 records every 15 seconds when enabled)</span>
            <span>• Performance optimized for large datasets</span>
          </div>
          <div className="text-xs text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}