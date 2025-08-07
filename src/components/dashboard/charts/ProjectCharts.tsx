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

interface ProjectChartsProps {
  filters?: Record<string, string | undefined>
}

import { COLORS } from '@/lib/constant'

export function ProjectCharts({ filters = {} }: ProjectChartsProps) {
  const [data, setData] = useState<ProjectModel[]>([])
  const [loading, setLoading] = useState(true)
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

    // Activity timeline (recent events)
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

  return (
    <Card className="p-8">
      <h3 className="text-xl font-semibold mb-8">Project-Level Insights and Analytics</h3>
      <div className="space-y-8">
        
        {/* Project Cost Analysis - Full Width */}
        <div className="bg-white p-6 rounded-lg border shadow-sm w-full">
          <h4 className="font-medium mb-6 text-center text-lg">Top Projects by Cost Analysis</h4>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={chartData.costAnalysis} margin={{ top: 20, right: 30, left: 60, bottom: 120 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={120}
                fontSize={10}
                interval={0}
                label={{ value: 'Projects', position: 'insideBottom', offset: -10 }}
              />
              <YAxis
                label={{ value: 'Cost ($) / Count', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value, name) => [
                  name === 'cost' ? `$${value.toLocaleString()}` : value.toLocaleString(),
                  name === 'cost' ? 'Total Cost ($)' :
                  name === 'users' ? 'Total Users' :
                  name === 'events' ? 'Total Events' : name
                ]}
                labelFormatter={(label) => {
                  const project = chartData.costAnalysis.find(p => p.name === label);
                  return project ? `Project: ${project.name}\nOrganization: ${project.organization}\nTotal Cost: $${project.cost.toLocaleString()}\nTotal Users: ${project.users}\nTotal Events: ${project.events}` : label;
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
              <Bar dataKey="users" fill={COLORS[2]} name="Total Users" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Engagement - Full Width */}
        <div className="bg-white p-6 rounded-lg border shadow-sm w-full">
          <h4 className="font-medium mb-6 text-center text-lg">User Engagement by Project</h4>
          <ResponsiveContainer width="100%" height={500}>
            <AreaChart data={chartData.userEngagement} margin={{ top: 20, right: 30, left: 60, bottom: 120 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={120}
                fontSize={10}
                interval={0}
                label={{ value: 'Projects', position: 'insideBottom', offset: -10 }}
              />
              <YAxis
                label={{ value: 'User Count', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value, name) => [
                  value.toLocaleString(),
                  name === 'invitedUsers' ? 'Invited Users' :
                  name === 'acceptedUsers' ? 'Accepted Users' :
                  name === 'activeUsers' ? 'Active Users' : name
                ]}
                labelFormatter={(label) => {
                  const project = chartData.userEngagement.find(p => p.name === label);
                  return project ? `Project: ${project.name}\nTotal Users: ${project.totalUsers}\nInvited Users: ${project.invitedUsers}\nAccepted Users: ${project.acceptedUsers}\nActive Users: ${project.activeUsers}` : label;
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
              <Area
                type="monotone"
                dataKey="invitedUsers"
                stackId="1"
                stroke={COLORS[3]}
                fill={COLORS[3]}
                name="Invited Users"
              />
              <Area
                type="monotone"
                dataKey="acceptedUsers"
                stackId="1"
                stroke={COLORS[4]}
                fill={COLORS[4]}
                name="Accepted Users"
              />
              <Area
                type="monotone"
                dataKey="activeUsers"
                stackId="1"
                stroke={COLORS[5]}
                fill={COLORS[5]}
                name="Active Users"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>


        {/* Activity Timeline - Full Width */}
        <div className="bg-white p-6 rounded-lg border shadow-sm w-full">
          <h4 className="font-medium mb-6 text-center text-lg">Recent Project Activity Timeline</h4>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={chartData.activityTimeline} margin={{ top: 20, right: 30, left: 60, bottom: 120 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={120}
                fontSize={10}
                interval={0}
                label={{ value: 'Projects', position: 'insideBottom', offset: -10 }}
              />
              <YAxis
                label={{ value: 'Events Count / Cost ($)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value, name) => [
                  value.toLocaleString(),
                  name === 'recentEvents' ? 'Recent Events (4 weeks)' :
                  name === 'totalEvents' ? 'Total Events' : name
                ]}
                labelFormatter={(label) => {
                  const project = chartData.activityTimeline.find(p => p.name === label);
                  return project ? `Project: ${project.name}\nRecent Events (4 weeks): ${project.recentEvents}\nTotal Events: ${project.totalEvents}\nTotal Cost: $${project.cost.toLocaleString()}` : label;
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
                stroke={COLORS[9]}
                strokeWidth={3}
                name="Recent Events (4 weeks)"
                dot={{ fill: COLORS[9], strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="totalEvents"
                stroke={COLORS[10]}
                strokeWidth={3}
                name="Total Events"
                dot={{ fill: COLORS[10], strokeWidth: 2, r: 4 }}
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
            {data.reduce((sum, project) => sum + project.totalUsers, 0).toLocaleString()}
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
    </Card>
  )
}
