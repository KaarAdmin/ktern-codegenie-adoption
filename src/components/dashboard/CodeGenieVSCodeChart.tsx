'use client'

import React, { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { UserExpense } from '@/types'
import { COLORS } from '@/lib/constant'

interface CodeGenieVSCodeChartProps {
  data: UserExpense[]
  loading?: boolean
}

export function CodeGenieVSCodeChart({ data, loading = false }: CodeGenieVSCodeChartProps) {
  const [hoveredSection, setHoveredSection] = useState<any>(null)

  const userExpenseData = React.useMemo(() => {
    if (!data.length) return []

    return data
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 20) // Top 20 users by cost
  }, [data])

  const pieData = React.useMemo(() => {
    const totalCost = userExpenseData.reduce((sum, user) => sum + user.totalCost, 0)
    
    return userExpenseData.map(user => ({
      name: user.name.length > 20 ? user.name.substring(0, 20) + '...' : user.name,
      value: user.totalCost,
      fullName: user.name,
      projectId: user.projectId,
      totalCost: user.totalCost,
      totalEngagement: user.totalItemCount,
      share: totalCost > 0 ? (user.totalCost / totalCost * 100) : 0
    }))
  }, [userExpenseData])

  const barData = React.useMemo(() => {
    return userExpenseData.slice(0, 10).map(user => ({
      name: user.name.length > 15 ? user.name.substring(0, 15) + '...' : user.name,
      fullName: user.name,
      cost: user.totalCost,
      engagement: user.totalItemCount
    }))
  }, [userExpenseData])

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
      {/* Cost Distribution Pie Chart */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            CodeGenie VSCode Edition Cost Distribution
          </CardTitle>
          <p className="text-sm text-gray-600">
            Cost share by each user across all projects
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Pie Chart Container */}
            <div className="h-80 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={hoveredSection ? 160 : 80}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={300}
                    onMouseEnter={(data, index) => {
                      setHoveredSection({ ...data, index, color: COLORS[index % COLORS.length] })
                    }}
                    onMouseLeave={() => {
                      setHoveredSection(null)
                    }}
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        stroke={hoveredSection?.index === index ? '#ffffff' : 'none'}
                        strokeWidth={hoveredSection?.index === index ? 3 : 0}
                        style={{
                          filter: hoveredSection?.index === index 
                            ? 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2)) brightness(1.1)' 
                            : 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Fixed Position Tooltip */}
              {hoveredSection && (
                <div className="absolute top-4 right-4 bg-white border border-gray-200 rounded-xl p-4 shadow-xl z-10 min-w-64 animate-fade-in">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: hoveredSection.color }}
                      ></div>
                      <div className="font-bold text-gray-900 text-lg">{hoveredSection.fullName}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-blue-600 font-medium">Total Cost</div>
                        <div className="text-blue-900 font-bold text-xl">${hoveredSection.totalCost.toFixed(2)}</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-green-600 font-medium">Share</div>
                        <div className="text-green-900 font-bold text-xl">
                          {hoveredSection.share.toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg col-span-2">
                        <div className="text-purple-600 font-medium">Total Engagement</div>
                        <div className="text-purple-900 font-bold text-xl">{hoveredSection.totalEngagement}</div>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-100 text-xs text-gray-600">
                      <div>Project ID: <span className="font-semibold">{hoveredSection.projectId}</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-3">
                Top Users by Cost
                {pieData.length > 9 && (
                  <span className="text-sm text-gray-500 font-normal ml-2">
                    (Showing {Math.min(9, pieData.length)} of {pieData.length})
                  </span>
                )}
              </h4>
              <div className="max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <div className="grid grid-cols-2 gap-2 pr-2">
                  {pieData.slice(0, 10).map((entry, index) => (
                    <div 
                      key={entry.fullName} 
                      className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${
                        hoveredSection?.index === index ? 'bg-blue-100 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onMouseEnter={() => setHoveredSection({ ...entry, index, color: COLORS[index % COLORS.length] })}
                      onMouseLeave={() => setHoveredSection(null)}
                    >
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="text-sm font-medium text-gray-900 truncate" title={entry.fullName}>
                          {entry.fullName.length > 25 ? entry.fullName.substring(0, 25) + '...' : entry.fullName}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-semibold text-gray-900">${entry.totalCost.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">{entry.share.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No cost data</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No CodeGenie VSCode Edition cost information found.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost vs Engagement Bar Chart */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Cost vs Engagement Analysis
          </CardTitle>
          <p className="text-sm text-gray-600">
            Top 10 users by cost showing cost and engagement comparison
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                  stroke="#666"
                />
                <YAxis 
                  yAxisId="cost"
                  orientation="left"
                  stroke="#3b82f6"
                  fontSize={12}
                />
                <YAxis 
                  yAxisId="engagement"
                  orientation="right"
                  stroke="#10b981"
                  fontSize={12}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                          <p className="font-semibold text-gray-900 mb-2">{data.fullName}</p>
                          <div className="space-y-1">
                            <p className="text-blue-600">
                              <span className="font-medium">Cost:</span> ${data.cost.toFixed(2)}
                            </p>
                            <p className="text-green-600">
                              <span className="font-medium">Engagement:</span> {data.engagement}
                            </p>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar 
                  yAxisId="cost"
                  dataKey="cost" 
                  fill="#3b82f6" 
                  name="Cost ($)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  yAxisId="engagement"
                  dataKey="engagement" 
                  fill="#10b981" 
                  name="Engagement"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {barData.length === 0 && (
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
                  No cost and engagement data found.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
