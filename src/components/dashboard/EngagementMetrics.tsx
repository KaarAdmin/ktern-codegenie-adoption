'use client'

import React from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { BuildSpace } from '@/types'

interface EngagementMetricsProps {
  data: BuildSpace[]
  loading?: boolean
}

export function EngagementMetrics({ data, loading = false }: EngagementMetricsProps) {
  const engagementData = React.useMemo(() => {
    if (!data.length) return []

    // Group by month and calculate engagement
    const monthlyData = data.reduce((acc, project) => {
      const date = new Date(project.createdOn)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthName,
          totalEngagement: 0,
          projectCount: 0,
          averageEngagement: 0
        }
      }
      
      acc[monthKey].totalEngagement += project.totalItemCount
      acc[monthKey].projectCount += 1
      acc[monthKey].averageEngagement = acc[monthKey].totalEngagement / acc[monthKey].projectCount
      
      return acc
    }, {} as Record<string, any>)

    return Object.values(monthlyData).sort((a: any, b: any) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    )
  }, [data])

  const scatterData = React.useMemo(() => {
    if (!data.length) return []

    // Remove duplicates by using project ID as the unique identifier
    const uniqueProjects = new Map()
    
    data.forEach(project => {
      if ((project.totalCost > 0 || project.totalItemCount > 0) && !uniqueProjects.has(project.id)) {
        uniqueProjects.set(project.id, {
          id: project.id,
          name: project.name.length > 25 ? project.name.substring(0, 25) + '...' : project.name,
          fullName: project.name,
          cost: project.totalCost,
          engagement: project.totalItemCount,
          status: project.status,
          owner: project.owner,
          createdBy: project.createdBy,
          costEfficiency: project.totalItemCount > 0 ? (project.totalCost / project.totalItemCount).toFixed(2) : '0.00'
        })
      }
    })

    return Array.from(uniqueProjects.values())
  }, [data])

  const topEngagedProjects = React.useMemo(() => {
    return data
      .filter(project => project.totalItemCount > 0)
      .sort((a, b) => b.totalItemCount - a.totalItemCount)
      .slice(0, 5)
  }, [data])

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Engagement Timeline */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Engagement Timeline
          </CardTitle>
          <p className="text-sm text-gray-600">
            Monthly average engagement across all projects
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={engagementData}>
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
                  formatter={(value: number, name: string) => [
                    value.toFixed(1),
                    name === 'averageEngagement' ? 'Avg Engagement' : 'Total Engagement'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="averageEngagement"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost vs Engagement Scatter Plot */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Cost vs Engagement
            </CardTitle>
            <p className="text-sm text-gray-600">
              Relationship between project cost and engagement levels
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={scatterData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    type="number"
                    dataKey="cost"
                    name="Cost ($)"
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => `$${value.toFixed(1)}`}
                    label={{ value: 'Cost ($)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    type="number"
                    dataKey="engagement"
                    name="Engagement"
                    stroke="#6b7280"
                    fontSize={12}
                    label={{ value: 'Engagement', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length > 0) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                            <div className="space-y-1">
                              <div className="font-semibold text-gray-900">{data.fullName}</div>
                              <div className="text-sm text-gray-700">Cost: ${data.cost.toFixed(2)}</div>
                              <div className="text-sm text-gray-700">Engagement: {data.engagement}</div>
                              <div className="text-sm text-gray-700">Cost per Engagement: ${data.costEfficiency}</div>
                              <div className="text-sm text-gray-700">Owner: {data.owner}</div>
                              <div className="text-sm text-gray-700">Created by: {data.createdBy}</div>
                              <div className="text-sm text-gray-700">Status: <span className="capitalize">{data.status}</span></div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Scatter 
                    dataKey="engagement" 
                    fill="#8b5cf6"
                    fillOpacity={0.7}
                    r={6}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            {scatterData.length === 0 && (
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
                    No projects with cost or engagement data found.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Engaged Projects */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Most Engaged Projects
            </CardTitle>
            <p className="text-sm text-gray-600">
              Projects with highest interaction counts
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topEngagedProjects.map((project, index) => (
                <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-600' :
                        'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {project.name.length > 50 ? project.name.substring(0, 50) + '...' : project.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        by {project.createdBy}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {project.totalItemCount}
                    </p>
                    <p className="text-xs text-gray-500">
                      interactions
                    </p>
                  </div>
                </div>
              ))}
              {topEngagedProjects.length === 0 && (
                <div className="text-center py-8 text-gray-500">
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No engagement data</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No projects with engagement found.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
