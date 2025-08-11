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
import { Expand, X } from 'lucide-react'

interface UserChartsProps {
  filters?: Record<string, string | undefined>
}

export function UserCharts({ filters = {} }: UserChartsProps) {
  const [data, setData] = useState<UserModel[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedChart, setExpandedChart] = useState<string | null>(null)
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

  // Add keyboard event listener for Esc key to close expanded chart
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && expandedChart) {
        setExpandedChart(null)
      }
    }

    if (expandedChart) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [expandedChart])

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

  const renderExpandedChart = () => {
    if (!expandedChart) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">
              {expandedChart === 'cost' ? 'Top 30 Users by Cost Distribution' :
               expandedChart === 'contribution' ? 'Top 10 Users by Cost Contribution (%)' :
               'Top 30 Users - Performance Metrics'}
            </h3>
            <button
              onClick={() => setExpandedChart(null)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={600}>
            {expandedChart === 'cost' ? (
              <BarChart data={chartData.costDistribution} margin={{ top: 20, right: 30, left: 60, bottom: 120 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  fontSize={12}
                  interval={0}
                />
                <YAxis
                  label={{ value: 'Amount ($) / Events', angle: -90, position: 'insideLeft' }}
                  domain={['dataMin', 'dataMax']}
                  scale="linear"
                />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'cost' ? `$${value.toLocaleString()}` : value.toLocaleString(),
                    name === 'cost' ? 'Total Cost ($)' : 'Total Events'
                  ]}
                  contentStyle={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend />
                <Bar dataKey="cost" fill={COLORS[0]} name="Total Cost ($)" />
                <Bar dataKey="events" fill={COLORS[1]} name="Total Events" />
              </BarChart>
            ) : expandedChart === 'contribution' ? (
              <PieChart>
                <Pie
                  data={chartData.costContribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  outerRadius={200}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.costContribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`$${value.toLocaleString()}`, 'Total Cost']}
                  contentStyle={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            ) : (
              <RadarChart data={chartData.performanceMetrics}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" fontSize={10} />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  fontSize={10}
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
                  contentStyle={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
              </RadarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{data.length}</div>
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

        {/* Compact Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Cost Distribution Chart - Compact */}
          <div className="bg-white p-4 rounded-lg border shadow-sm relative">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-sm">Cost Distribution</h4>
              <button
                onClick={() => setExpandedChart('cost')}
                className="p-1 hover:bg-gray-100 rounded"
                title="Expand chart"
              >
                <Expand className="h-4 w-4" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.costDistribution.slice(0, 5)} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={10} angle={-45} textAnchor="end" height={40} />
                <YAxis
                  fontSize={10}
                  domain={['dataMin', 'dataMax']}
                  scale="linear"
                />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'cost' ? `$${value.toLocaleString()}` : value.toLocaleString(),
                    name === 'cost' ? 'Cost' : 'Events'
                  ]}
                  contentStyle={{ fontSize: '11px' }}
                />
                <Bar dataKey="cost" fill={COLORS[0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cost Contribution Pie Chart - Compact */}
          <div className="bg-white p-4 rounded-lg border shadow-sm relative">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-sm">Cost Contribution</h4>
              <button
                onClick={() => setExpandedChart('contribution')}
                className="p-1 hover:bg-gray-100 rounded"
                title="Expand chart"
              >
                <Expand className="h-4 w-4" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData.costContribution.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.costContribution.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`$${value.toLocaleString()}`, 'Cost']}
                  contentStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Metrics Radar - Compact */}
          <div className="bg-white p-4 rounded-lg border shadow-sm relative">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-sm">Performance Metrics</h4>
              <button
                onClick={() => setExpandedChart('performance')}
                className="p-1 hover:bg-gray-100 rounded"
                title="Expand chart"
              >
                <Expand className="h-4 w-4" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={chartData.performanceMetrics.slice(0, 5)}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" fontSize={8} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} fontSize={8} />
                <Radar
                  name="Events"
                  dataKey="events"
                  stroke={COLORS[5]}
                  fill={COLORS[5]}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip
                  formatter={(value, name) => [`${typeof value === 'number' ? value.toFixed(1) : value}%`, 'Score']}
                  contentStyle={{ fontSize: '11px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
      {renderExpandedChart()}
    </>
  )
}
