'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { BuildSpace } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface CostAnalyticsProps {
  data: BuildSpace[]
  loading?: boolean
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export function CostAnalytics({ data, loading = false }: CostAnalyticsProps) {
  const costData = React.useMemo(() => {
    if (!data.length) return []

    // Group by project and calculate costs with more insights
    return data
      .filter(project => project.totalCost > 0)
      .map(project => ({
        name: project.name.length > 20 ? project.name.substring(0, 20) + '...' : project.name,
        fullName: project.name,
        cost: project.totalCost,
        engagement: project.totalItemCount,
        costPerEngagement: project.totalItemCount > 0 ? project.totalCost / project.totalItemCount : project.totalCost,
        owner: project.owner,
        status: project.status,
        createdBy: project.createdBy,
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10) // Top 10 projects by cost for better visibility
  }, [data])

  const costInsights = React.useMemo(() => {
    if (!data.length) return null

    const projectsWithCost = data.filter(p => p.totalCost > 0)
    const totalCost = projectsWithCost.reduce((sum, p) => sum + p.totalCost, 0)
    const avgCost = totalCost / projectsWithCost.length
    const highestCost = Math.max(...projectsWithCost.map(p => p.totalCost))
    const mostExpensiveProject = projectsWithCost.find(p => p.totalCost === highestCost)

    return {
      totalProjects: projectsWithCost.length,
      totalCost,
      avgCost,
      highestCost,
      mostExpensiveProject: mostExpensiveProject?.name || 'N/A'
    }
  }, [data])

  const pieData = React.useMemo(() => {
    if (!data.length) return []

    const statusGroups = data.reduce((acc, project) => {
      const status = project.status || 'Inactive'
      if (!acc[status]) {
        acc[status] = { status, cost: 0, count: 0 }
      }
      acc[status].cost += project.totalCost
      acc[status].count += 1
      return acc
    }, {} as Record<string, any>)

    return Object.values(statusGroups)
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
      {/* Cost Insights Summary */}
      {costInsights && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">Projects with Cost</p>
                  <p className="text-lg font-semibold text-blue-700">{costInsights.totalProjects}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-500 rounded-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900">Average Cost</p>
                  <p className="text-lg font-semibold text-green-700">{formatCurrency(costInsights.avgCost)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-orange-900">Highest Cost</p>
                  <p className="text-lg font-semibold text-orange-700">{formatCurrency(costInsights.highestCost)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-900">Top Project</p>
                  <p className="text-xs font-semibold text-purple-700 truncate" title={costInsights.mostExpensiveProject}>
                    {costInsights.mostExpensiveProject.length > 30 ? 
                      costInsights.mostExpensiveProject.substring(0, 30) + '...' : 
                      costInsights.mostExpensiveProject
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Project Bar Chart */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Top Projects by Cost
            </CardTitle>
            <p className="text-sm text-gray-600">
              Highest cost-incurring projects with detailed insights
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6b7280"
                    fontSize={10}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => `$${value.toFixed(2)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: number, name: string, props: any) => {
                      const data = props.payload
                      return [
                        <div key="tooltip" className="space-y-1">
                          <div className="font-semibold">{data.fullName}</div>
                          <div>Cost: {formatCurrency(data.cost)}</div>
                          <div>Engagement: {data.engagement}</div>
                          <div>Cost/Engagement: {formatCurrency(data.costPerEngagement)}</div>
                          <div>Owner: {data.owner}</div>
                          <div>Created by: {data.createdBy}</div>
                          <div>Status: <span className="capitalize">{data.status}</span></div>
                        </div>
                      ]
                    }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Bar 
                    dataKey="cost" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {costData.length === 0 && (
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
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No cost data</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No projects with cost data found.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Distribution by Status Pie Chart */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Cost Distribution by Status
            </CardTitle>
            <p className="text-sm text-gray-600">
              Total cost breakdown by project status
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="cost"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        className="hover:opacity-80 transition-all duration-300 cursor-pointer"
                        style={{
                          filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
                          transformOrigin: 'center'
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length > 0) {
                        const data = payload[0].payload
                        const totalCost = pieData.reduce((sum, item) => sum + item.cost, 0)
                        const percentage = ((data.cost / totalCost) * 100).toFixed(1)
                        return (
                          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xl transform transition-all duration-300 scale-105">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-4 h-4 rounded-full" 
                                  style={{ backgroundColor: payload[0].color }}
                                ></div>
                                <div className="font-bold text-gray-900 text-lg capitalize">{data.status}</div>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-blue-50 p-2 rounded-lg">
                                  <div className="text-blue-600 font-medium">Total Cost</div>
                                  <div className="text-blue-900 font-bold text-xl">{formatCurrency(data.cost)}</div>
                                </div>
                                <div className="bg-green-50 p-2 rounded-lg">
                                  <div className="text-green-600 font-medium">Share</div>
                                  <div className="text-green-900 font-bold text-xl">{percentage}%</div>
                                </div>
                                <div className="bg-orange-50 p-2 rounded-lg">
                                  <div className="text-orange-600 font-medium">Projects</div>
                                  <div className="text-orange-900 font-bold text-xl">{data.count}</div>
                                </div>
                                <div className="bg-purple-50 p-2 rounded-lg">
                                  <div className="text-purple-600 font-medium">Avg Cost</div>
                                  <div className="text-purple-900 font-bold">{formatCurrency(data.cost / data.count)}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {pieData.length === 0 && (
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
                    No projects found for analysis.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
