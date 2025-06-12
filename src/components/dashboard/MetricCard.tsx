'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  loading?: boolean
}

export function MetricCard({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  loading = false 
}: MetricCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <div className="h-4 bg-gray-200 rounded skeleton w-24"></div>
          </CardTitle>
          <div className="h-4 w-4 bg-gray-200 rounded skeleton"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-gray-200 rounded skeleton w-16 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded skeleton w-32"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {description && (
          <p className="text-xs text-gray-600 mb-2">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center text-xs">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                trend.isPositive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              <svg
                className={`w-3 h-3 mr-1 ${
                  trend.isPositive ? 'rotate-0' : 'rotate-180'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {Math.abs(trend.value).toFixed(1)}%
            </span>
            <span className="ml-2 text-gray-500">
              vs last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
