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
  Activity,
  ChevronDown,
  ChevronUp,
  X,
  Clock
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
  totalRuntime: number
  organizationBreakdown: { [key: string]: number }
  projectBreakdown: { [key: string]: number }
  buildspaceBreakdown: { [key: string]: number }
  agenticTaskBreakdown: { [key: string]: number }
}

type ViewType = 'activeUsers' | 'activeBuildspaces' | 'prompts' | 'cost' | 'agenticTasks' | 'runtime'
type ChartType = 'line' | 'bar'
type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C']

const formatRuntime = (minutes: number): { value: string; unit: string } => {
  const hours = minutes / 60
  if (hours < 1) {
    return { value: Math.round(minutes).toString(), unit: 'min' }
  }
  return hours > 999 
    ? { value: (hours / 1000).toFixed(2) + 'K', unit: 'hrs' }
    : { value: hours.toFixed(2), unit: 'hrs' }
}

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

  // Clear all filters function
  const handleClearAllFilters = useCallback(() => {
    setSelectedOrganization('all')
    setSelectedProject('all')
    setSelectedEmail('all')
    setDataLimit(10)
    setOrgSearchTerm('')
    setProjectSearchTerm('')
    setEmailSearchTerm('')
    setShowOrgDropdown(false)
    setShowProjectDropdown(false)
    setShowEmailDropdown(false)
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

  // Get unique organizations, projects, and emails for filters
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
    const emailSet = new Set<string>()
    filteredData.forEach(item => {
      if (item.email) emailSet.add(item.email)
    })
    return Array.from(emailSet).sort()
  }, [data, selectedOrganization, selectedProject])

  // Filtered options with search
  const filteredOrganizations = useMemo(() => {
    if (!orgSearchTerm) return organizations.slice(0, 50)
    const searchLower = orgSearchTerm.toLowerCase()
    return organizations
      .filter(org => org && typeof org === 'string' && org.toLowerCase().includes(searchLower))
      .slice(0, 15)
  }, [organizations, orgSearchTerm])

  const filteredProjects = useMemo(() => {
    if (!projectSearchTerm) return projects.slice(0, 50)
    const searchLower = projectSearchTerm.toLowerCase()
    return projects
      .filter(project => project && typeof project === 'string' && project.toLowerCase().includes(searchLower))
      .slice(0, 15)
  }, [projects, projectSearchTerm])

  const filteredEmails = useMemo(() => {
    if (!emailSearchTerm) return emails.slice(0, 50)
    const searchLower = emailSearchTerm.toLowerCase()
    return emails
      .filter(email => email && typeof email === 'string' && email.toLowerCase().includes(searchLower))
      .slice(0, 15)
  }, [emails, emailSearchTerm])

  // Process data into time series format
  const timeSeriesData = useMemo((): TimeSeriesData[] => {
    if (!data.length) return []

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

    const selectedPeriods = dataLimit > 0 ? allPeriods.slice(-dataLimit) : allPeriods

    return selectedPeriods.map(periodStart => {
      const actualPeriodStart = periodGenerator(periodStart)
      const actualPeriodEnd = periodEnd(actualPeriodStart)
      const periodLabel = formatPeriod(actualPeriodStart, actualPeriodEnd)

      const periodData = data.filter(item => {
        try {
          const itemDate = parseISO(item.date)
          return isValid(itemDate) && itemDate >= actualPeriodStart && itemDate <= actualPeriodEnd
        } catch {
          return false
        }
      })

      const filteredPeriodData = periodData.filter(item => {
        const orgMatch = selectedOrganization === 'all' || item.domain === selectedOrganization
        const projectMatch = selectedProject === 'all' || item.projectName === selectedProject
        const emailMatch = selectedEmail === 'all' || item.email === selectedEmail
        return orgMatch && projectMatch && emailMatch
      })

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
      
      const activeUsers = activeUsersSet.size
      const activeBuildspaces = activeBuildspacesSet.size
      const totalPrompts = filteredPeriodData.reduce((sum, item) => sum + (Number(item.usageCount) || 0), 0)
      const totalCost = filteredPeriodData.reduce((sum, item) => sum + (Number(item.cost) || 0), 0)
      
      const uniqueAgenticTasks = new Set(
        filteredPeriodData
          .filter(item => item.taskId && item.taskId !== 'N/A')
          .map(item => item.taskId!)
      )
      const totalAgenticTasks = uniqueAgenticTasks.size

      // Calculate runtime based on API structure
      let totalRuntime = 0
      if (selectedEmail === 'all') {
        // Sum all runtime: devzone_total_runtime_minutes OR individual duration_minutes
        periodData.forEach(item => {
          if (item.taskId === 'devzone_tracking') {
            const orgMatch = selectedOrganization === 'all' || item.domain === selectedOrganization
            const projectMatch = selectedProject === 'all' || item.projectName === selectedProject
            
            if (orgMatch && projectMatch) {
              if ((item as any).devzone_total_runtime_minutes) {
                totalRuntime += Number((item as any).devzone_total_runtime_minutes)
              }
              else if ((item as any).duration_minutes) {
                totalRuntime += Number((item as any).duration_minutes)
              }
            }
          }
        })
      } else {
        // Filter by specific user
        periodData.forEach(item => {
          if (item.taskId === 'devzone_tracking') {
            const orgMatch = selectedOrganization === 'all' || item.domain === selectedOrganization
            const projectMatch = selectedProject === 'all' || item.projectName === selectedProject
            const emailMatch = item.email === selectedEmail
            
            if (orgMatch && projectMatch && emailMatch && (item as any).duration_minutes) {
              totalRuntime += Number((item as any).duration_minutes)
            }
          }
        })
      }

      const organizationBreakdown: { [key: string]: number } = {}
      filteredPeriodData.forEach(item => {
        organizationBreakdown[item.domain] = (organizationBreakdown[item.domain] || 0) + (Number(item.cost) || 0)
      })

      const projectBreakdown: { [key: string]: number } = {}
      filteredPeriodData.forEach(item => {
        projectBreakdown[item.projectName] = (projectBreakdown[item.projectName] || 0) + (Number(item.cost) || 0)
      })

      const buildspaceBreakdown: { [key: string]: number } = {}
      filteredPeriodData.forEach(item => {
        if (item.buildSpaceId && item.buildSpaceId !== 'N/A') {
          buildspaceBreakdown[item.buildSpaceId] = (buildspaceBreakdown[item.buildSpaceId] || 0) + (Number(item.cost) || 0)
        }
      })

      const agenticTaskBreakdown: { [key: string]: number } = {}
      filteredPeriodData.forEach(item => {
        if (item.taskId && item.taskId !== 'N/A') {
          agenticTaskBreakdown[item.taskId] = (agenticTaskBreakdown[item.taskId] || 0) + (Number(item.cost) || 0)
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
        totalRuntime,
        organizationBreakdown,
        projectBreakdown,
        buildspaceBreakdown,
        agenticTaskBreakdown
      }
    })
  }, [data, selectedOrganization, selectedProject, selectedEmail, timePeriod, dataLimit])

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    // Get the date range from timeSeriesData (which already respects period and limit filters)
    if (timeSeriesData.length === 0) {
      return {
        totalPeriods: 0,
        uniqueActiveUsers: 0,
        uniqueActiveBuildspaces: 0,
        avgActiveUsers: 0,
        avgActiveBuildspaces: 0,
        totalPrompts: 0,
        totalCost: 0,
        totalAgenticTasks: 0,
        totalRuntime: 0,
        avgPeriodPrompts: 0,
        avgPeriodCost: 0,
        avgAgenticTasks: 0,
        avgRuntime: 0,
        peakPeriod: 'N/A'
      }
    }

    const firstPeriod = timeSeriesData[0]
    const lastPeriod = timeSeriesData[timeSeriesData.length - 1]
    const startDate = parseISO(firstPeriod.periodStart)
    const endDate = parseISO(lastPeriod.periodEnd)

    // Apply all filters including date range
    const filteredData = data.filter(item => {
      try {
        const itemDate = parseISO(item.date)
        if (!isValid(itemDate)) return false
        
        const dateMatch = itemDate >= startDate && itemDate <= endDate
        const orgMatch = selectedOrganization === 'all' || item.domain === selectedOrganization
        const projectMatch = selectedProject === 'all' || item.projectName === selectedProject
        const emailMatch = selectedEmail === 'all' || item.email === selectedEmail
        
        return dateMatch && orgMatch && projectMatch && emailMatch
      } catch {
        return false
      }
    })
    
    const totalPeriods = timeSeriesData.length
    const uniqueActiveUsers = new Set(filteredData.map(item => item.email)).size
    const uniqueActiveBuildspaces = new Set(
      filteredData.filter(item => item.buildSpaceId && item.buildSpaceId !== 'N/A').map(item => item.buildSpaceId)
    ).size
    
    const avgActiveUsers = totalPeriods > 0 ? timeSeriesData.reduce((sum, period) => sum + period.activeUsers, 0) / totalPeriods : 0
    const avgActiveBuildspaces = totalPeriods > 0 ? timeSeriesData.reduce((sum, period) => sum + period.activeBuildspaces, 0) / totalPeriods : 0
    const totalPrompts = timeSeriesData.reduce((sum, period) => sum + period.totalPrompts, 0)
    const totalCost = timeSeriesData.reduce((sum, period) => sum + period.totalCost, 0)
    const totalAgenticTasks = new Set(filteredData.filter(item => item.taskId && item.taskId !== 'N/A').map(item => item.taskId!)).size
    
    const totalRuntime = timeSeriesData.reduce((sum, period) => sum + period.totalRuntime, 0)
    const avgPeriodPrompts = totalPeriods > 0 ? totalPrompts / totalPeriods : 0
    const avgPeriodCost = totalPeriods > 0 ? totalCost / totalPeriods : 0
    const avgAgenticTasks = totalPeriods > 0 ? totalAgenticTasks / totalPeriods : 0
    
    let avgRuntime = 0
    const devzoneTrackingCount = filteredData.filter(item => 
      item.taskId === 'devzone_tracking' && 
      ((item as any).devzone_total_runtime_minutes || (item as any).duration_minutes)
    ).length
    avgRuntime = devzoneTrackingCount > 0 ? totalRuntime / devzoneTrackingCount : 0
    
    const peakPeriod = timeSeriesData.length > 0 ? timeSeriesData.reduce((peak, period) => {
      const currentValue = activeView === 'activeUsers' ? period.activeUsers :
                          activeView === 'activeBuildspaces' ? period.activeBuildspaces :
                          activeView === 'prompts' ? period.totalPrompts : 
                          activeView === 'agenticTasks' ? period.totalAgenticTasks : 
                          activeView === 'runtime' ? period.totalRuntime : period.totalCost
      const peakValue = activeView === 'activeUsers' ? peak.activeUsers :
                       activeView === 'activeBuildspaces' ? peak.activeBuildspaces :
                       activeView === 'prompts' ? peak.totalPrompts : 
                       activeView === 'agenticTasks' ? peak.totalAgenticTasks : 
                       activeView === 'runtime' ? peak.totalRuntime : peak.totalCost
      return currentValue > peakValue ? period : peak
    }, timeSeriesData[0]) : { period: 'N/A' }

    return {
      totalPeriods,
      uniqueActiveUsers,
      uniqueActiveBuildspaces,
      avgActiveUsers: Math.round(avgActiveUsers),
      avgActiveBuildspaces: Math.round(avgActiveBuildspaces),
      totalPrompts,
      totalCost,
      totalAgenticTasks,
      totalRuntime,
      avgPeriodPrompts: Math.round(avgPeriodPrompts),
      avgPeriodCost,
      avgAgenticTasks: Math.round(avgAgenticTasks),
      avgRuntime: Math.round(avgRuntime),
      peakPeriod: peakPeriod?.period || 'N/A'
    }
  }, [timeSeriesData, activeView, data, selectedOrganization, selectedProject, selectedEmail])

  const viewOptions = [
    { id: 'activeUsers' as const, label: 'User', icon: Users },
    { id: 'activeBuildspaces' as const, label: 'Buildspace', icon: Layers },
    { id: 'prompts' as const, label: 'Prompt', icon: MessageSquare },
    { id: 'cost' as const, label: 'Cost', icon: DollarSign },
    { id: 'agenticTasks' as const, label: 'Agentic Task', icon: Activity },
    { id: 'runtime' as const, label: 'Runtime', icon: Clock }
  ]

  const chartTypeOptions = [
    { id: 'line' as const, label: 'Line Chart', icon: TrendingUp },
    { id: 'bar' as const, label: 'Bar Chart', icon: BarChart3 }
  ]

  const timePeriodOptions = [
    { id: 'daily' as const, label: 'Daily' },
    { id: 'weekly' as const, label: 'Weekly' },
    { id: 'monthly' as const, label: 'Monthly' },
    { id: 'yearly' as const, label: 'Yearly' },
    { id: 'all' as const, label: 'All' }
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

  const chartData = useMemo(() => {
    return timeSeriesData.map(period => {
      // Get the period data with filters applied
      const periodStart = parseISO(period.periodStart)
      const periodEnd = parseISO(period.periodEnd)
      
      const periodData = data.filter(item => {
        try {
          const itemDate = parseISO(item.date)
          if (!isValid(itemDate)) return false
          
          const dateMatch = itemDate >= periodStart && itemDate <= periodEnd
          const orgMatch = selectedOrganization === 'all' || item.domain === selectedOrganization
          const projectMatch = selectedProject === 'all' || item.projectName === selectedProject
          const emailMatch = selectedEmail === 'all' || item.email === selectedEmail
          
          return dateMatch && orgMatch && projectMatch && emailMatch
        } catch {
          return false
        }
      })

      // Create email mapping based on the active view
      let emailMapping: string[] = []
      
      if (activeView === 'activeUsers') {
        emailMapping = Array.from(new Set(
          periodData
            .filter(item => Number(item.usageCount) > 0)
            .map(item => item.email)
        ))
      } else if (activeView === 'activeBuildspaces') {
        emailMapping = Array.from(new Set(
          periodData
            .filter(item => item.buildSpaceId && item.buildSpaceId !== 'N/A' && Number(item.usageCount) > 0)
            .map(item => item.email)
        ))
      } else if (activeView === 'prompts') {
        // Group by email and sum prompts, then sort
        const emailPrompts = periodData.reduce((acc, item) => {
          acc[item.email] = (acc[item.email] || 0) + (Number(item.usageCount) || 0)
          return acc
        }, {} as Record<string, number>)
        
        emailMapping = Object.entries(emailPrompts)
          .sort(([, a], [, b]) => b - a)
          .map(([email, count]) => `${email} (${count})`)
      } else if (activeView === 'cost') {
        // Group by email and sum cost, then sort
        const emailCosts = periodData.reduce((acc, item) => {
          acc[item.email] = (acc[item.email] || 0) + (Number(item.cost) || 0)
          return acc
        }, {} as Record<string, number>)
        
        emailMapping = Object.entries(emailCosts)
          .sort(([, a], [, b]) => b - a)
          .map(([email, cost]) => `${email} ($${cost.toFixed(2)})`)
      } else if (activeView === 'agenticTasks') {
        // Get unique emails that have agentic tasks
        emailMapping = Array.from(new Set(
          periodData
            .filter(item => item.taskId && item.taskId !== 'N/A')
            .map(item => item.email)
        ))
      } else if (activeView === 'runtime') {
        // Group by email and sum runtime
        const emailRuntimes: Record<string, number> = {}
        
        periodData.forEach(item => {
          if (item.taskId === 'devzone_tracking' && item.email && (item as any).duration_minutes) {
            emailRuntimes[item.email] = (emailRuntimes[item.email] || 0) + Number((item as any).duration_minutes)
          }
        })
        
        emailMapping = Object.entries(emailRuntimes)
          .sort(([, a], [, b]) => b - a)
          .map(([email, minutes]) => `${email} (${minutes > 60 ? `${(minutes / 60).toFixed(2)} hrs` : `${Math.round(minutes)} min`})`)
      }

      return {
        week: period.period,
        value: activeView === 'activeUsers' ? period.activeUsers :
               activeView === 'activeBuildspaces' ? period.activeBuildspaces :
               activeView === 'prompts' ? period.totalPrompts :
               activeView === 'agenticTasks' ? period.totalAgenticTasks :
               activeView === 'runtime' ? period.totalRuntime : period.totalCost,
        label: activeView === 'activeUsers' ? 'Active Users' :
               activeView === 'activeBuildspaces' ? 'Active Buildspaces' :
               activeView === 'prompts' ? 'Total Prompts' :
               activeView === 'agenticTasks' ? 'Agentic Tasks' :
               activeView === 'runtime' ? 'Runtime' : 'Total Cost',
        emailMapping
      }
    })
  }, [timeSeriesData, activeView, data, selectedOrganization, selectedProject, selectedEmail])

  const renderChart = () => {
    const chartWidth = Math.max(800, chartData.length * 80)
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
                    if (activeView === 'runtime') {
                      return value > 60 ? `${(value / 60).toFixed(1)} Hrs` : `${value} min`
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
                                : activeView === 'runtime'
                                ? data.value > 60 ? `${(data.value / 60).toFixed(2)} hrs` : `${Math.round(data.value)} min`
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
                                 activeView === 'runtime' ? 'Users by Runtime:' :
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
                  if (activeView === 'runtime') {
                    return value > 60 ? `${(value / 60).toFixed(1)} HRS` : `${value} min`
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
                              : activeView === 'runtime'
                              ? data.value > 60 ? `${(data.value / 60).toFixed(2)} hrs` : `${Math.round(data.value)} min`
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
                               activeView === 'runtime' ? 'Users by Runtime:' :
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

  return (
    <div className={`space-y-3 ${className}`}>
        {/* Filters Row */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Organization Filter */}
          <div className="relative dropdown-container flex-1 min-w-0">
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-600 pointer-events-none" />
              {showOrgDropdown ? (
                <ChevronUp 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" 
                  onClick={() => setShowOrgDropdown(false)}
                />
              ) : (
                <ChevronDown 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" 
                  onClick={() => setShowOrgDropdown(true)}
                />
              )}
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
                className="w-full pl-10 pr-10 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
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
          <div className="relative dropdown-container flex-1 min-w-0">
            <div className="relative">
              <FolderOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600 pointer-events-none" />
              {showProjectDropdown ? (
                <ChevronUp 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" 
                  onClick={() => setShowProjectDropdown(false)}
                />
              ) : (
                <ChevronDown 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" 
                  onClick={() => setShowProjectDropdown(true)}
                />
              )}
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
                className="w-full pl-10 pr-10 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer"
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
          <div className="relative dropdown-container flex-1 min-w-0">
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-600 pointer-events-none" />
              {showEmailDropdown ? (
                <ChevronUp 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" 
                  onClick={() => setShowEmailDropdown(false)}
                />
              ) : (
                <ChevronDown 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" 
                  onClick={() => setShowEmailDropdown(true)}
                />
              )}
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
                className="w-full pl-10 pr-10 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
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
          <div className="relative dropdown-container flex-1 min-w-0">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-600 pointer-events-none" />
              {showPeriodsDropdown ? (
                <ChevronUp 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" 
                  onClick={() => setShowPeriodsDropdown(false)}
                />
              ) : (
                <ChevronDown 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" 
                  onClick={() => setShowPeriodsDropdown(true)}
                />
              )}
              <input
                type="text"
                value={dataLimit === 0 ? 'All Periods' : `Last ${dataLimit}`}
                readOnly
                onClick={() => setShowPeriodsDropdown(!showPeriodsDropdown)}
                className="w-full pl-10 pr-10 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
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
          
          {/* Clear All Filters Button */}
          <div className="flex-shrink-0">
            <Button
              onClick={handleClearAllFilters}
              variant="outline"
              size="sm"
              className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              {/* <X className="h-4 w-4 mr-1" /> */}

              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#666666"><path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/></svg>
              {/* <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="24px" fill="#666666"><path d="m592-481-57-57 143-182H353l-80-80h487q25 0 36 22t-4 42L592-481ZM791-56 560-287v87q0 17-11.5 28.5T520-160h-80q-17 0-28.5-11.5T400-200v-247L56-791l56-57 736 736-57 56ZM535-538Z"/></svg> */}
              Clear All
            </Button>
          </div>
        </div>

        {/* Summary Stats Grid */}
        <div className="mt-4 grid grid-cols-3 md:grid-cols-7 lg:grid-cols-7 gap-2">
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
          <div className="bg-teal-50 p-2 rounded text-center border border-teal-100">
            <div className="text-base font-bold text-teal-600">{formatRuntime(summaryStats.totalRuntime).value} {formatRuntime(summaryStats.totalRuntime).unit}</div>
            <div className="text-xs text-teal-800">Total Runtime</div>
          </div>
        </div>

        {/* Average Stats Grid */}
        <div className="mt-2 grid grid-cols-3 md:grid-cols-7 lg:grid-cols-7 gap-2">
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
          <div className="bg-emerald-50 p-1.5 rounded text-center border border-emerald-100">
            <div className="text-xs font-semibold text-emerald-600">{formatRuntime(summaryStats.avgRuntime).value} {formatRuntime(summaryStats.avgRuntime).unit}</div>
            <div className="text-xs text-emerald-800">Avg Runtime</div>
          </div>
        </div>

        {/* Time Period and Analysis Controls Card */}
        <div className="rounded-lg border bg-white p-6 shadow-sm p-4">
          <div className="flex flex-wrap gap-4 mb-4 pb-3 border-b border-gray-200">
            {/* Time Period Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Time Period:</span>
              <div className="flex flex-wrap gap-1">
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
            
            {/* Vertical Divider - only visible on large screens */}
            <div className="hidden lg:block w-px h-8 bg-gray-300"></div>
            
            {/* Analysis Type Controls - wraps to next row on small screens */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Analysis:</span>
              <div className="flex flex-wrap gap-1">
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
          </div>

          {/* Chart Header with Chart Type Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {viewOptions.find(v => v.id === activeView)?.label} - {getPeriodLabel()} Trend
              </h3>
              {/* Chart Type Controls moved next to the trend text */}
              <div className="flex items-center gap-2 flex-shrink-0">
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
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-500">
                {timeSeriesData.length} periods
                {dataLimit > 0 && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium">
                    Last {dataLimit}
                  </span>
                )}
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
        </div>
    </div>
  )
}