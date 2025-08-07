'use client'

import React, { useMemo, useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { createOrganizationDataService } from '@/lib/dataService'
import { OrganizationModel } from '@/types'

interface OrganizationChartsProps {
  filters?: Record<string, string | undefined>
}

import { COLORS } from '@/lib/constant'

export function OrganizationCharts({ filters = {} }: OrganizationChartsProps) {
  const [data, setData] = useState<OrganizationModel[]>([])
  const [loading, setLoading] = useState(true)
  const dataService = useMemo(() => createOrganizationDataService(), [])

  useEffect(() => {
    const unsubscribe = dataService.subscribe((state) => {
      setData(state.data)
      setLoading(state.loading)
    })

    dataService.loadInitialData(filters)

    return () => {
      unsubscribe()
      dataService.destroy()
    }
  }, [dataService, filters])

  const chartData = useMemo(() => {
    if (!data.length) return {
      costData: [],
      userDistribution: [],
      eventsTimeline: [],
      geographicData: []
    }

    // Cost distribution data
    const costData = data
      .filter(org => org.totalCost > 0)
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 15)
      .map(org => ({
        name: org.organization.length > 15 ? org.organization.substring(0, 15) + '...' : org.organization,
        cost: org.totalCost,
        users: org.totalUsers,
        events: org.totalEvents
      }))

    // User distribution pie chart data
    const userDistribution = data
      .filter(org => org.totalUsers > 0)
      .sort((a, b) => b.totalUsers - a.totalUsers)
      .slice(0, 15)
      .map(org => ({
        name: org.organization.length > 12 ? org.organization.substring(0, 15) + '...' : org.organization,
        value: org.totalUsers,
        cost: org.totalCost
      }))

    // Events timeline data (using last 4 weeks events)
    const eventsTimeline = data
      .filter(org => org.eventsLast4Weeks > 0)
      .sort((a, b) => b.eventsLast4Weeks - a.eventsLast4Weeks)
      .slice(0, 15)
      .map(org => ({
        name: org.organization.length > 10 ? org.organization.substring(0, 15) + '...' : org.organization,
        recentEvents: org.eventsLast4Weeks,
        totalEvents: org.totalEvents,
        activeUsers: org.totalActiveUser
      }))

    // Geographic distribution data
    const geographicData = data.reduce((acc: any[], org) => {
      const existing = acc.find(item => item.country === org.country)
      if (existing) {
        existing.organizations += 1
        existing.totalUsers += org.totalUsers
        existing.totalCost += org.totalCost
        existing.totalEvents += org.totalEvents
      } else {
        acc.push({
          country: org.country || 'Unknown',
          organizations: 1,
          totalUsers: org.totalUsers,
          totalCost: org.totalCost,
          totalEvents: org.totalEvents
        })
      }
      return acc
    }, [])
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 15)

    return {
      costData,
      userDistribution,
      eventsTimeline,
      geographicData
    }
  }, [data])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading organization charts...</div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-8">
      <h3 className="text-xl font-semibold mb-8">Organization-Level Insights and Analytics</h3>
      <div className="space-y-8">
        
        {/* Cost Distribution Bar Chart - Full Width */}
        <div className="bg-white p-6 rounded-lg border shadow-sm w-full">
          <h4 className="font-medium mb-6 text-center text-lg">Top Organizations by Cost Distribution</h4>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={chartData.costData} margin={{ top: 20, right: 30, left: 60, bottom: 120 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={120}
                fontSize={10}
                interval={0}
                label={{ value: 'Organizations', position: 'insideBottom', offset: -10 }}
              />
              <YAxis
                label={{ value: 'Cost ($) / User Count', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value, name) => [
                  name === 'cost' ? `$${value.toLocaleString()}` : value.toLocaleString(),
                  name === 'cost' ? 'Total Cost ($)' :
                  name === 'users' ? 'Total Users' :
                  name === 'events' ? 'Total Events' : name
                ]}
                labelFormatter={(label) => {
                  const org = chartData.costData.find(o => o.name === label);
                  return org ? `Organization: ${label}\nTotal Cost: $${org.cost.toLocaleString()}\nTotal Users: ${org.users}\nTotal Events: ${org.events}` : label;
                }}
                contentStyle={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                  whiteSpace: 'pre-line'
                }}
              />
              <Legend />
              <Bar dataKey="cost" fill={COLORS[0]} name="Total Cost ($)" />
              <Bar dataKey="users" fill={COLORS[1]} name="Total Users" />
              <Bar dataKey="events" fill={COLORS[2]} name="Total Events" />
            </BarChart>
          </ResponsiveContainer>
        </div>


        {/* Events Timeline - Full Width */}
        <div className="bg-white p-6 rounded-lg border shadow-sm w-full">
          <h4 className="font-medium mb-6 text-center text-lg">Recent CodeGenie Activity Timeline</h4>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={chartData.eventsTimeline} margin={{ top: 20, right: 30, left: 60, bottom: 120 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={120}
                fontSize={10}
                interval={0}
                label={{ value: 'Organizations', position: 'insideBottom', offset: -10 }}
              />
              <YAxis
                label={{ value: 'Events Count / Active Users', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value, name) => [
                  value.toLocaleString(),
                  name === 'recentEvents' ? 'Recent Events (4 weeks)' :
                  name === 'totalEvents' ? 'Total Events' :
                  name === 'activeUsers' ? 'Active Users' : name
                ]}
                labelFormatter={(label) => {
                  const org = chartData.eventsTimeline.find(o => o.name === label);
                  return org ? `Organization: ${label}\nRecent Events (4 weeks): ${org.recentEvents}\nTotal Events: ${org.totalEvents}\nActive Users: ${org.activeUsers}` : label;
                }}
                contentStyle={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                  whiteSpace: 'pre-line'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="recentEvents"
                stroke={COLORS[3]}
                strokeWidth={3}
                name="Recent Events (4 weeks)"
                dot={{ fill: COLORS[3], strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="activeUsers"
                stroke={COLORS[4]}
                strokeWidth={3}
                name="Active Users"
                dot={{ fill: COLORS[4], strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="totalEvents"
                stroke={COLORS[5]}
                strokeWidth={3}
                name="Total Events"
                dot={{ fill: COLORS[5], strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">
            {data.length}
          </div>
          <div className="text-sm text-blue-800">Total Organizations</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">
            ${data.reduce((sum, org) => sum + org.totalCost, 0).toLocaleString()}
          </div>
          <div className="text-sm text-green-800">Total Cost</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">
            {data.reduce((sum, org) => sum + org.totalUsers, 0).toLocaleString()}
          </div>
          <div className="text-sm text-purple-800">Total Users</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600">
            {data.reduce((sum, org) => sum + org.totalEvents, 0).toLocaleString()}
          </div>
          <div className="text-sm text-orange-800">Total Events</div>
        </div>
      </div>
    </Card>
  )
}
