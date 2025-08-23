'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { UserExtendedModel } from '@/types'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  Calendar, 
  Users, 
  Building2, 
  FolderOpen, 
  Layers, 
  DollarSign, 
  MessageSquare,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react'
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, startOfMonth, endOfMonth, eachMonthOfInterval, startOfYear, endOfYear, eachYearOfInterval, eachDayOfInterval, parseISO, isValid } from 'date-fns'

interface TimeSeriesAnalyticsProps {
  data: UserExtendedModel[]
  className?: string
}

interface TimeSeriesData {
  period: string
  periodStart: string
  periodEnd: string
  activeUsers: number
  activeBuildspaces: number
  totalPrompts: number
  totalCost: number
  organizationBreakdown: { [key: string]: number }
  projectBreakdown: { [key: string]: number }
  buildspaceBreakdown: { [key: string]: number }
}

type ViewType = 'activeUsers' | 'activeBuildspaces' | 'prompts' | 'cost'
type ChartType = 'line' | 'bar'
type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C']

export function WeeklyStatsAnalytics({ data, className = '' }: TimeSeriesAnalyticsProps) {
  const [activeView, setActiveView] = useState<ViewType>('activeUsers')
  const [chartType, setChartType] = useState<ChartType>('line')
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('daily')
  const [selectedOrganization, setSelectedOrganization] = useState<string>('all')
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [dataLimit, setDataLimit] = useState<number>(10)

  // Process data into time series format
  const timeSeriesData = useMemo((): TimeSeriesData[] => {
    if (!data.length) return []

    // Get date range from data
    const validDates = data
      .map(item => {
        try {
          return parseISO(item.date)
        } catch {
          return null
        }
      })
      .filter((date): date is Date => date !== null && isValid(date))

    if (validDates.length === 0) return []

    const minDate = new Date(Math.min(...validDates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...validDates.map(d => d.getTime())))

    // Generate periods based on selected time period
    let periods: Date[] = []
    let periodGenerator: (start: Date) => Date
    let periodEnd: (start: Date) => Date
    let formatPeriod: (start: Date, end: Date) => string

    switch (timePeriod) {
      case 'daily':
        periods = eachDayOfInterval({ start: minDate, end: maxDate })
        periodGenerator = (start) => start
        periodEnd = (start) => start
        formatPeriod = (start, end) => format(start, 'MMM dd, yyyy')
        break
      case 'weekly':
        periods = eachWeekOfInterval({ start: minDate, end: maxDate }, { weekStartsOn: 1 })
        periodGenerator = (start) => start
        periodEnd = (start) => endOfWeek(start, { weekStartsOn: 1 })
        formatPeriod = (start, end) => format(start, 'MMM dd') + ' - ' + format(end, 'MMM dd, yyyy')
        break
      case 'monthly':
        periods = eachMonthOfInterval({ start: minDate, end: maxDate })
        periodGenerator = (start) => startOfMonth(start)
        periodEnd = (start) => endOfMonth(start)
        formatPeriod = (start, end) => format(start, 'MMM yyyy')
        break
      case 'yearly':
        periods = eachYearOfInterval({ start: minDate, end: maxDate })
        periodGenerator = (start) => startOfYear(start)
        periodEnd = (start) => endOfYear(start)
        formatPeriod = (start, end) => format(start, 'yyyy')
        break
      case 'all':
        periods = [minDate]
        periodGenerator = (start) => minDate
        periodEnd = (start) => maxDate
        formatPeriod = (start, end) => 'All Time (' + format(start, 'MMM yyyy') + ' - ' + format(end, 'MMM yyyy') + ')'
        break
      default:
        periods = eachWeekOfInterval({ start: minDate, end: maxDate }, { weekStartsOn: 1 })
        periodGenerator = (start) => start
        periodEnd = (start) => endOfWeek(start, { weekStartsOn: 1 })
        formatPeriod = (start, end) => format(start, 'MMM dd') + ' - ' + format(end, 'MMM dd, yyyy')
    }

    return periods.map(periodStart => {
      const actualPeriodStart = periodGenerator(periodStart)
      const actualPeriodEnd = periodEnd(actualPeriodStart)
      const periodLabel = formatPeriod(actualPeriodStart, actualPeriodEnd)

      // Filter data for this period
      const periodData = data.filter(item => {
        try {
          const itemDate = parseISO(item.date)
          return isValid(itemDate) && itemDate >= actualPeriodStart && itemDate <= actualPeriodEnd
        } catch {
          return false
        }
      })

      // Apply organization and project filters
      const filteredPeriodData = periodData.filter(item => {
        const orgMatch = selectedOrganization === 'all' || item.domain === selectedOrganization
        const projectMatch = selectedProject === 'all' || item.projectName === selectedProject
        return orgMatch && projectMatch
      })

      // Calculate metrics based on daily activity
      // Group data by date to check daily activity
      const dailyData = filteredPeriodData.reduce((acc, item) => {
        const dateKey = item.date || ''
        if (dateKey && !acc[dateKey]) {
          acc[dateKey] = []
        }
        if (dateKey) {
          acc[dateKey].push(item)
        }
        return acc
      }, {} as { [date: string]: typeof filteredPeriodData })

      // Get all expected days in the period
      const expectedDays = eachDayOfInterval({ start: actualPeriodStart, end: actualPeriodEnd })
      const expectedDayKeys = expectedDays.map(day => format(day, 'yyyy-MM-dd'))

      // For daily view, we just need users active on that specific day
      if (timePeriod === 'daily') {
        const dayData = Object.values(dailyData)[0] || []
        const activeUsersSet = new Set(dayData.filter(item => Number(item.usageCount) > 0).map(item => item.email))
        const activeBuildspacesSet = new Set(
          dayData
            .filter(item => item.buildSpaceId && item.buildSpaceId !== 'N/A' && Number(item.usageCount) > 0)
            .map(item => item.buildSpaceId!)
        )
        
        var activeUsers = activeUsersSet.size
        var activeBuildspaces = activeBuildspacesSet.size
      } else {
        // For weekly/monthly/yearly: users must be active on ALL days of the period
        // Find unique users who had at least one prompt per day
        const activeUsersPerDay = expectedDayKeys.map(dayKey => {
          const dayData = dailyData[dayKey] || []
          return new Set(dayData.filter(item => Number(item.usageCount) > 0).map(item => item.email))
        })

        // Find unique buildspaces that had at least one prompt per day
        const activeBuildspacesPerDay = expectedDayKeys.map(dayKey => {
          const dayData = dailyData[dayKey] || []
          return new Set(
            dayData
              .filter(item => item.buildSpaceId && item.buildSpaceId !== 'N/A' && Number(item.usageCount) > 0)
              .map(item => item.buildSpaceId!)
          )
        })

        // Find users who were active on ALL days in the period
        const strictActiveUsers = new Set<string>()
        const strictActiveBuildspaces = new Set<string>()

        // Get all users who appear in the period
        const allUsersInPeriod = new Set<string>()
        const allBuildspacesInPeriod = new Set<string>()
        
        activeUsersPerDay.forEach(dayUsers => {
          dayUsers.forEach(user => allUsersInPeriod.add(user))
        })
        
        activeBuildspacesPerDay.forEach(dayBuildspaces => {
          dayBuildspaces.forEach(buildspace => allBuildspacesInPeriod.add(buildspace))
        })

        // Check each user: they must be active on ALL days
        allUsersInPeriod.forEach(user => {
          const activeDays = activeUsersPerDay.filter(dayUsers => dayUsers.has(user)).length
          if (activeDays === expectedDayKeys.length) {
            strictActiveUsers.add(user)
          }
        })

        // Check each buildspace: they must be active on ALL days
        allBuildspacesInPeriod.forEach(buildspace => {
          const activeDays = activeBuildspacesPerDay.filter(dayBuildspaces => dayBuildspaces.has(buildspace)).length
          if (activeDays === expectedDayKeys.length) {
            strictActiveBuildspaces.add(buildspace)
          }
        })

        var activeUsers = strictActiveUsers.size
        var activeBuildspaces = strictActiveBuildspaces.size
      }
      const totalPrompts = filteredPeriodData.reduce((sum, item) => sum + Number(item.usageCount), 0)
      const totalCost = filteredPeriodData.reduce((sum, item) => sum + Number(item.cost), 0)

      // Organization breakdown
      const organizationBreakdown: { [key: string]: number } = {}
      filteredPeriodData.forEach(item => {
        organizationBreakdown[item.domain] = (organizationBreakdown[item.domain] || 0) + Number(item.cost)
      })

      // Project breakdown
      const projectBreakdown: { [key: string]: number } = {}
      filteredPeriodData.forEach(item => {
        projectBreakdown[item.projectName] = (projectBreakdown[item.projectName] || 0) + Number(item.cost)
      })

      // Buildspace breakdown
      const buildspaceBreakdown: { [key: string]: number } = {}
      filteredPeriodData.forEach(item => {
        if (item.buildSpaceId && item.buildSpaceId !== 'N/A') {
          buildspaceBreakdown[item.buildSpaceId] = (buildspaceBreakdown[item.buildSpaceId] || 0) + Number(item.cost)
        }
      })

      return {
        period: periodLabel,
        periodStart: format(actualPeriodStart, 'yyyy-MM-dd'),
        periodEnd: format(actualPeriodEnd, 'yyyy-MM-dd'),
        activeUsers,
        activeBuildspaces,
        totalPrompts,
        totalCost,
        organizationBreakdown,
        projectBreakdown,
        buildspaceBreakdown
      }
    }).filter(period => period.activeUsers > 0 || period.activeBuildspaces > 0 || period.totalPrompts > 0 || period.totalCost > 0)
      .slice(dataLimit > 0 ? -dataLimit : 0) // Take last N periods, or all if dataLimit is 0
  }, [data, selectedOrganization, selectedProject, timePeriod, dataLimit])

  // Get unique organizations and projects for filters
  const organizations = useMemo(() => {
    const orgs = Array.from(new Set(data.map(item => item.domain))).sort()
    return orgs
  }, [data])

  const projects = useMemo(() => {
    const filteredData = selectedOrganization === 'all' 
      ? data 
      : data.filter(item => item.domain === selectedOrganization)
    const projs = Array.from(new Set(filteredData.map(item => item.projectName))).sort()
    return projs
  }, [data, selectedOrganization])

  // Prepare chart data based on active view
  const chartData = useMemo(() => {
    switch (activeView) {
      case 'activeUsers':
        return timeSeriesData.map(period => ({
          week: period.period,
          value: period.activeUsers,
          label: 'Active Users'
        }))
      case 'activeBuildspaces':
        return timeSeriesData.map(period => ({
          week: period.period,
          value: period.activeBuildspaces,
          label: 'Active Buildspaces'
        }))
      case 'prompts':
        return timeSeriesData.map(period => ({
          week: period.period,
          value: period.totalPrompts,
          label: 'Total Prompts'
        }))
      case 'cost':
        return timeSeriesData.map(period => ({
          week: period.period,
          value: period.totalCost,
          label: 'Total Cost ($)'
        }))
      default:
        return []
    }
  }, [timeSeriesData, activeView])

  // Prepare breakdown data for pie charts
  const breakdownData = useMemo(() => {
    const allBreakdowns = timeSeriesData.reduce((acc, period) => {
      let breakdown: { [key: string]: number } = {}
      
      switch (activeView) {
        case 'cost':
          breakdown = period.organizationBreakdown
          break
        case 'prompts':
          breakdown = period.projectBreakdown
          break
        case 'activeBuildspaces':
          breakdown = period.buildspaceBreakdown
          break
        default:
          breakdown = period.organizationBreakdown
      }

      Object.entries(breakdown).forEach(([key, value]) => {
        acc[key] = (acc[key] || 0) + value
      })
      return acc
    }, {} as { [key: string]: number })

    return Object.entries(allBreakdowns)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Top 10 items
  }, [timeSeriesData, activeView, chartType])

  const getViewDescription = (viewId: ViewType) => {
    switch (viewId) {
      case 'activeUsers':
        return timePeriod === 'daily' 
          ? 'Users with at least one prompt on this day'
          : `Users with at least one prompt on ALL days of each ${timePeriod.slice(0, -2)} period`
      case 'activeBuildspaces':
        return timePeriod === 'daily'
          ? 'Buildspaces with at least one prompt on this day'
          : `Buildspaces with at least one prompt on ALL days of each ${timePeriod.slice(0, -2)} period`
      case 'prompts':
        return 'Total usage count analysis'
      case 'cost':
        return 'Cost analysis across organization, project, buildspace'
      default:
        return ''
    }
  }

  const viewOptions = [
    {
      id: 'activeUsers' as const,
      label: 'Active Users',
      icon: Users,
      description: getViewDescription('activeUsers'),
      color: 'text-blue-600'
    },
    {
      id: 'activeBuildspaces' as const,
      label: 'Active Buildspaces',
      icon: Layers,
      description: getViewDescription('activeBuildspaces'),
      color: 'text-purple-600'
    },
    {
      id: 'prompts' as const,
      label: 'Prompts Analysis',
      icon: MessageSquare,
      description: getViewDescription('prompts'),
      color: 'text-green-600'
    },
    {
      id: 'cost' as const,
      label: 'Cost Analysis',
      icon: DollarSign,
      description: getViewDescription('cost'),
      color: 'text-red-600'
    }
  ]

  const chartTypeOptions = [
    { id: 'line' as const, label: 'Line Chart', icon: TrendingUp },
    { id: 'bar' as const, label: 'Bar Chart', icon: BarChart3 },
  ]

  const timePeriodOptions = [
    { id: 'daily' as const, label: 'Daily', description: 'Day-by-day analysis' },
    { id: 'weekly' as const, label: 'Weekly', description: 'Week-by-week analysis' },
    { id: 'monthly' as const, label: 'Monthly', description: 'Month-by-month analysis' },
    { id: 'yearly' as const, label: 'Yearly', description: 'Year-by-year analysis' },
    { id: 'all' as const, label: 'All Time', description: 'Complete time range analysis' },
  ]

  const getPeriodLabel = () => {
    switch (timePeriod) {
      case 'daily': return 'Daily'
      case 'weekly': return 'Weekly'
      case 'monthly': return 'Monthly'
      case 'yearly': return 'Yearly'
      case 'all': return 'All Time'
      default: return 'Daily'
    }
  }

  const renderChart = () => {
    // Calculate dynamic width based on number of data points and time period
    const getChartWidth = () => {
      const dataPoints = chartData.length
      const minWidth = 800 // Minimum width for readability
      
      // Calculate width based on time period and data points
      let baseWidth = minWidth
      
      switch (timePeriod) {
        case 'daily':
          // For daily data, we need more space per point
          baseWidth = Math.max(minWidth, dataPoints * 60)
          break
        case 'weekly':
          // Weekly data needs moderate spacing
          baseWidth = Math.max(minWidth, dataPoints * 80)
          break
        case 'monthly':
          // Monthly data can be more compact
          baseWidth = Math.max(minWidth, dataPoints * 100)
          break
        case 'yearly':
          // Yearly data can be most compact
          baseWidth = Math.max(minWidth, dataPoints * 120)
          break
        case 'all':
          // All time view should fit in container
          baseWidth = minWidth
          break
        default:
          baseWidth = Math.max(minWidth, dataPoints * 80)
      }
      
      return baseWidth
    }

    const chartWidth = getChartWidth()
    const needsScroll = chartWidth > 800

    if (chartType === 'bar') {
      return (
        <div className={`w-full ${needsScroll ? 'overflow-x-auto' : ''}`}>
          <div style={{ width: needsScroll ? `${chartWidth}px` : '100%', minWidth: '100%' }}>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="week" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                  interval={0}
                />
                <YAxis 
                  tickFormatter={(value) => {
                    if (activeView === 'cost') {
                      return `$${value}`
                    }
                    return value.toLocaleString()
                  }}
                />
                <Tooltip 
                  formatter={(value: number) => {
                    if (activeView === 'cost') {
                      return [`$${value.toFixed(2)}`, chartData[0]?.label || 'Value']
                    }
                    return [value.toLocaleString(), chartData[0]?.label || 'Value']
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="value" 
                  fill="#8884d8" 
                  name={chartData[0]?.label || 'Value'}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {needsScroll && (
            <div className="text-xs text-gray-500 mt-2 text-center">
              ← Scroll horizontally to view all data points →
            </div>
          )}
        </div>
      )
    }

    // Default to line chart
    return (
      <div className={`w-full ${needsScroll ? 'overflow-x-auto' : ''}`}>
        <div style={{ width: needsScroll ? `${chartWidth}px` : '100%', minWidth: '100%' }}>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="week" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
                interval={0}
              />
              <YAxis 
                tickFormatter={(value) => {
                  if (activeView === 'cost') {
                    return `$${value}`
                  }
                  return value.toLocaleString()
                }}
              />
              <Tooltip 
                formatter={(value: number) => {
                  if (activeView === 'cost') {
                    return [`$${value.toFixed(2)}`, chartData[0]?.label || 'Value']
                  }
                  return [value.toLocaleString(), chartData[0]?.label || 'Value']
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ r: 4 }}
                name={chartData[0]?.label || 'Value'}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {needsScroll && (
          <div className="text-xs text-gray-500 mt-2 text-center">
            ← Scroll horizontally to view all data points →
          </div>
        )}
      </div>
    )
  }

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalPeriods = timeSeriesData.length
    
    // Calculate unique users and buildspaces from the filtered time series data only
    // This ensures the summary respects the "Last N Periods" filter
    const uniqueUsersInFilteredPeriods = new Set<string>()
    const uniqueBuildspacesInFilteredPeriods = new Set<string>()
    
    // Get the date range from the filtered time series data
    const filteredDateRange = timeSeriesData.length > 0 ? {
      start: timeSeriesData[0].periodStart,
      end: timeSeriesData[timeSeriesData.length - 1].periodEnd
    } : null
    
    // Filter original data to match the time series date range and other filters
    const filteredData = data.filter(item => {
      const orgMatch = selectedOrganization === 'all' || item.domain === selectedOrganization
      const projectMatch = selectedProject === 'all' || item.projectName === selectedProject
      
      // Also filter by the date range of the filtered time series data
      let dateMatch = true
      if (filteredDateRange) {
        try {
          const itemDate = parseISO(item.date)
          const startDate = parseISO(filteredDateRange.start)
          const endDate = parseISO(filteredDateRange.end)
          dateMatch = isValid(itemDate) && itemDate >= startDate && itemDate <= endDate
        } catch {
          dateMatch = false
        }
      }
      
      return orgMatch && projectMatch && dateMatch
    })
    
    // Calculate unique users and buildspaces from the filtered data
    const uniqueActiveUsers = new Set(filteredData.map(item => item.email)).size
    const uniqueActiveBuildspaces = new Set(
      filteredData
        .filter(item => item.buildSpaceId && item.buildSpaceId !== 'N/A')
        .map(item => item.buildSpaceId)
    ).size
    
    // Calculate averages based on filtered time series data
    const avgActiveUsers = totalPeriods > 0 ? timeSeriesData.reduce((sum, period) => sum + period.activeUsers, 0) / totalPeriods : 0
    const avgActiveBuildspaces = totalPeriods > 0 ? timeSeriesData.reduce((sum, period) => sum + period.activeBuildspaces, 0) / totalPeriods : 0
    const totalPrompts = timeSeriesData.reduce((sum, period) => sum + period.totalPrompts, 0)
    const totalCost = timeSeriesData.reduce((sum, period) => sum + period.totalCost, 0)
    
    // Calculate period averages for prompts and cost
    const avgPeriodPrompts = totalPeriods > 0 ? totalPrompts / totalPeriods : 0
    const avgPeriodCost = totalPeriods > 0 ? totalCost / totalPeriods : 0
    
    const peakPeriod = timeSeriesData.length > 0 ? timeSeriesData.reduce((peak, period) => {
      const currentValue = activeView === 'activeUsers' ? period.activeUsers :
                          activeView === 'activeBuildspaces' ? period.activeBuildspaces :
                          activeView === 'prompts' ? period.totalPrompts : period.totalCost
      const peakValue = activeView === 'activeUsers' ? peak.activeUsers :
                       activeView === 'activeBuildspaces' ? peak.activeBuildspaces :
                       activeView === 'prompts' ? peak.totalPrompts : peak.totalCost
      return currentValue > peakValue ? period : peak
    }, timeSeriesData[0]) : { period: 'N/A', activeUsers: 0, activeBuildspaces: 0, totalPrompts: 0, totalCost: 0 }

    return {
      totalPeriods,
      uniqueActiveUsers,
      uniqueActiveBuildspaces,
      avgActiveUsers: Math.round(avgActiveUsers),
      avgActiveBuildspaces: Math.round(avgActiveBuildspaces),
      totalPrompts,
      totalCost,
      avgPeriodPrompts: Math.round(avgPeriodPrompts),
      avgPeriodCost,
      peakPeriod: peakPeriod?.period || 'N/A'
    }
  }, [timeSeriesData, activeView, data, selectedOrganization, selectedProject])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Activity className="h-6 w-6 mr-2 text-blue-600" />
              {getPeriodLabel()} Statistics Analytics
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Analyze {timePeriod === 'all' ? 'complete time range' : timePeriod} trends across users, projects, and organizations
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Building2 className="h-4 w-4 mr-2 text-blue-600" />
              Organization Filter
            </label>
            <div className="relative">
              <select
                value={selectedOrganization}
                onChange={(e) => {
                  setSelectedOrganization(e.target.value)
                  setSelectedProject('all') // Reset project filter when org changes
                }}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer"
              >
                <option value="all" className="font-medium">🏢 All Organizations</option>
                {organizations.map(org => (
                  <option key={org} value={org} className="font-medium">🏢 {org}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {selectedOrganization === 'all' ? `${organizations.length} organizations available` : `Selected: ${selectedOrganization}`}
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <FolderOpen className="h-4 w-4 mr-2 text-green-600" />
              Project Filter
            </label>
            <div className="relative">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm hover:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 appearance-none cursor-pointer"
              >
                <option value="all" className="font-medium">📁 All Projects</option>
                {projects.map(project => (
                  <option key={project} value={project} className="font-medium">📁 {project}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {selectedProject === 'all' ? `${projects.length} projects available` : `Selected: ${selectedProject}`}
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Calendar className="h-4 w-4 mr-2 text-purple-600" />
              Show Last N Periods
            </label>
            <div className="relative">
              <select
                value={dataLimit}
                onChange={(e) => setDataLimit(Number(e.target.value))}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 appearance-none cursor-pointer"
              >
                <option value={10} className="font-medium">📊 Last 10</option>
                <option value={25} className="font-medium">📊 Last 25</option>
                <option value={50} className="font-medium">📊 Last 50</option>
                <option value={100} className="font-medium">📊 Last 100</option>
                <option value={0} className="font-medium">📊 All Data</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {dataLimit === 0 ? 'Showing all available data' : `Showing last ${dataLimit} periods`}
            </p>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-lg font-bold text-blue-600">{summaryStats.totalPeriods}</div>
            <div className="text-xs text-blue-800">Total Periods</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-lg font-bold text-green-600">{summaryStats.uniqueActiveUsers}</div>
            <div className="text-xs text-green-800">Unique Users</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-lg font-bold text-purple-600">{summaryStats.uniqueActiveBuildspaces}</div>
            <div className="text-xs text-purple-800">Unique Buildspaces</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <div className="text-lg font-bold text-orange-600">{summaryStats.totalPrompts.toLocaleString()}</div>
            <div className="text-xs text-orange-800">Total Prompts</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <div className="text-lg font-bold text-red-600">${summaryStats.totalCost.toFixed(2)}</div>
            <div className="text-xs text-red-800">Total Cost</div>
          </div>
        </div>

        {/* Period Averages */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-teal-50 p-4 rounded-lg text-center">
            <div className="text-lg font-bold text-teal-600">{summaryStats.avgActiveUsers}</div>
            <div className="text-xs text-teal-800">Avg Users</div>
          </div>
          <div className="bg-violet-50 p-4 rounded-lg text-center">
            <div className="text-lg font-bold text-violet-600">{summaryStats.avgActiveBuildspaces}</div>
            <div className="text-xs text-violet-800">Avg Buildspaces</div>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg text-center">
            <div className="text-lg font-bold text-amber-600">{summaryStats.avgPeriodPrompts.toLocaleString()}</div>
            <div className="text-xs text-amber-800">Avg Prompts</div>
          </div>
          <div className="bg-rose-50 p-4 rounded-lg text-center">
            <div className="text-lg font-bold text-rose-600">${summaryStats.avgPeriodCost.toFixed(2)}</div>
            <div className="text-xs text-rose-800">Avg Cost</div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg text-center">
            <div className="text-xs font-bold text-indigo-600">{summaryStats.peakPeriod}</div>
            <div className="text-xs text-indigo-800">Peak Period</div>
          </div>
        </div>

        {/* Time Period Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Period
          </label>
          <div className="flex flex-wrap gap-2">
            {timePeriodOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setTimePeriod(option.id)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timePeriod === option.id
                    ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                }`}
                title={option.description}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {viewOptions.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.id}
                onClick={() => setActiveView(option.id)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === option.id
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                <Icon className={`h-4 w-4 mr-2 ${option.color}`} />
                {option.label}
              </button>
            )
          })}
        </div>

        {/* Chart Type Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex gap-2">
            {chartTypeOptions.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.id}
                  onClick={() => setChartType(option.id)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    chartType === option.id
                      ? 'bg-purple-100 text-purple-700 border border-purple-300'
                      : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {option.label}
                </button>
              )
            })}
          </div>
          
          {/* View Description */}
          <div className="bg-blue-100 border border-blue-200 rounded-lg p-2 flex-1 sm:max-w-lg">
            <p className="text-sm text-blue-800">
              <span className="font-semibold text-blue-900">
                {viewOptions.find(v => v.id === activeView)?.label}:
              </span>
              <span className="ml-2">
                {viewOptions.find(v => v.id === activeView)?.description}
              </span>
            </p>
          </div>
        </div>
      </Card>

      {/* Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {viewOptions.find(v => v.id === activeView)?.label} - {getPeriodLabel()} Trend
          </h3>
          <div className="text-sm text-gray-500">
            {timeSeriesData.length} periods of data
            {dataLimit > 0 && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                Showing last {dataLimit}
              </span>
            )}
          </div>
        </div>
        
        {timeSeriesData.length > 0 ? (
          <div className="w-full">
            {renderChart()}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No data available for the selected filters</p>
              <p className="text-sm">Try adjusting your organization or project filters</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
