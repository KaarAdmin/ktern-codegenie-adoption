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
import { Expand, X } from 'lucide-react'

interface OrganizationChartsProps {
  filters?: Record<string, string | undefined>
}

import { COLORS } from '@/lib/constant'

export function OrganizationCharts({ filters = {} }: OrganizationChartsProps) {
  const [data, setData] = useState<OrganizationModel[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedChart, setExpandedChart] = useState<string | null>(null)
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

  const renderExpandedChart = () => {
    if (!expandedChart) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">
              {expandedChart === 'cost' ? 'Top Organizations by Cost Distribution' : 'Recent CodeGenie Activity Timeline'}
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
              <BarChart data={chartData.costData} margin={{ top: 20, right: 30, left: 60, bottom: 120 }}>
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
                  label={{ value: 'Cost ($) / User Count', angle: -90, position: 'insideLeft' }}
                  domain={['dataMin', 'dataMax']}
                  scale="linear"
                />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'cost' ? `$${value.toLocaleString()}` : value.toLocaleString(),
                    name === 'cost' ? 'Total Cost ($)' :
                    name === 'users' ? 'Total Users' :
                    name === 'events' ? 'Total Agentic Tasks' : name
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
                <Bar dataKey="users" fill={COLORS[1]} name="Total Users" />
                <Bar dataKey="events" fill={COLORS[2]} name="Total Agentic Tasks" />
              </BarChart>
            ) : (
              <LineChart data={chartData.eventsTimeline} margin={{ top: 20, right: 30, left: 60, bottom: 120 }}>
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
                  label={{ value: 'Events/ Active Users', angle: -90, position: 'insideLeft' }}
                  domain={['dataMin', 'dataMax']}
                  scale="linear"
                />
                <Tooltip
                  formatter={(value, name) => [
                    value.toLocaleString(),
                    name === 'recentEvents' ? 'Recent Agent Tasks (4 weeks)' :
                    name === 'totalEvents' ? 'Total Agentic Tasks' :
                    name === 'activeUsers' ? 'Active Users' : name
                  ]}
                  contentStyle={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="recentEvents" stroke={COLORS[3]} strokeWidth={3} name="Recent Agent Tasks (4 weeks)" />
                <Line type="monotone" dataKey="activeUsers" stroke={COLORS[4]} strokeWidth={3} name="Active Users" />
                <Line type="monotone" dataKey="totalEvents" stroke={COLORS[5]} strokeWidth={3} name="Total Agentic Tasks" />
              </LineChart>
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
              {data.reduce((sum, org) => org.globalTotalUsers, 0).toLocaleString()}
            </div>
            <div className="text-sm text-purple-800">Total Users</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">
              {data.reduce((sum, org) => sum + org.totalEvents, 0).toLocaleString()}
            </div>
            <div className="text-sm text-orange-800">Total Agentic Tasks</div>
          </div>
        </div>

        {/* Compact Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
              <BarChart data={chartData.costData.slice(0, 5)} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
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
                    name === 'cost' ? 'Cost' : name === 'users' ? 'Users' : 'Events'
                  ]}
                  contentStyle={{ fontSize: '11px' }}
                />
                <Bar dataKey="cost" fill={COLORS[0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Events Timeline Chart - Compact */}
          <div className="bg-white p-4 rounded-lg border shadow-sm relative">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-sm">Activity Timeline</h4>
              <button
                onClick={() => setExpandedChart('timeline')}
                className="p-1 hover:bg-gray-100 rounded"
                title="Expand chart"
              >
                <Expand className="h-4 w-4" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData.eventsTimeline.slice(0, 5)} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={10} angle={-45} textAnchor="end" height={40} />
                <YAxis
                  fontSize={10}
                  domain={['dataMin', 'dataMax']}
                  scale="linear"
                />
                <Tooltip
                  formatter={(value, name) => [
                    value.toLocaleString(),
                    name === 'recentEvents' ? 'Recent Agent Tasks' : 'Active Users'
                  ]}
                  contentStyle={{ fontSize: '11px' }}
                />
                <Line type="monotone" dataKey="recentEvents" stroke={COLORS[3]} strokeWidth={2} />
                <Line type="monotone" dataKey="activeUsers" stroke={COLORS[4]} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
      {renderExpandedChart()}
    </>
  )
}
