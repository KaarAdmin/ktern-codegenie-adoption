'use client'

import React from 'react'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { UserExpense, DashboardMetrics } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface CodeGenieVSCodeMetricsProps {
  userExpenseData: UserExpense[]
  standardEditionMetrics?: DashboardMetrics | null
  loading?: boolean
}

export function CodeGenieVSCodeMetrics({ userExpenseData, standardEditionMetrics, loading = false }: CodeGenieVSCodeMetricsProps) {
  const metrics = React.useMemo(() => {
    if (!userExpenseData.length) {
      return {
        totalCost: 0,
        totalEngagement: 0,
        combinedCost: standardEditionMetrics?.totalCost || 0
      }
    }

    const vscodeEditionCost = userExpenseData.reduce((sum, user) => sum + user.totalCost, 0)
    const totalEngagement = userExpenseData.reduce((sum, user) => sum + user.totalItemCount, 0)
    const standardEditionCost = standardEditionMetrics?.totalCost || 0
    
    return {
      totalCost: vscodeEditionCost,
      totalEngagement,
      combinedCost: standardEditionCost + vscodeEditionCost
    }
  }, [userExpenseData, standardEditionMetrics])

  return (
    <div className="space-y-6">
      {/* Title Section */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          CodeGenie VSCode Edition Analytics
        </h2>
        <p className="text-gray-600 text-sm">
          Comprehensive cost and engagement metrics for CodeGenie VSCode Edition usage
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Cost of CodeGenie VSCode Edition"
          value={formatCurrency(metrics.totalCost)}
          description="Total cost across all users"
          loading={loading}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
        />
        
        <MetricCard
          title="Total Engagement of CodeGenie VSCode Edition"
          value={metrics.totalEngagement}
          description="Total interactions across all users"
          loading={loading}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        
        <MetricCard
          title="Combined Cost (Standard + VSCode Edition)"
          value={formatCurrency(metrics.combinedCost)}
          description="Total cost across both CodeGenie editions"
          loading={loading}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>

      {/* Note Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-1">
              Important Note
            </h3>
            <p className="text-sm text-blue-800">
              The total cost shown above represents the complete cost for CodeGenie VSCode Edition 
              across all users and projects <strong>without any filters applied</strong>. This provides 
              a comprehensive view of the overall investment and usage patterns.
            </p>
          </div>
        </div>
      </div>

      {/* Additional Statistics */}
      {userExpenseData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Active Users</div>
            <div className="text-2xl font-bold text-gray-900">{userExpenseData.length}</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Avg Cost per User</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(metrics.totalCost / userExpenseData.length)}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Avg Engagement per User</div>
            <div className="text-2xl font-bold text-gray-900">
              {(metrics.totalEngagement / userExpenseData.length).toFixed(1)}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Cost per Engagement</div>
            <div className="text-2xl font-bold text-gray-900">
              {metrics.totalEngagement > 0 
                ? formatCurrency(metrics.totalCost / metrics.totalEngagement)
                : '$0.00'
              }
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
