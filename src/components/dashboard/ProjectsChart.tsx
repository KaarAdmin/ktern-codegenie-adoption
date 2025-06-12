'use client'

import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { BuildSpace } from '@/types'

interface ProjectsChartProps {
  data: BuildSpace[]
  loading?: boolean
}

export function ProjectsChart({ data, loading = false }: ProjectsChartProps) {
  const chartData = React.useMemo(() => {
    if (!data.length) return []

    // Group projects by month
    const monthlyData = data.reduce((acc, project) => {
      const date = new Date(project.createdOn)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthName,
          projects: 0,
          cost: 0,
          engagement: 0
        }
      }
      
      acc[monthKey].projects += 1
      acc[monthKey].cost += project.totalCost
      acc[monthKey].engagement += project.totalItemCount
      
      return acc
    }, {} as Record<string, any>)

    return Object.values(monthlyData).sort((a: any, b: any) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    )
  }, [data])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="h-6 bg-gray-200 rounded skeleton w-48"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-100 rounded skeleton"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Project Creation Timeline
        </CardTitle>
        <p className="text-sm text-gray-600">
          Monthly breakdown of new projects created
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ color: '#374151', fontWeight: 'bold' }}
              />
              <Line
                type="monotone"
                dataKey="projects"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                name="Projects Created"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {chartData.length === 0 && (
          <div className="flex items-center justify-center h-80 text-gray-500">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
              <p className="mt-1 text-sm text-gray-500">
                No projects found for the selected filters.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
