'use client'

import React, { useState } from 'react'
import { OrganizationAgGridPivot } from './OrganizationAgGridPivot'
import { ProjectAgGridPivot } from './ProjectAgGridPivot'
import { UserAgGridPivot } from './UserAgGridPivot'
import { UserExtendedInsights } from './UserExtendedInsights'
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
  const [activeTab, setActiveTab] = useState<'organization' | 'project' | 'user' | 'userExtended'>('userExtended')
  const [globalFilters, setGlobalFilters] = useState<Record<string, string | undefined>>({})

  const tabs = [
    {
      id: 'userExtended' as const,
      label: 'Executive Overview',
      icon: Grid3X3,
      description: 'Extended user insights with detailed analytics'
    },
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


  return (
    <div className={`space-y-6 ${className}`}>

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

      {/* Description */}
      {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">
          {tabs.find(tab => tab.id === activeTab)?.description}
        </p>
      </div> */}

      {/* Content Area - Chart View First, then AG Grid */}
      <div className="space-y-8">
        {/* Chart View Section */}
        <div className="">
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

        {/* AG Grid Section */}
        <div className="min-h-[600px]">
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
          
          {activeTab === 'userExtended' && (
            <UserExtendedInsights
              filters={globalFilters}
              className="w-full"
            />
          )}
        </div>
      </div>
    </div>
  )
}
