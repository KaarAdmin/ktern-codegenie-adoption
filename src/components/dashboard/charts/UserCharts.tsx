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
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { createUserDataService } from '@/lib/dataService'
import { UserModel } from '@/types'
import { COLORS } from '@/lib/constant'

interface UserChartsProps {
  filters?: Record<string, string | undefined>
}

export function UserCharts({ filters = {} }: UserChartsProps) {
  const [data, setData] = useState<UserModel[]>([])
  const [loading, setLoading] = useState(true)
  const dataService = useMemo(() => createUserDataService(), [])

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
      costDistribution: [],
      costContribution: [],
      activityByOrganization: [],
      performanceMetrics: []
    }

    // User cost distribution - Top 30 users
    const costDistribution = data
      .filter(user => user.totalCost > 0)
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 30)
      .map(user => ({
        name: user.fullName.length > 12 ? user.fullName.substring(0, 12) + '...' : user.fullName,
        fullName: user.fullName,
        cost: user.totalCost,
        events: user.totalEvents,
        organization: user.organization,
        project: user.projectName
      }))

    // Top users by cost contribution (for pie chart showing cost percentage)
    const costContribution = data
      .filter(user => user.totalCost > 0)
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 10) // Top 10 for better pie chart visibility
      .map(user => ({
        name: user.fullName.length > 12 ? user.fullName.substring(0, 30) + '...' : user.fullName,
        fullName: user.fullName,
        value: user.totalCost,
        totalEvents: user.totalEvents,
        recentEvents: user.eventsLast4Weeks,
        appsDeployed: user.app_deployed_count,
        appsGenerated: user.app_generated_count,
        organization: user.organization,
        project: user.projectName
      }))

    // Activity by organization (bar chart data)
    const activityByOrganization = data.reduce((acc: any[], user) => {
      const existing = acc.find(item => item.organization === user.organization)
      if (existing) {
        existing.users += 1
        existing.totalEvents += user.totalEvents
        existing.totalCost += user.totalCost
        existing.avgEventsPerUser = Math.round(existing.totalEvents / existing.users)
        existing.avgCostPerUser = Math.round(existing.totalCost / existing.users)
        existing.fullOrganization = user.organization
      } else {
        acc.push({
          organization: user.organization.length > 15 ? user.organization.substring(0, 15) + '...' : user.organization,
          fullOrganization: user.organization,
          users: 1,
          totalEvents: user.totalEvents,
          totalCost: user.totalCost,
          avgEventsPerUser: user.totalEvents,
          avgCostPerUser: user.totalCost
        })
      }
      return acc
    }, [])
    .sort((a, b) => b.totalEvents - a.totalEvents)
    .slice(0, 20)

    // Performance metrics (radar chart data) - Top 30 users
    const performanceMetrics = data
      .filter(user => user.totalEvents > 0)
      .sort((a, b) => b.totalEvents - a.totalEvents)
      .slice(0, 30)
      .map(user => ({
        name: user.fullName.length > 8 ? user.fullName.substring(0, 8) + '...' : user.fullName,
        fullName: user.fullName,
        events: Math.min(user.totalEvents / 10, 100), // Normalize to 0-100 scale
        cost: Math.min(user.totalCost / 100, 100), // Normalize to 0-100 scale
        recentActivity: Math.min(user.eventsLast4Weeks * 5, 100), // Normalize to 0-100 scale
        appsDeployed: Math.min(user.app_deployed_count * 10, 100), // Normalize to 0-100 scale
        appsGenerated: Math.min(user.app_generated_count * 10, 100), // Normalize to 0-100 scale
        organization: user.organization,
        project: user.projectName,
        totalEvents: user.totalEvents,
        totalCost: user.totalCost,
        eventsLast4Weeks: user.eventsLast4Weeks,
        app_deployed_count: user.app_deployed_count,
        app_generated_count: user.app_generated_count
      }))

    return {
      costDistribution,
      costContribution,
      activityByOrganization,
      performanceMetrics
    }
  }, [data])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading user charts...</div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-8">
      <h3 className="text-xl font-semibold mb-8">User-Level Insights and Analytics</h3>
      <div className="space-y-8">
        
        {/* User Cost Distribution - Full Width */}
        <div className="bg-white p-6 rounded-lg border shadow-sm w-full">
          <h4 className="font-medium mb-6 text-center text-lg">Top 30 Users by Cost Distribution</h4>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={chartData.costDistribution} margin={{ top: 20, right: 30, left: 60, bottom: 120 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={120}
                fontSize={10}
                interval={0}
                label={{ value: 'Users', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                label={{ value: 'Amount ($) / Events Count', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value, name) => [
                  name === 'cost' ? `$${value.toLocaleString()}` : value.toLocaleString(),
                  name === 'cost' ? 'Total Cost ($)' :
                  name === 'events' ? 'Total Events' : name
                ]}
                labelFormatter={(label) => {
                  const user = chartData.costDistribution.find(u => u.name === label);
                  return user ? `User: ${user.fullName}\nOrganization: ${user.organization}\nProject: ${user.project}\nTotal Cost: $${user.cost.toLocaleString()}\nTotal Events: ${user.events.toLocaleString()}` : label;
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
              <Bar dataKey="events" fill={COLORS[1]} name="Total Events" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Contribution Percentage - Full Width */}
        <div className="bg-white p-6 rounded-lg border shadow-sm w-full">
          <h4 className="font-medium mb-6 text-center text-lg">Top Users by Cost Contribution (%)</h4>
          <ResponsiveContainer width="100%" height={500}>
            <PieChart>
              <Pie
                data={chartData.costContribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.costContribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`$${value.toLocaleString()}`, 'Total Cost']}
                labelFormatter={(label) => {
                  const user = chartData.costContribution.find(u => u.name === label);
                  return user ? `User: ${user.fullName}\nOrganization: ${user.organization}\nProject: ${user.project}\nTotal Cost: $${user.value.toLocaleString()}\nTotal Events: ${user.totalEvents.toLocaleString()}\nRecent Events (4 weeks): ${user.recentEvents}\nApps Generated: ${user.appsGenerated}\nApps Deployed: ${user.appsDeployed}` : label;
                }}
                contentStyle={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                  whiteSpace: 'pre-line',
                  maxWidth: '350px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Activity by Organization - Bar Chart - Full Width */}
        <div className="bg-white p-6 rounded-lg border shadow-sm w-full">
          <h4 className="font-medium mb-6 text-center text-lg">Activity by Organization</h4>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={chartData.activityByOrganization} margin={{ top: 20, right: 30, left: 60, bottom: 120 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="organization"
                angle={-45}
                textAnchor="end"
                height={120}
                fontSize={10}
                interval={0}
                label={{ value: 'Organizations', position: 'insideBottom', offset: -10 }}
              />
              <YAxis
                label={{ value: 'Count / Average', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value, name) => [
                  value.toLocaleString(),
                  name === 'users' ? 'Total Users' :
                  name === 'totalEvents' ? 'Total Events' :
                  name === 'avgEventsPerUser' ? 'Avg Events per User' :
                  name === 'avgCostPerUser' ? 'Avg Cost per User ($)' : name
                ]}
                labelFormatter={(label) => {
                  const org = chartData.activityByOrganization.find(o => o.organization === label);
                  return org ? `Organization: ${org.fullOrganization}\nTotal Users: ${org.users}\nTotal Events: ${org.totalEvents.toLocaleString()}\nTotal Cost: $${org.totalCost.toLocaleString()}\nAvg Events/User: ${org.avgEventsPerUser}\nAvg Cost/User: $${org.avgCostPerUser}` : label;
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
              <Bar dataKey="users" fill={COLORS[2]} name="Total Users" />
              <Bar dataKey="avgEventsPerUser" fill={COLORS[3]} name="Avg Events per User" />
              <Bar dataKey="avgCostPerUser" fill={COLORS[4]} name="Avg Cost per User ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Metrics Radar - Full Width */}
        <div className="bg-white p-6 rounded-lg border shadow-sm w-full">
          <h4 className="font-medium mb-6 text-center text-lg">Top 30 Users - Performance Metrics</h4>
          <ResponsiveContainer width="100%" height={500}>
            <RadarChart data={chartData.performanceMetrics}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" fontSize={8} />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                fontSize={8}
                label={{ value: 'Performance Score (%)', position: 'insideTopLeft' }}
              />
              <Radar
                name="Events Score"
                dataKey="events"
                stroke={COLORS[5]}
                fill={COLORS[5]}
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Radar
                name="Cost Score"
                dataKey="cost"
                stroke={COLORS[6]}
                fill={COLORS[6]}
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Radar
                name="Recent Activity Score"
                dataKey="recentActivity"
                stroke={COLORS[7]}
                fill={COLORS[7]}
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Legend />
              <Tooltip
                formatter={(value, name) => [
                  `${typeof value === 'number' ? value.toFixed(1) : value}%`,
                  name === 'events' ? 'Events Score (%)' :
                  name === 'cost' ? 'Cost Score (%)' :
                  name === 'recentActivity' ? 'Recent Activity Score (%)' : name
                ]}
                labelFormatter={(label) => {
                  const user = chartData.performanceMetrics.find(u => u.name === label);
                  return user ? `User: ${user.fullName}\nOrganization: ${user.organization}\nProject: ${user.project}\nTotal Events: ${user.totalEvents}\nTotal Cost: $${user.totalCost.toLocaleString()}\nRecent Events (4 weeks): ${user.eventsLast4Weeks}\nApps Generated: ${user.app_generated_count}\nApps Deployed: ${user.app_deployed_count}` : label;
                }}
                contentStyle={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                  whiteSpace: 'pre-line',
                  maxWidth: '350px'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">
            {data.length}
          </div>
          <div className="text-sm text-blue-800">Total Users</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">
            ${data.reduce((sum, user) => sum + user.totalCost, 0).toLocaleString()}
          </div>
          <div className="text-sm text-green-800">Total Cost</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">
            {data.reduce((sum, user) => sum + user.totalEvents, 0).toLocaleString()}
          </div>
          <div className="text-sm text-purple-800">Total Events</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600">
            {data.reduce((sum, user) => sum + user.app_deployed_count, 0).toLocaleString()}
          </div>
          <div className="text-sm text-orange-800">Apps Deployed</div>
        </div>
      </div>
    </Card>
  )
}
