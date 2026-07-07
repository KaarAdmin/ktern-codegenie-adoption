'use client'

import React, { useState } from 'react'
import { AIAgentsInsights } from './AIAgentsInsights'
import { Grid3X3 } from 'lucide-react'

interface AIAgentsDashboardProps {
  className?: string
}

export function AIAgentsDashboard({ className = '' }: AIAgentsDashboardProps) {
  const [globalFilters, setGlobalFilters] = useState<Record<string, string | undefined>>({})

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Content Area - AG Grid */}
      <div className="space-y-8">
        <div className="min-h-[600px]">
          <AIAgentsInsights
            filters={globalFilters}
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
}
