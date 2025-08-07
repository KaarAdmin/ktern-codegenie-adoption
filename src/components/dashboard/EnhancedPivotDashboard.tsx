'use client'

import React, { useState } from 'react'
import { OrganizationPivotTable } from './OrganizationPivotTable'
import { ProjectPivotTable } from './ProjectPivotTable'
import { UserPivotTable } from './UserPivotTable'
import { OrganizationAgGridPivot } from './OrganizationAgGridPivot'
import { ProjectAgGridPivot } from './ProjectAgGridPivot'
import { UserAgGridPivot } from './UserAgGridPivot'
import { OrganizationCharts } from './charts/OrganizationCharts'
import { ProjectCharts } from './charts/ProjectCharts'
import { UserCharts } from './charts/UserCharts'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { BarChart3, Building2, FolderOpen, Users, Table, PieChart, Grid3X3 } from 'lucide-react'

interface EnhancedPivotDashboardProps {
  className?: string
}

export function EnhancedPivotDashboard({ className = '' }: EnhancedPivotDashboardProps) {
  const [activeTab, setActiveTab] = useState<'organization' | 'project' | 'user'>('organization')
  const [viewMode, setViewMode] = useState<'table' | 'chart' | 'aggrid'>('aggrid')
  const [globalFilters, setGlobalFilters] = useState<Record<string, string | undefined>>({})

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

  const viewModes = [
    // {
    //   id: 'table' as const,
    //   label: 'Pivot Table',
    //   icon: Table,
    //   description: 'Interactive pivot table view'
    // },
    {
      id: 'aggrid' as const,
      label: 'AG Grid Pivot',
      icon: Grid3X3,
      description: 'Advanced AG Grid pivot table with enterprise features'
    },
    {
      id: 'chart' as const,
      label: 'Chart View',
      icon: PieChart,
      description: 'Visual chart representation'
    }
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enhanced Analytics Dashboard</h1>
            <p className="text-gray-600">Interactive pivot tables with chart visualizations</p>
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

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex-1 mr-4">
          <p className="text-blue-800">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>
        
        <div className="flex bg-gray-100 rounded-lg p-1">
          {viewModes.map((mode) => {
            const Icon = mode.icon
            return (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === mode.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title={mode.description}
              >
                <Icon className="h-4 w-4 mr-2" />
                {mode.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[600px]">
        {viewMode === 'table' ? (
          // Syncfusion Pivot Table View
          <div>
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
        ) : viewMode === 'aggrid' ? (
          // AG Grid Pivot Table View
          <div>
            {activeTab === 'organization' && (
              <OrganizationAgGridPivot
                filters={globalFilters}
                className="w-full"
              />
            )}
            
            {activeTab === 'project' && (
              <ProjectAgGridPivot
                filters={globalFilters}
                className="w-full"
              />
            )}
            
            {activeTab === 'user' && (
              <UserAgGridPivot
                filters={globalFilters}
                className="w-full"
              />
            )}
          </div>
        ) : (
          // Chart View
          <div>
            {activeTab === 'organization' && (
              <OrganizationCharts filters={globalFilters} />
            )}
            
            {activeTab === 'project' && (
              <ProjectCharts filters={globalFilters} />
            )}
            
            {activeTab === 'user' && (
              <UserCharts filters={globalFilters} />
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>• Sorting: ENABLED for all value columns</span>
            <span>• Interactive filtering and drill-down capabilities</span>
            <span>• Export functionality available</span>
          </div>
          <div className="text-xs text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}
