'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
  totalAgenticTasks: number
  organizationBreakdown: { [key: string]: number }
  projectBreakdown: { [key: string]: number }
  buildspaceBreakdown: { [key: string]: number }
  agenticTaskBreakdown: { [key: string]: number }
}

type ViewType = 'activeUsers' | 'activeBuildspaces' | 'prompts' | 'cost' | 'agenticTasks'
type ChartType = 'line' | 'bar'
type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C']

export function WeeklyStatsAnalytics({ data, className = '' }: TimeSeriesAnalyticsProps) {
  const [activeView, setActiveView] = useState<ViewType>('activeUsers')
  const [chartType, setChartType] = useState<ChartType>('line')
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('daily')
  const [selectedOrganization, setSelectedOrganization] = useState<string>('all')
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedEmail, setSelectedEmail] = useState<string>('all')
  const [dataLimit, setDataLimit] = useState<number>(10)
  
  // Search states for dropdowns
  const [orgSearchTerm, setOrgSearchTerm] = useState<string>('')
  const [projectSearchTerm, setProjectSearchTerm] = useState<string>('')
  const [emailSearchTerm, setEmailSearchTerm] = useState<string>('')
  const [showOrgDropdown, setShowOrgDropdown] = useState<boolean>(false)
  const [showProjectDropdown, setShowProjectDropdown] = useState<boolean>(false)
  const [showEmailDropdown, setShowEmailDropdown] = useState<boolean>(false)
  const [showPeriodsDropdown, setShowPeriodsDropdown] = useState<boolean>(false)

  // Debounced search terms for better performance
  const [debouncedOrgSearch, setDebouncedOrgSearch] = useState<string>('')
  const [debouncedProjectSearch, setDebouncedProjectSearch] = useState<string>('')
  const [debouncedEmailSearch, setDebouncedEmailSearch] = useState<string>('')

  // Debounce search terms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedOrgSearch(orgSearchTerm), 300)
    return () => clearTimeout(timer)
  }, [orgSearchTerm])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedProjectSearch(projectSearchTerm), 300)
    return () => clearTimeout(timer)
  }, [projectSearchTerm])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedEmailSearch(emailSearchTerm), 300)
    return () => clearTimeout(timer)
  }, [emailSearchTerm])

  // Optimized event handlers
  const handleOrgSelection = useCallback((org: string) => {
    setSelectedOrganization(org)
    setSelectedProject('all')
    setSelectedEmail('all')
    setShowOrgDropdown(false)
    setOrgSearchTerm('')
  }, [])

  const handleProjectSelection = useCallback((project: string) => {
    setSelectedProject(project)
    setSelectedEmail('all')
    setShowProjectDropdown(false)
    setProjectSearchTerm('')
  }, [])

  const handleEmailSelection = useCallback((email: string) => {
    setSelectedEmail(email)
    setShowEmailDropdown(false)
    setEmailSearchTerm('')
  }, [])

  const handlePeriodsSelection = useCallback((periods: number) => {
    setDataLimit(periods)
    setShowPeriodsDropdown(false)
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.dropdown-container')) {
        setShowOrgDropdown(false)
        setShowProjectDropdown(false)
        setShowEmailDropdown(false)
        setShowPeriodsDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Process data into time series format
  const timeSeriesData = useMemo((): TimeSeriesData[] => {
    if (!data.length) return []

    // Get date range from ALL data (not filtered by org/project/email)
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

    // Generate ALL periods based on selected time period from complete dataset
    let allPeriods: Date[] = []
    let periodGenerator: (start: Date) => Date
    let periodEnd: (start: Date) => Date
    let formatPeriod: (start: Date, end: Date) => string

    switch (timePeriod) {
      case 'daily':
        allPeriods = eachDayOfInterval({ start: minDate, end: maxDate })
        periodGenerator = (start) => start
        periodEnd = (start) => start
        formatPeriod = (start, end) => format(start, 'MMM dd, yyyy')
        break
      case 'weekly':
        allPeriods = eachWeekOfInterval({ start: minDate, end: maxDate }, { weekStartsOn: 1 })
        periodGenerator = (start) => start
        periodEnd = (start) => endOfWeek(start, { weekStartsOn: 1 })
        formatPeriod = (start, end) => format(start, 'MMM dd') + ' - ' + format(end, 'MMM dd, yyyy')
        break
      case 'monthly':
        allPeriods = eachMonthOfInterval({ start: minDate, end: maxDate })
        periodGenerator = (start) => startOfMonth(start)
        periodEnd = (start) => endOfMonth(start)
        formatPeriod = (start, end) => format(start, 'MMM yyyy')
        break
      case 'yearly':
        allPeriods = eachYearOfInterval({ start: minDate, end: maxDate })
        periodGenerator = (start) => startOfYear(start)
        periodEnd = (start) => endOfYear(start)
        formatPeriod = (start, end) => format(start, 'yyyy')
        break
      case 'all':
        allPeriods = [minDate]
        periodGenerator = (start) => minDate
        periodEnd = (start) => maxDate
        formatPeriod = (start, end) => 'All (' + format(start, 'MMM yyyy') + ' - ' + format(end, 'MMM yyyy') + ')'
        break
      default:
        allPeriods = eachWeekOfInterval({ start: minDate, end: maxDate }, { weekStartsOn: 1 })
        periodGenerator = (start) => start
        periodEnd = (start) => endOfWeek(start, { weekStartsOn: 1 })
        formatPeriod = (start, end) => format(start, 'MMM dd') + ' - ' + format(end, 'MMM dd, yyyy')
    }

    // Apply "Last N Periods" filter FIRST to get the desired time range
    const selectedPeriods = dataLimit > 0 ? allPeriods.slice(-dataLimit) : allPeriods

    return selectedPeriods.map(periodStart => {
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

      // Apply organization, project, and email filters
      const filteredPeriodData = periodData.filter(item => {
        const orgMatch = selectedOrganization === 'all' || item.domain === selectedOrganization
        const projectMatch = selectedProject === 'all' || item.projectName === selectedProject
        const emailMatch = selectedEmail === 'all' || item.email === selectedEmail
        return orgMatch && projectMatch && emailMatch
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

      // For all time periods: users/buildspaces active at least once in the period
      const activeUsersSet = new Set(
        filteredPeriodData
          .filter(item => Number(item.usageCount) > 0)
          .map(item => item.email)
      )
      
      const activeBuildspacesSet = new Set(
        filteredPeriodData
          .filter(item => item.buildSpaceId && item.buildSpaceId !== 'N/A' && Number(item.usageCount) > 0)
          .map(item => item.buildSpaceId!)
      )
      
      var activeUsers = activeUsersSet.size
      var activeBuildspaces = activeBuildspacesSet.size
      const totalPrompts = filteredPeriodData.reduce((sum, item) => sum + Number(item.usageCount), 0)
      const totalCost = filteredPeriodData.reduce((sum, item) => sum + Number(item.cost), 0)
      
      // Calculate total unique agentic tasks
      const uniqueAgenticTasks = new Set(
        filteredPeriodData
          .filter(item => item.taskId && item.taskId !== 'N/A')
          .map(item => item.taskId!)
      )
      const totalAgenticTasks = uniqueAgenticTasks.size

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

      // Agentic Task breakdown
      const agenticTaskBreakdown: { [key: string]: number } = {}
      filteredPeriodData.forEach(item => {
        if (item.taskId && item.taskId !== 'N/A') {
          agenticTaskBreakdown[item.taskId] = (agenticTaskBreakdown[item.taskId] || 0) + Number(item.cost)
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
        totalAgenticTasks,
        organizationBreakdown,
        projectBreakdown,
        buildspaceBreakdown,
        agenticTaskBreakdown
      }
    }) // No need to filter or slice again since we already applied "Last N Periods" filter above
  }, [data, selectedOrganization, selectedProject, selectedEmail, timePeriod, dataLimit])

  // Get unique organizations, projects, and emails for filters - optimized with caching
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

  const emails = useMemo(() => {
    let filteredData = data
    if (selectedOrganization !== 'all') {
      filteredData = filteredData.filter(item => item.domain === selectedOrganization)
    }
    if (selectedProject !== 'all') {
      filteredData = filteredData.filter(item => item.projectName === selectedProject)
    }
    const emailList = Array.from(new Set(filteredData.map(item => item.email))).sort()
    return emailList
  }, [data, selectedOrganization, selectedProject])

  // Optimized filtered options with debounced search and limited results
  const filteredOrganizations = useMemo(() => {
    if (!orgSearchTerm) return organizations.slice(0, 50) // Limit initial results
    const searchLower = orgSearchTerm.toLowerCase()
    return organizations
      .filter(org => org && typeof org === 'string' && org.toLowerCase().includes(searchLower))
      .slice(0, 15) // Limit search results
  }, [organizations, orgSearchTerm])

  const filteredProjects = useMemo(() => {
    if (!projectSearchTerm) return projects.slice(0, 50) // Limit initial results
    const searchLower = projectSearchTerm.toLowerCase()
    return projects
      .filter(project => project && typeof project === 'string' && project.toLowerCase().includes(searchLower))
      .slice(0, 15) // Limit search results
  }, [projects, projectSearchTerm])

  const filteredEmails = useMemo(() => {
    if (!emailSearchTerm) return emails.slice(0, 50) // Limit initial results
    const searchLower = emailSearchTerm.toLowerCase()
    return emails
      .filter(email => email && typeof email === 'string' && email.toLowerCase().includes(searchLower))
      .slice(0, 15) // Limit search results
  }, [emails, emailSearchTerm])

  // Prepare chart data based on active view with email mapping
  const chartData = useMemo(() => {
    return timeSeriesData.map(period => {
      // Get the date range for this period
      const periodStart = parseISO(period.periodStart)
      const periodEnd = parseISO(period.periodEnd)
      
      // Filter data for this specific period
      const periodData = data.filter(item => {
        try {
          const itemDate = parseISO(item.date)
          return isValid(itemDate) && itemDate >= periodStart && itemDate <= periodEnd
        } catch {
          return false
        }
      }).filter(item => {
        // Apply current filters
        const orgMatch = selectedOrganization === 'all' || item.domain === selectedOrganization
        const projectMatch = selectedProject === 'all' || item.projectName === selectedProject
        const emailMatch = selectedEmail === 'all' || item.email === selectedEmail
        return orgMatch && projectMatch && emailMatch
      })

      // Create email mappings based on analysis type
      let emailMapping: string[] = []
      let value = 0
      let label = ''

      switch (activeView) {
        case 'activeUsers':
          // Map emails of users who were active in this period (consistent with new logic)
          const activeUserEmails = new Set<string>()
          periodData.filter(item => Number(item.usageCount) > 0).forEach(item => {
            activeUserEmails.add(item.email)
          })
          emailMapping = Array.from(activeUserEmails)
          value = period.activeUsers
          label = 'Active Users'
          break

        case 'activeBuildspaces':
          // Map emails with their unique buildspace count for this period
          const userBuildspaceMap = new Map<string, Set<string>>()
          periodData.filter(item => item.buildSpaceId && item.buildSpaceId !== 'N/A' && Number(item.usageCount) > 0)
            .forEach(item => {
              if (!userBuildspaceMap.has(item.email)) {
                userBuildspaceMap.set(item.email, new Set())
              }
              userBuildspaceMap.get(item.email)!.add(item.buildSpaceId!)
            })
          
          // Sort by buildspace count and format with counts
          emailMapping = Array.from(userBuildspaceMap.entries())
            .sort((a, b) => b[1].size - a[1].size)
            .map(([email, buildspaces]) => `${email} (${buildspaces.size} buildspaces)`)
          value = period.activeBuildspaces
          label = 'Active Buildspaces'
          break

        case 'prompts':
          // Map emails with their usage count sum
          const promptEmailMap = new Map<string, number>()
          periodData.forEach(item => {
            const usageCount = Number(item.usageCount) || 0
            if (usageCount > 0) {
              promptEmailMap.set(item.email, (promptEmailMap.get(item.email) || 0) + usageCount)
            }
          })
          
          // Sort by usage count and get emails
          emailMapping = Array.from(promptEmailMap.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([email, count]) => `${email} (${count} prompts)`)
          value = period.totalPrompts
          label = 'Total Prompts'
          break

        case 'cost':
          // Map emails with their cost sum
          const costEmailMap = new Map<string, number>()
          periodData.forEach(item => {
            const cost = Number(item.cost) || 0
            if (cost > 0) {
              costEmailMap.set(item.email, (costEmailMap.get(item.email) || 0) + cost)
            }
          })
          
          // Sort by cost and get emails
          emailMapping = Array.from(costEmailMap.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([email, cost]) => `${email} ($${cost.toFixed(2)})`)
          value = period.totalCost
          label = 'Total Cost ($)'
          break

        case 'agenticTasks':
          // Map emails with unique task IDs
          const taskEmailMap = new Map<string, Set<string>>()
          periodData.filter(item => item.taskId && item.taskId !== 'N/A')
            .forEach(item => {
              if (!taskEmailMap.has(item.email)) {
                taskEmailMap.set(item.email, new Set())
              }
              taskEmailMap.get(item.email)!.add(item.taskId!)
            })
          
          // Sort by unique task count and get emails
          emailMapping = Array.from(taskEmailMap.entries())
            .sort((a, b) => b[1].size - a[1].size)
            .map(([email, tasks]) => `${email} (${tasks.size} tasks)`)
          value = period.totalAgenticTasks
          label = 'Agentic Tasks'
          break

        default:
          emailMapping = []
          value = 0
          label = 'Value'
      }

      return {
        week: period.period,
        value,
        label,
        emailMapping,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd
      }
    })
  }, [timeSeriesData, activeView, data, selectedOrganization, selectedProject, selectedEmail, timePeriod])

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
        case 'agenticTasks':
          breakdown = period.agenticTaskBreakdown
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
          : `Users with at least one prompt anywhere in each ${timePeriod.slice(0, -2)} period`
      case 'activeBuildspaces':
        return timePeriod === 'daily'
          ? 'Buildspaces with at least one prompt on this day'
          : `Buildspaces with at least one prompt anywhere in each ${timePeriod.slice(0, -2)} period`
      case 'prompts':
        return 'Total usage count analysis'
      case 'cost':
        return 'Cost analysis across organization, project, buildspace'
      case 'agenticTasks':
        return 'Unique agentic task analysis with cost breakdown by taskId'
      default:
        return ''
    }
  }

  const viewOptions = [
    {
      id: 'activeUsers' as const,
      label: 'User',
      icon: Users,
      description: getViewDescription('activeUsers'),
      color: 'text-blue-600'
    },
    {
      id: 'activeBuildspaces' as const,
      label: 'Buildspace',
      icon: Layers,
      description: getViewDescription('activeBuildspaces'),
      color: 'text-purple-600'
    },
    {
      id: 'prompts' as const,
      label: 'Prompt',
      icon: MessageSquare,
      description: getViewDescription('prompts'),
      color: 'text-green-600'
    },
    {
      id: 'cost' as const,
      label: 'Cost',
      icon: DollarSign,
      description: getViewDescription('cost'),
      color: 'text-red-600'
    },
    {
      id: 'agenticTasks' as const,
      label: 'Agentic Task',
      icon: Activity,
      description: getViewDescription('agenticTasks'),
      color: 'text-indigo-600'
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
    { id: 'all' as const, label: 'All', description: 'Complete time range analysis' },
  ]

  const getPeriodLabel = () => {
    switch (timePeriod) {
      case 'daily': return 'Daily'
      case 'weekly': return 'Weekly'
      case 'monthly': return 'Monthly'
      case 'yearly': return 'Yearly'
      case 'all': return 'All'
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
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length > 0) {
                      const data = payload[0].payload;
                      const emailMapping = data.emailMapping || [];
                      
                      return (
                        <div 
                          className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-sm max-w-sm"
                          style={{ 
                            pointerEvents: 'none',
                            userSelect: 'none'
                          }}
                        >
                          <div className="font-semibold text-gray-900 mb-2">{label}</div>
                          <div className="text-blue-600 mb-2">
                            <span className="font-medium">{data.label}:</span> {
                              activeView === 'cost' 
                                ? `$${data.value.toFixed(2)}` 
                                : data.value.toLocaleString()
                            }
                          </div>
                          {emailMapping.length > 0 && (
                            <div className="text-gray-600">
                              <div className="font-medium text-gray-700 mb-1">
                                {activeView === 'activeUsers' ? 'Active Users:' :
                                 activeView === 'activeBuildspaces' ? 'Users with Buildspaces:' :
                                 activeView === 'prompts' ? 'Users by Prompt Count:' :
                                 activeView === 'cost' ? 'Users by Cost:' :
                                 'Users by Task Count:'}
                              </div>
                              <div className="text-xs space-y-1">
                                {emailMapping.slice(0, 8).map((email: string, index: number) => (
                                  <div key={index} className="truncate">
                                    {email}
                                  </div>
                                ))}
                                {emailMapping.length > 8 && (
                                  <div className="text-gray-500 italic">
                                    ... and {emailMapping.length - 8} more users
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={false}
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
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length > 0) {
                    const data = payload[0].payload;
                    const emailMapping = data.emailMapping || [];
                    
                    return (
                      <div 
                        className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-sm max-w-sm"
                        style={{ 
                          pointerEvents: 'none',
                          userSelect: 'none'
                        }}
                      >
                        <div className="font-semibold text-gray-900 mb-2">{label}</div>
                        <div className="text-blue-600 mb-2">
                          <span className="font-medium">{data.label}:</span> {
                            activeView === 'cost' 
                              ? `$${data.value.toFixed(2)}` 
                              : data.value.toLocaleString()
                          }
                        </div>
                        {emailMapping.length > 0 && (
                          <div className="text-gray-600">
                            <div className="font-medium text-gray-700 mb-1">
                              {activeView === 'activeUsers' ? 'Active Users:' :
                               activeView === 'activeBuildspaces' ? 'Users with Buildspaces:' :
                               activeView === 'prompts' ? 'Users by Prompt Count:' :
                               activeView === 'cost' ? 'Users by Cost:' :
                               'Users by Task Count:'}
                            </div>
                            <div className="text-xs space-y-1">
                              {emailMapping.slice(0, 8).map((email: string, index: number) => (
                                <div key={index} className="truncate">
                                  {email}
                                </div>
                              ))}
                              {emailMapping.length > 8 && (
                                <div className="text-gray-500 italic">
                                  ... and {emailMapping.length - 8} more users
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={false}
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
    
    // Calculate unique agentic tasks from the filtered data to avoid double counting
    const uniqueAgenticTasksInRange = new Set(
      filteredData
        .filter(item => item.taskId && item.taskId !== 'N/A')
        .map(item => item.taskId!)
    )
    const totalAgenticTasks = uniqueAgenticTasksInRange.size
    
    // Calculate period averages for prompts, cost, and agentic tasks
    const avgPeriodPrompts = totalPeriods > 0 ? totalPrompts / totalPeriods : 0
    const avgPeriodCost = totalPeriods > 0 ? totalCost / totalPeriods : 0
    const avgAgenticTasks = totalPeriods > 0 ? totalAgenticTasks / totalPeriods : 0
    
    const peakPeriod = timeSeriesData.length > 0 ? timeSeriesData.reduce((peak, period) => {
      const currentValue = activeView === 'activeUsers' ? period.activeUsers :
                          activeView === 'activeBuildspaces' ? period.activeBuildspaces :
                          activeView === 'prompts' ? period.totalPrompts : 
                          activeView === 'agenticTasks' ? period.totalAgenticTasks : period.totalCost
      const peakValue = activeView === 'activeUsers' ? peak.activeUsers :
                       activeView === 'activeBuildspaces' ? peak.activeBuildspaces :
                       activeView === 'prompts' ? peak.totalPrompts : 
                       activeView === 'agenticTasks' ? peak.totalAgenticTasks : peak.totalCost
      return currentValue > peakValue ? period : peak
    }, timeSeriesData[0]) : { period: 'N/A', activeUsers: 0, activeBuildspaces: 0, totalPrompts: 0, totalCost: 0, totalAgenticTasks: 0 }

    return {
      totalPeriods,
      uniqueActiveUsers,
      uniqueActiveBuildspaces,
      avgActiveUsers: Math.round(avgActiveUsers),
      avgActiveBuildspaces: Math.round(avgActiveBuildspaces),
      totalPrompts,
      totalCost,
      totalAgenticTasks,
      avgPeriodPrompts: Math.round(avgPeriodPrompts),
      avgPeriodCost,
      avgAgenticTasks: Math.round(avgAgenticTasks),
      peakPeriod: peakPeriod?.period || 'N/A'
    }
  }, [timeSeriesData, activeView, data, selectedOrganization, selectedProject])

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Improved Compact Header */}
      <Card className="p-3">
        {/* Title and Filters */}
        <div className="flex flex-col space-y-3">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-semibold text-gray-900">{getPeriodLabel()} Statistics Analytics</h2>
              <span className="text-sm text-gray-500">Analyze daily trends across users, projects, and organizations</span>
            </div>
          </div>
          
          {/* Filters Row */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Organization Filter */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Organization</span>
              <div className="relative dropdown-container">
                <input
                  type="text"
                  value={showOrgDropdown ? orgSearchTerm : (selectedOrganization === 'all' ? 'All Organizations' : selectedOrganization)}
                  onChange={(e) => {
                    setOrgSearchTerm(e.target.value)
                    setShowOrgDropdown(true)
                  }}
                  onFocus={() => {
                    setShowOrgDropdown(true)
                    setOrgSearchTerm('')
                  }}
                  placeholder="Search organizations..."
                  className="w-56 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                />
                {showOrgDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    <div className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100" onClick={() => handleOrgSelection('all')}>
                      <Building2 className="inline h-4 w-4 mr-2 text-blue-600" />
                      All Organizations
                      <span className="text-xs text-gray-500 ml-2">({organizations.length} available)</span>
                    </div>
                    {filteredOrganizations.map((org, index) => (
                      <div key={`org-${org}-${index}`} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm" onClick={() => handleOrgSelection(org)}>
                        <Building2 className="inline h-4 w-4 mr-2 text-blue-600" />
                        {org}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Project Filter */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <FolderOpen className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Project</span>
              <div className="relative dropdown-container">
                <input
                  type="text"
                  value={showProjectDropdown ? projectSearchTerm : (selectedProject === 'all' ? 'All Projects' : selectedProject)}
                  onChange={(e) => {
                    setProjectSearchTerm(e.target.value)
                    setShowProjectDropdown(true)
                  }}
                  onFocus={() => {
                    setShowProjectDropdown(true)
                    setProjectSearchTerm('')
                  }}
                  placeholder="Search projects..."
                  className="w-56 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer"
                />
                {showProjectDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    <div className="px-3 py-2 hover:bg-green-50 cursor-pointer text-sm border-b border-gray-100" onClick={() => handleProjectSelection('all')}>
                      <FolderOpen className="inline h-4 w-4 mr-2 text-green-600" />
                      All Projects
                      <span className="text-xs text-gray-500 ml-2">({projects.length} available)</span>
                    </div>
                    {filteredProjects.map((project, index) => (
                      <div key={`project-${project}-${index}`} className="px-3 py-2 hover:bg-green-50 cursor-pointer text-sm" onClick={() => handleProjectSelection(project)}>
                        <FolderOpen className="inline h-4 w-4 mr-2 text-green-600" />
                        {project}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Email Filter */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Users className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">Email</span>
              <div className="relative dropdown-container">
                <input
                  type="text"
                  value={showEmailDropdown ? emailSearchTerm : (selectedEmail === 'all' ? 'All Users' : selectedEmail)}
                  onChange={(e) => {
                    setEmailSearchTerm(e.target.value)
                    setShowEmailDropdown(true)
                  }}
                  onFocus={() => {
                    setShowEmailDropdown(true)
                    setEmailSearchTerm('')
                  }}
                  placeholder="Search users..."
                  className="w-56 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
                />
                {showEmailDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    <div className="px-3 py-2 hover:bg-orange-50 cursor-pointer text-sm border-b border-gray-100" onClick={() => handleEmailSelection('all')}>
                      <Users className="inline h-4 w-4 mr-2 text-orange-600" />
                      All Users
                      <span className="text-xs text-gray-500 ml-2">({emails.length} available)</span>
                    </div>
                    {filteredEmails.map((email, index) => (
                      <div key={`email-${email}-${index}`} className="px-3 py-2 hover:bg-orange-50 cursor-pointer text-sm" onClick={() => handleEmailSelection(email)}>
                        <Users className="inline h-4 w-4 mr-2 text-orange-600" />
                        {email}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Periods Filter */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Last N Period</span>
              <div className="relative dropdown-container">
                <input
                  type="text"
                  value={dataLimit === 0 ? 'All Periods' : `Last ${dataLimit}`}
                  readOnly
                  onClick={() => setShowPeriodsDropdown(!showPeriodsDropdown)}
                  className="w-56 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
                />
                {showPeriodsDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    <div className="px-3 py-2 hover:bg-purple-50 cursor-pointer text-sm border-b border-gray-100" onClick={() => handlePeriodsSelection(0)}>
                      <Calendar className="inline h-4 w-4 mr-2 text-purple-600" />
                      All Periods
                      <span className="text-xs text-gray-500 ml-2">(No limit)</span>
                    </div>
                    <div className="px-3 py-2 hover:bg-purple-50 cursor-pointer text-sm" onClick={() => handlePeriodsSelection(10)}>
                      <Calendar className="inline h-4 w-4 mr-2 text-purple-600" />
                      Last 10
                    </div>
                    <div className="px-3 py-2 hover:bg-purple-50 cursor-pointer text-sm" onClick={() => handlePeriodsSelection(25)}>
                      <Calendar className="inline h-4 w-4 mr-2 text-purple-600" />
                      Last 25
                    </div>
                    <div className="px-3 py-2 hover:bg-purple-50 cursor-pointer text-sm" onClick={() => handlePeriodsSelection(50)}>
                      <Calendar className="inline h-4 w-4 mr-2 text-purple-600" />
                      Last 50
                    </div>
                    <div className="px-3 py-2 hover:bg-purple-50 cursor-pointer text-sm" onClick={() => handlePeriodsSelection(60)}>
                      <Calendar className="inline h-4 w-4 mr-2 text-purple-600" />
                      Last 60
                    </div>
                    <div className="px-3 py-2 hover:bg-purple-50 cursor-pointer text-sm" onClick={() => handlePeriodsSelection(90)}>
                      <Calendar className="inline h-4 w-4 mr-2 text-purple-600" />
                      Last 90
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats Grid */}
        <div className="mt-4 grid grid-cols-3 md:grid-cols-6 lg:grid-cols-6 gap-2">
          <div className="bg-blue-50 p-2 rounded text-center border border-blue-100">
            <div className="text-base font-bold text-blue-600">{summaryStats.totalPeriods}</div>
            <div className="text-xs text-blue-800">Total Periods</div>
          </div>
          <div className="bg-green-50 p-2 rounded text-center border border-green-100">
            <div className="text-base font-bold text-green-600">{summaryStats.uniqueActiveUsers}</div>
            <div className="text-xs text-green-800">Unique Users</div>
          </div>
          <div className="bg-purple-50 p-2 rounded text-center border border-purple-100">
            <div className="text-base font-bold text-purple-600">{summaryStats.uniqueActiveBuildspaces}</div>
            <div className="text-xs text-purple-800">Unique Buildspaces</div>
          </div>
          <div className="bg-orange-50 p-2 rounded text-center border border-orange-100">
            <div className="text-base font-bold text-orange-600">{summaryStats.totalPrompts.toLocaleString()}</div>
            <div className="text-xs text-orange-800">Total Prompts</div>
          </div>
          <div className="bg-red-50 p-2 rounded text-center border border-red-100">
            <div className="text-base font-bold text-red-600">${summaryStats.totalCost.toFixed(2)}</div>
            <div className="text-xs text-red-800">Total Cost</div>
          </div>
          <div className="bg-indigo-50 p-2 rounded text-center border border-indigo-100">
            <div className="text-base font-bold text-indigo-600">{summaryStats.totalAgenticTasks}</div>
            <div className="text-xs text-indigo-800">Agentic Tasks</div>
          </div>
        </div>

        {/* Average Stats Grid */}
        <div className="mt-2 grid grid-cols-3 md:grid-cols-6 lg:grid-cols-6 gap-2">
          <div className="bg-slate-50 p-1.5 rounded text-center border border-slate-100">
            <div className="text-xs font-semibold text-slate-600">{summaryStats.peakPeriod.slice(0, 12)}...</div>
            <div className="text-xs text-slate-800">Peak Period</div>
          </div>
          <div className="bg-teal-50 p-1.5 rounded text-center border border-teal-100">
            <div className="text-xs font-semibold text-teal-600">{summaryStats.avgActiveUsers}</div>
            <div className="text-xs text-teal-800">Avg Users</div>
          </div>
          <div className="bg-violet-50 p-1.5 rounded text-center border border-violet-100">
            <div className="text-xs font-semibold text-violet-600">{summaryStats.avgActiveBuildspaces}</div>
            <div className="text-xs text-violet-800">Avg Buildspaces</div>
          </div>
          <div className="bg-amber-50 p-1.5 rounded text-center border border-amber-100">
            <div className="text-xs font-semibold text-amber-600">{summaryStats.avgPeriodPrompts.toLocaleString()}</div>
            <div className="text-xs text-amber-800">Avg Prompts</div>
          </div>
          <div className="bg-rose-50 p-1.5 rounded text-center border border-rose-100">
            <div className="text-xs font-semibold text-rose-600">${summaryStats.avgPeriodCost.toFixed(2)}</div>
            <div className="text-xs text-rose-800">Avg Cost</div>
          </div>
          <div className="bg-cyan-50 p-1.5 rounded text-center border border-cyan-100">
            <div className="text-xs font-semibold text-cyan-600">{summaryStats.avgAgenticTasks}</div>
            <div className="text-xs text-cyan-800">Avg Tasks</div>
          </div>
        </div>
      </Card>

      {/* Controls and Chart */}
      <Card className="p-4">
        {/* Control Bar */}
        <div className="flex items-center gap-6 mb-4 pb-3 border-b border-gray-200 min-w-0">
          {/* Time Period Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Time Period:</span>
            <div className="flex gap-1">
              {timePeriodOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setTimePeriod(option.id)}
                  className={`px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    timePeriod === option.id
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Analysis Type Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Analysis Type:</span>
            <div className="flex gap-1">
              {viewOptions.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.id}
                    onClick={() => setActiveView(option.id)}
                    className={`flex items-center px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      activeView === option.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {option.label.split(' ')[0]}
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* Chart Type Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Chart Type:</span>
            <div className="flex gap-1">
              {chartTypeOptions.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.id}
                    onClick={() => setChartType(option.id)}
                    className={`flex items-center px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      chartType === option.id
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {option.label.split(' ')[0]}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Chart Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {viewOptions.find(v => v.id === activeView)?.label} - {getPeriodLabel()} Trend
          </h3>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500">
              {timeSeriesData.length} periods
              {dataLimit > 0 && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium">
                  Last {dataLimit}
                </span>
              )}
            </div>
            <div className="bg-blue-50 px-3 py-2 rounded-md border border-blue-100">
              <span className="text-sm font-medium text-blue-800">
                {viewOptions.find(v => v.id === activeView)?.description}
              </span>
            </div>
          </div>
        </div>
        
        {/* Chart Content */}
        {timeSeriesData.length > 0 ? (
          <div className="w-full">
            {renderChart()}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No data available for the selected filters</p>
              <p className="text-sm mt-2">Try adjusting your organization, project, or time period filters</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
