'use client'

import React, { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { BuildSpace } from '@/types'
import { COLORS } from '@/lib/constant'

interface DevelopersChartProps {
  data: BuildSpace[]
  loading?: boolean
}


export function DevelopersChart({ data, loading = false }: DevelopersChartProps) {
  const [hoveredSection, setHoveredSection] = useState<any>(null)

  const developerData = React.useMemo(() => {
    if (!data.length) return []

    // Calculate engagement distribution by developer
    const developerCounts = {} as Record<string, any>
    
    data.forEach(project => {
      // Get all unique members for this project
      const allMembers = new Set<string>()
      
      if (project.createdBy) allMembers.add(project.createdBy)
      if (project.owner) allMembers.add(project.owner)
      
      if (project.members && typeof project.members === 'object') {
        Object.entries(project.members).forEach(entry => {
          if (entry && typeof entry[1] === 'string' && entry[0]!== '606dcf7d67dfbc0d60f8c633'){
            // console.log('Adding member:', entry[1])
            allMembers.add(entry[1])
          }
        })
      }

      const memberCount = allMembers.size
      const engagementPerMember = memberCount > 0 ? project.totalItemCount / memberCount : 0
      const costPerMember = memberCount > 0 ? project.totalCost / memberCount : 0

      // Distribute engagement and cost evenly among all members
      allMembers.forEach(memberName => {
        if (!developerCounts[memberName]) {
          developerCounts[memberName] = {
            name: memberName,
            projects: 0,
            totalCost: 0,
            totalEngagement: 0
          }
        }
        developerCounts[memberName].projects += 1
        developerCounts[memberName].totalCost += costPerMember
        developerCounts[memberName].totalEngagement += engagementPerMember
      })
    })

    return Object.values(developerCounts)
      .sort((a: any, b: any) => b.totalEngagement - a.totalEngagement)
      .slice(0, 92) // Top 92 developers by engagement
  }, [data])

  const pieData = React.useMemo(() => {
    const totalEngagement = developerData.reduce((sum, dev) => sum + dev.totalEngagement, 0)
    
    return developerData.map(dev => ({
      name: dev.name.length > 20 ? dev.name.substring(0, 20) + '...' : dev.name,
      value: dev.totalEngagement,
      fullName: dev.name,
      projects: dev.projects,
      totalCost: dev.totalCost,
      totalEngagement: dev.totalEngagement,
      share: totalEngagement > 0 ? (dev.totalEngagement / totalEngagement * 100) : 0
    }))
  }, [developerData])

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
      {/* Developer Project Distribution */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Developer Engagement Distribution
          </CardTitle>
          <p className="text-sm text-gray-600">
            Engagement share by each developer across all projects
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
                        <div className="text-blue-600 font-medium">Projects</div>
                        <div className="text-blue-900 font-bold text-2xl">{hoveredSection.projects}</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-green-600 font-medium">Share</div>
                        <div className="text-green-900 font-bold text-2xl">
                          {hoveredSection.share.toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="text-orange-600 font-medium">Total Cost</div>
                        <div className="text-orange-900 font-bold">${hoveredSection.totalCost.toFixed(2)}</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="text-purple-600 font-medium">Engagement</div>
                        <div className="text-purple-900 font-bold">{hoveredSection.totalEngagement.toFixed(1)}</div>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-100 text-xs text-gray-600 space-y-1">
                      <div>Avg Cost/Project: <span className="font-semibold">${(hoveredSection.totalCost / hoveredSection.projects).toFixed(2)}</span></div>
                      <div>Avg Engagement/Project: <span className="font-semibold">{(hoveredSection.totalEngagement / hoveredSection.projects).toFixed(1)}</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-3">
                Top {pieData.length} Developers
                {pieData.length > 9 && (
                  <span className="text-sm text-gray-500 font-normal ml-2">
                    (Showing {Math.min(9, pieData.length)} of {pieData.length})
                  </span>
                )}
              </h4>
              <div className="max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <div className="grid grid-cols-3 gap-2 pr-2">
                  {pieData.map((entry, index) => (
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
                          {entry.fullName.length > 30 ? entry.fullName.substring(0, 30) + '...' : entry.fullName}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-semibold text-gray-900">{entry.projects}</div>
                        <div className="text-xs text-gray-500">{(entry.share).toFixed(1)}%</div>
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
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No developer data</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No developer information found.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
