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
  AreaChart,
  Area
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { createProjectDataService } from '@/lib/dataService'
import { ProjectModel } from '@/types'
import { Expand, X } from 'lucide-react'

interface ProjectChartsProps {
  filters?: Record<string, string | undefined>
}

import { COLORS } from '@/lib/constant'

export function ProjectCharts({ filters = {} }: ProjectChartsProps) {
  const [data, setData] = useState<ProjectModel[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedChart, setExpandedChart] = useState<string | null>(null)
  const dataService = useMemo(() => createProjectDataService(), [])

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
      costAnalysis: [],
      userEngagement: [],
      deploymentStatus: [],
      activityTimeline: []
    }

    // Project cost analysis
    const costAnalysis = data
      .filter(project => project.totalCost > 0)
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 15)
      .map(project => ({
        name: project.projectName.length > 15 ? project.projectName.substring(0, 15) + '...' : project.projectName,
        cost: project.totalCost,
        users: project.totalUsers,
        events: project.totalEvents,
        organization: project.organizations
      }))

    // User engagement data
    const userEngagement = data
      .filter(project => project.totalUsers > 0)
      .sort((a, b) => b.totalUsers - a.totalUsers)
      .slice(0, 15)
      .map(project => ({
        name: project.projectName.length > 12 ? project.projectName.substring(0, 15) + '...' : project.projectName,
        totalUsers: project.totalUsers,
        activeUsers: project.totalActiveUser,
        invitedUsers: project.totalUsersInvited,
        acceptedUsers: project.totalUsersAccepted
      }))

    // App deployment status
    const deploymentStatus = data
      .filter(project => project.app_deployed_count > 0 || project.app_generated_count > 0)
      .sort((a, b) => (b.app_deployed_count + b.app_generated_count) - (a.app_deployed_count + a.app_generated_count))
      .slice(0, 15)
      .map(project => ({
        name: project.projectName.length > 12 ? project.projectName.substring(0, 15) + '...' : project.projectName,
        deployed: project.app_deployed_count,
        generated: project.app_generated_count,
        deploymentRate: project.app_generated_count > 0 ? 
          Math.round((project.app_deployed_count / project.app_generated_count) * 100) : 0
      }))

    // Activity timeline (Recent Agent Tasks)
    const activityTimeline = data
      .filter(project => project.eventsLast4Weeks > 0)
      .sort((a, b) => b.eventsLast4Weeks - a.eventsLast4Weeks)
      .slice(0, 15)
      .map(project => ({
        name: project.projectName.length > 10 ? project.projectName.substring(0, 15) + '...' : project.projectName,
        recentEvents: project.eventsLast4Weeks,
        totalEvents: project.totalEvents,
        cost: project.totalCost
      }))

    return {
      costAnalysis,
      userEngagement,
      deploymentStatus,
      activityTimeline
    }
  }, [data])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading project charts...</div>
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
              {expandedChart === 'cost' ? 'Top Projects by Cost Analysis' : 'Recent Project Activity Timeline'}
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
              <BarChart data={chartData.costAnalysis} margin={{ top: 20, right: 30, left: 60, bottom: 120 }}>
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
                  label={{ value: 'Cost ($) / Count', angle: -90, position: 'insideLeft' }}
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
                <Bar dataKey="events" fill={COLORS[1]} name="Total Agentic Tasks" />
                <Bar dataKey="users" fill={COLORS[2]} name="Total Users" />
              </BarChart>
            ) : (
              <LineChart data={chartData.activityTimeline} margin={{ top: 20, right: 30, left: 60, bottom: 120 }}>
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
                  label={{ value: 'Events / Cost ($)', angle: -90, position: 'insideLeft' }}
                  domain={['dataMin', 'dataMax']}
                  scale="linear"
                />
                <Tooltip
                  formatter={(value, name) => [
                    value.toLocaleString(),
                    name === 'recentEvents' ? 'Recent Agent Tasks (4 weeks)' :
                    name === 'totalEvents' ? 'Total Agentic Tasks' : name
                  ]}
                  contentStyle={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="recentEvents" stroke={COLORS[9]} strokeWidth={3} name="Recent Agent Tasks (4 weeks)" />
                <Line type="monotone" dataKey="totalEvents" stroke={COLORS[10]} strokeWidth={3} name="Total Agentic Tasks" />
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
            <div className="text-sm text-blue-800">Total Projects</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">
              ${data.reduce((sum, project) => sum + project.totalCost, 0).toLocaleString()}
            </div>
            <div className="text-sm text-green-800">Total Cost</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">
              {data.reduce((sum, project) => project.globalTotalUsers, 0).toLocaleString()}
            </div>
            <div className="text-sm text-purple-800">Total Users</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">
              {data.reduce((sum, project) => sum + project.app_deployed_count, 0).toLocaleString()}
            </div>
            <div className="text-sm text-orange-800">Apps Deployed</div>
          </div>
        </div>

        {/* Compact Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Cost Analysis Chart - Compact */}
          <div className="bg-white p-4 rounded-lg border shadow-sm relative">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-sm">Cost Analysis</h4>
              <button
                onClick={() => setExpandedChart('cost')}
                className="p-1 hover:bg-gray-100 rounded"
                title="Expand chart"
              >
                <Expand className="h-4 w-4" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.costAnalysis.slice(0, 5)} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
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
                    name === 'cost' ? 'Cost' : name === 'events' ? 'Events' : 'Users'
                  ]}
                  contentStyle={{ fontSize: '11px' }}
                />
                <Bar dataKey="cost" fill={COLORS[0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Activity Timeline Chart - Compact */}
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
              <LineChart data={chartData.activityTimeline.slice(0, 5)} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
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
                    name === 'recentEvents' ? 'Recent Agent Tasks' : 'Total Agentic Tasks'
                  ]}
                  contentStyle={{ fontSize: '11px' }}
                />
                <Line type="monotone" dataKey="recentEvents" stroke={COLORS[9]} strokeWidth={2} />
                <Line type="monotone" dataKey="totalEvents" stroke={COLORS[10]} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
      {renderExpandedChart()}
    </>
  )
}
