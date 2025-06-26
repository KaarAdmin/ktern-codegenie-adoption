'use client'

import { useState, useEffect } from 'react'
import { BuildSpace, BuildSpaceInsightsResponse, DashboardMetrics, FilterOptions, UserExpense } from '@/types'
import { getBuildSpaceInsights } from '@/lib/api'

export function useDashboardData(filters: FilterOptions = {}) {
  const [data, setData] = useState<BuildSpace[]>([])
  const [userExpenseData, setUserExpenseData] = useState<UserExpense[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await getBuildSpaceInsights(filters)
      setData(response.build_space)
      setUserExpenseData(response.user_expense || [])
      
      // Calculate metrics from the data
      const calculatedMetrics = calculateMetrics(response.build_space)
      setMetrics(calculatedMetrics)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [JSON.stringify(filters)])

  const calculateMetrics = (buildSpaces: BuildSpace[]): DashboardMetrics => {
    const totalProjects = buildSpaces.length
    const totalCost = buildSpaces.reduce((sum, space) => sum + space.totalCost, 0)
    const totalEngagement = buildSpaces.reduce((sum, space) => sum + space.totalItemCount, 0)
    
    // Calculate new projects this month
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
    const newProjectsThisMonth = buildSpaces.filter(space => {
      const createdDate = new Date(space.createdOn)
      return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear
    }).length

    // Calculate unique developers (including createdBy, owner, and all members)
    const developers = new Set<string>()
    buildSpaces.forEach(space => {
      if (space.createdBy) developers.add(space.createdBy)
      if (space.owner) developers.add(space.owner)
      
      // Add all members from the members object
      if (space.members && typeof space.members === 'object') {
        Object.values(space.members).forEach(memberName => {
          if (memberName && typeof memberName === 'string') {
            developers.add(memberName)
          }
        })
      }
    })

    // Generated artifacts count (projects with git initialization)
    const generatedArtifacts = buildSpaces.filter(space => 
      space.repositoryUrl && space.repositoryUrl.trim() !== ''
    ).length

    return {
      totalProjects,
      newProjectsThisMonth,
      totalDevelopers: developers.size,
      generatedArtifacts,
      totalCost,
      averageEngagement: totalProjects > 0 ? totalEngagement / totalProjects : 0,
    }
  }

  const refetch = () => {
    fetchData()
  }

  return {
    data,
    userExpenseData,
    metrics,
    loading,
    error,
    refetch,
  }
}

export function useRealTimeData(filters: FilterOptions = {}, intervalMs: number = 30000) {
  const dashboardData = useDashboardData(filters)

  useEffect(() => {
    const interval = setInterval(() => {
      dashboardData.refetch()
    }, intervalMs)

    return () => clearInterval(interval)
  }, [dashboardData.refetch, intervalMs])

  return dashboardData
}
