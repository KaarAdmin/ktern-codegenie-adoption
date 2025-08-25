'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, GridReadyEvent, GridApi, ColumnApi } from 'ag-grid-community'
import { getUserLevelExtendedInsightsResponse, updateUserExtendedData } from '@/lib/api'
import { UserExtendedModel } from '@/types'
import { ExportDropdown } from '@/components/ui/ExportDropdown'
import { Card } from '@/components/ui/Card'
import { isAuthorizedUser, getCurrentUserEmail } from '@/lib/auth'
import { useToastActions } from '@/contexts/ToastContext'
import { Calendar, Filter, RefreshCw, Users, Building2, FolderOpen, Layers, DollarSign, Zap, MessageSquare } from 'lucide-react'
import { WeeklyStatsAnalytics } from './WeeklyStatsAnalytics'
import 'ag-grid-enterprise'

interface UserExtendedInsightsProps {
  filters?: Record<string, string | undefined>
  className?: string
}

interface SummaryStats {
  totalOrganizations: number
  totalProjects: number
  totalBuildspaces: number
  totalUsers: number
  totalCost: number
  totalAgenticCost: number
  totalPrompts: number
}

interface TopOrganization {
  orgName: string
  domainName: string
  noOfUsers: number
  noOfBuildspaces: number
  cost: number
}

interface TopUser {
  userName: string
  name: string
  noOfAgentTask: number
  noOfBuildspaces: number
  cost: number
}

export function UserExtendedInsights({
  filters = {},
  className = ''
}: UserExtendedInsightsProps) {
  const [gridApi, setGridApi] = useState<GridApi | null>(null)
  const [columnApi, setColumnApi] = useState<ColumnApi | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [data, setData] = useState<UserExtendedModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  })
  const [isEditMode, setIsEditMode] = useState(false)
  const [isPivotMode, setIsPivotMode] = useState(true)
  const [changedRows, setChangedRows] = useState<Set<string>>(new Set())
  const [changedRowsDetails, setChangedRowsDetails] = useState<Map<string, { fields: Set<string>, uniqueKey?: string }>>(new Map())
  const [isUserAuthorized, setIsUserAuthorized] = useState(false)

  const { showSuccess, showError, showWarning, showInfo } = useToastActions()

  // Check user authorization on component mount
  useEffect(() => {
    const checkAuth = () => {
      const authorized = isAuthorizedUser()
      setIsUserAuthorized(authorized)
      console.log('User authorization check:', {
        authorized,
        email: getCurrentUserEmail()
      })
    }
    
    checkAuth()
  }, [])

  // Load data function
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Combine filters with date filters
      const combinedFilters = {
        ...filters,
        ...(dateFilter.startDate && { startDate: dateFilter.startDate }),
        ...(dateFilter.endDate && { endDate: dateFilter.endDate })
      }
      
      const response = await getUserLevelExtendedInsightsResponse(combinedFilters)
      
      if (response.status_code === 200) {
        setData(response.users_extended)
      } else {
        throw new Error('Failed to fetch data')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data'
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [filters, dateFilter, showError])

  // Load data on component mount and when filters change
  useEffect(() => {
    loadData()
  }, [loadData])

  // Calculate summary statistics
  const summaryStats = useMemo((): SummaryStats => {
    if (!data.length) {
      return {
        totalOrganizations: 0,
        totalProjects: 0,
        totalBuildspaces: 0,
        totalUsers: 0,
        totalCost: 0,
        totalAgenticCost: 0,
        totalPrompts: 0
      }
    }

    const uniqueDomains = new Set(data.map(item => item.domain))
    const uniqueProjects = new Set(data.map(item => item.projectId))
    const uniqueBuildspaces = new Set(data.filter(item => item.buildSpaceId).map(item => item.buildSpaceId))
    const uniqueUsers = new Set(data.map(item => item.email))
    const uniqueTaskIds = new Set(data.map(item => item.taskId))

    const totalCost = data.reduce((sum, item) => sum + Number(item.cost), 0)
    const totalPrompts = data.reduce((sum, item) => sum + Number(item.usageCount), 0)

    return {
      totalOrganizations: uniqueDomains.size,
      totalProjects: uniqueProjects.size,
      totalBuildspaces: uniqueBuildspaces.size,
      totalUsers: uniqueUsers.size,
      totalCost: totalCost,
      totalAgenticCost: uniqueTaskIds.size,
      totalPrompts: totalPrompts
    }
  }, [data])

  // Calculate Top 5 Organizations
  const topOrganizations = useMemo((): TopOrganization[] => {
    if (!data.length) return []

    const orgMap = new Map<string, {
      domain: string
      users: Set<string>
      buildspaces: Set<string>
      cost: number
    }>()

    // Aggregate data by domain
    data.forEach(item => {
      if (!orgMap.has(item.domain)) {
        orgMap.set(item.domain, {
          domain: item.domain,
          users: new Set(),
          buildspaces: new Set(),
          cost: 0
        })
      }

      const org = orgMap.get(item.domain)!
      org.users.add(item.email)
      if (item.buildSpaceId) {
        org.buildspaces.add(item.buildSpaceId)
      }
      org.cost += Number(item.cost)
    })

    // Convert to array and sort by cost (descending)
    return Array.from(orgMap.values())
      .map(org => ({
        orgName: org.domain,
        domainName: org.domain,
        noOfUsers: org.users.size,
        noOfBuildspaces: org.buildspaces.size,
        cost: org.cost
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5)
  }, [data])

  // Calculate Top 5 Users
  const topUsers = useMemo((): TopUser[] => {
    if (!data.length) return []

    const userMap = new Map<string, {
      name: string
      email: string
      agentTasks: Set<string>
      buildspaces: Set<string>
      cost: number
    }>()

    // Aggregate data by user name
    data.forEach(item => {
      if (!userMap.has(item.name)) {
        userMap.set(item.name, {
          name: item.name,
          email: item.email,
          agentTasks: new Set(),
          buildspaces: new Set(),
          cost: 0
        })
      }

      const user = userMap.get(item.name)!
      if (item.taskId) {
        user.agentTasks.add(item.taskId)
      }
      if (item.buildSpaceId) {
        user.buildspaces.add(item.buildSpaceId)
      }
      user.cost += Number(item.cost)
    })

    // Convert to array and sort by cost (descending)
    return Array.from(userMap.values())
      .map(user => ({
        userName: user.name,
        name: user.name,
        noOfAgentTask: user.agentTasks.size,
        noOfBuildspaces: user.buildspaces.size,
        cost: user.cost
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5)
  }, [data])

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api)
    setColumnApi(params.columnApi)
    
    // Load saved grid state from localStorage
    const savedState = localStorage.getItem('userExtendedPivotGridState')
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        params.columnApi.applyColumnState({
          state: parsedState.columnState,
          applyOrder: true
        })
        if (parsedState.filterModel) {
          params.api.setFilterModel(parsedState.filterModel)
        }
      } catch (error) {
        console.warn('Failed to restore grid state:', error)
      }
    }
  }, [])

  // Apply search filter
  useEffect(() => {
    if (gridApi) {
      gridApi.setQuickFilter(searchTerm)
    }
  }, [gridApi, searchTerm])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchTerm('')
  }, [])

  const handleRefresh = useCallback(() => {
    loadData()
  }, [loadData])

  const handleDateFilterChange = useCallback((field: 'startDate' | 'endDate', value: string) => {
    setDateFilter(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  const handleClearDateFilters = useCallback(() => {
    setDateFilter({
      startDate: '',
      endDate: ''
    })
  }, [])

  // Save grid state to localStorage
  const saveGridState = useCallback(() => {
    if (gridApi && columnApi) {
      const gridState = {
        columnState: columnApi.getColumnState(),
        filterModel: gridApi.getFilterModel(),
        timestamp: Date.now()
      }
      localStorage.setItem('userExtendedPivotGridState', JSON.stringify(gridState))
    }
  }, [gridApi, columnApi])

  // Auto-save grid state when columns change
  const onColumnMoved = useCallback(() => {
    saveGridState()
  }, [saveGridState])

  const onColumnResized = useCallback(() => {
    saveGridState()
  }, [saveGridState])

  const onColumnVisible = useCallback(() => {
    saveGridState()
  }, [saveGridState])

  const onColumnPinned = useCallback(() => {
    saveGridState()
  }, [saveGridState])

  const onFilterChanged = useCallback(() => {
    saveGridState()
  }, [saveGridState])

  const onSortChanged = useCallback(() => {
    saveGridState()
  }, [saveGridState])

  const handleToggleEditMode = useCallback(() => {
    if (!isUserAuthorized) {
      showError('You are not authorized to edit this data. Please contact your administrator.')
      return
    }
    setIsEditMode(!isEditMode)
    setChangedRows(new Set())
    setChangedRowsDetails(new Map())
    if (gridApi) {
      // Refresh the grid to apply/remove editing
      gridApi.refreshCells()
    }
  }, [isEditMode, gridApi, isUserAuthorized, showError])

  const handleTogglePivotMode = useCallback(() => {
    setIsPivotMode(!isPivotMode)
    setChangedRows(new Set())
    if (gridApi) {
      // Toggle pivot mode in AG Grid
      gridApi.setPivotMode(!isPivotMode)
    }
  }, [isPivotMode, gridApi])

  const handleCellValueChanged = useCallback((event: any) => {
    if (event.data && event.data.taskId) {
      // Create unique identifier using taskId, date, projectId, email
      const uniqueKey = `${event.data.taskId}-${event.data.date}-${event.data.projectId}-${event.data.email}`
      const field = event.colDef.field
      
      // Track field-specific changes using unique key
      setChangedRowsDetails(prev => {
        const newMap = new Map(prev)
        const existing = newMap.get(uniqueKey) || { fields: new Set(), uniqueKey }
        existing.fields.add(field)
        existing.uniqueKey = uniqueKey
        newMap.set(uniqueKey, existing)
        return newMap
      })
      
      setChangedRows(prev => new Set(prev).add(uniqueKey))
      
      /* console.log('Cell value changed:', {
        uniqueKey: uniqueKey,
        field: field,
        oldValue: event.oldValue,
        newValue: event.newValue,
        rowData: event.data
      }) */
      
      if (gridApi) {
        // Refresh the current row
        gridApi.refreshCells({
          rowNodes: [event.node],
          force: true
        })
      }
    }
  }, [gridApi])

  const handleSaveChanges = useCallback(async () => {
    if (!gridApi) return

    const changedData: any[] = []
    const processedRows = new Set<string>()
    
    // Collect changed data - only get rows that were actually changed using unique keys
    changedRowsDetails.forEach((details, uniqueKey) => {
      if (!processedRows.has(uniqueKey)) {
        // Find the node with this exact unique key
        gridApi.forEachNode((node) => {
          if (node.data && !node.group) {
            const nodeUniqueKey = `${node.data.taskId}-${node.data.date}-${node.data.projectId}-${node.data.email}`
            
            if (nodeUniqueKey === uniqueKey) {
              // Only add leaf nodes (actual data rows), not group nodes
              changedData.push(node.data)
              processedRows.add(uniqueKey)
            }
          }
        })
      }
    })

    /* console.log('Saving changes:', {
      totalChangedTasks: changedRows.size,
      changedRowsDetails: Array.from(changedRowsDetails.entries()).map(([taskId, details]) => ({
        taskId,
        fields: Array.from(details.fields)
      })),
      payloadSize: changedData.length,
      changedData: changedData
    }) */

    try {
      // Show loading state
      const saveButton = document.querySelector('[data-save-button]') as HTMLButtonElement
      if (saveButton) {
        saveButton.disabled = true
        saveButton.textContent = 'Saving...'
      }

      // Make API call to save the data
      const result = await updateUserExtendedData(changedData)
      
      if (result.status_code === 201) {
        setChangedRows(new Set())
        setChangedRowsDetails(new Map())
        showSuccess(`Successfully saved ${changedData.length} changed rows.`)
        // Optionally refresh the data
        handleRefresh()
      } else {
        showError(`Failed to save changes: ${result.detail}`)
      }
    } catch (error) {
      console.error('Error saving changes:', error)
      showError(`Error saving changes: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      // Reset button state
      const saveButton = document.querySelector('[data-save-button]') as HTMLButtonElement
      if (saveButton) {
        saveButton.disabled = false
        saveButton.textContent = `Save Changes (${changedRows.size})`
      }
    }
  }, [gridApi, changedRows, changedRowsDetails, handleRefresh, showSuccess, showError])

  // Custom function to check if a node is editable
  const isRowEditable = useCallback((params: any) => {
    // Only allow editing if user is authorized, in edit mode, NOT in pivot mode, and has actual data
    return isUserAuthorized && isEditMode && !isPivotMode && params.data && params.data.taskId
  }, [isUserAuthorized, isEditMode, isPivotMode])

  // Custom cell style function to highlight edited cells
  const getCellStyle = useCallback((params: any) => {
    if (params.data) {
      const uniqueKey = `${params.data.taskId}-${params.data.date}-${params.data.projectId}-${params.data.email}`
      if (changedRows.has(uniqueKey)) {
        return { backgroundColor: '#fff3cd', border: '1px solid #ffc107' }
      }
    }
    return null
  }, [changedRows])

  // Generate monthly cost columns dynamically
  const monthlyColumns = useMemo(() => {
    if (!data.length) return []

    // Get unique months from the data
    const monthsSet = new Set<string>()
    data.forEach(item => {
      if (item.date) {
        const date = new Date(item.date)
        if (!isNaN(date.getTime())) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          monthsSet.add(monthKey)
        }
      }
    })

    // Convert to sorted array and create columns
    const sortedMonths = Array.from(monthsSet).sort()
    
    return sortedMonths.map(monthKey => {
      const [year, month] = monthKey.split('-')
      const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      })

      return {
        field: `cost_${monthKey}`,
        headerName: monthName,
        enableValue: true,
        sortable: true,
        filter: 'agNumberColumnFilter',
        minWidth: 120,
        // Value getter to extract the cost for this specific month from each row
        valueGetter: (params: any) => {
          if (!params.data || !params.data.date || !params.data.cost) {
            return 0
          }
          
          const itemDate = new Date(params.data.date)
          if (isNaN(itemDate.getTime())) {
            return 0
          }
          
          const itemMonthKey = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}`
          if (itemMonthKey === monthKey) {
            return Number(params.data.cost) || 0
          }
          
          return 0
        },
        aggFunc: (params: any) => {
          if (params.rowNode && params.rowNode.group) {
            // This is a group row - sum costs for this month from all children
            let totalCost = 0
            
            const collectFromChildren = (node: any) => {
              if (node.childrenAfterGroup) {
                node.childrenAfterGroup.forEach((childNode: any) => {
                  if (childNode.group) {
                    // Child is also a group, recursively collect from it
                    collectFromChildren(childNode)
                  } else {
                    // Child is a leaf node, check if its date matches this month
                    if (childNode.data?.date && childNode.data?.cost) {
                      const itemDate = new Date(childNode.data.date)
                      if (!isNaN(itemDate.getTime())) {
                        const itemMonthKey = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}`
                        if (itemMonthKey === monthKey) {
                          totalCost += Number(childNode.data.cost) || 0
                        }
                      }
                    }
                  }
                })
              }
            }
            
            collectFromChildren(params.rowNode)
            return totalCost
          } else {
            // This is a leaf aggregation - sum the values
            const values = params.values.filter((v: any) => v && v !== null && v !== undefined && v > 0)
            return values.reduce((sum: number, val: number) => sum + val, 0)
          }
        },
        valueFormatter: (params: any) => {
          if (params.value == null || params.value === 0) return '$0.00'
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(Number(params.value))
        },
        cellStyle: (params: any) => {
          // Highlight cells with values
          if (params.value && params.value > 0) {
            return { backgroundColor: '#f0f9ff', fontWeight: 'bold' }
          }
          return null
        }
      }
    })
  }, [data])

  const columnDefs: ColDef[] = useMemo(() => [
    {
      field: 'domain',
      headerName: 'Organization',
      rowGroup: isPivotMode,
      hide: isPivotMode,
      enableRowGroup: true,
      filter: 'agTextColumnFilter',
      sortable: true
    },
    {
      field: 'projectName',
      headerName: 'Project Name',
      rowGroup: isPivotMode,
      hide: isPivotMode,
      enableRowGroup: true,
      filter: 'agTextColumnFilter',
      sortable: true
    },
    {
      field: 'name',
      headerName: 'User Name',
      rowGroup: isPivotMode,
      hide: isPivotMode,
      enableRowGroup: true,
      filter: 'agTextColumnFilter',
      sortable: true
    },
    {
      field: 'date',
      headerName: 'Date',
      sortable: true,
      filter: 'agDateColumnFilter',
      minWidth: 120,
      enableValue: true,
      aggFunc: 'first',
      valueFormatter: (params) => {
        if (!params.value) return ''
        const date = new Date(params.value)
        return isNaN(date.getTime()) ? '' : date.toLocaleDateString()
      }
    },
    {
      field: 'email',
      headerName: 'Email',
      enableRowGroup: true,
      filter: 'agTextColumnFilter',
      sortable: true,
      aggFunc: (params) => {
        if (params.rowNode && params.rowNode.group) {
          // Debug logging
          // console.log('Email aggFunc - Group Key:', params.rowNode.key, 'Field:', params.rowNode.field, 'Level:', params.rowNode.level)
          
          // Get all child data to find emails
          const childEmails: string[] = []
          
          // Traverse child nodes to collect emails
          if (params.rowNode.childrenAfterGroup) {
            params.rowNode.childrenAfterGroup.forEach((childNode: any) => {
              if (childNode.data && childNode.data.email) {
                childEmails.push(childNode.data.email)
              } else if (childNode.group && childNode.childrenAfterGroup) {
                // Recursively check nested groups
                const collectEmailsFromGroup = (groupNode: any): string[] => {
                  const emails: string[] = []
                  if (groupNode.childrenAfterGroup) {
                    groupNode.childrenAfterGroup.forEach((node: any) => {
                      if (node.data && node.data.email) {
                        emails.push(node.data.email)
                      } else if (node.group) {
                        emails.push(...collectEmailsFromGroup(node))
                      }
                    })
                  }
                  return emails
                }
                childEmails.push(...collectEmailsFromGroup(childNode))
              }
            })
          }
          
          // Check if this group represents a user by looking at the group key and available emails
          const groupKey = params.rowNode.key
          if (groupKey && childEmails.length > 0) {
            // Find if any of the child emails belong to this user name
            const matchingEmail = childEmails.find(email => {
              // Find the data item that has this email and check if the name matches the group key
              const dataItem = data.find(item => item.email === email)
              return dataItem && dataItem.name === groupKey
            })
            
            if (matchingEmail) {
              // console.log('Found matching email for user:', groupKey, '→', matchingEmail)
              return matchingEmail
            }
          }
          
          return ''
        } else {
          // This is a leaf aggregation - show the first email value
          const values = params.values.filter(v => v && v !== null && v !== undefined)
          return values.length > 0 ? values[0] : ''
        }
      },
      valueFormatter: (params) => {
        if (params.node && params.node.group) {
          // Only show email if it contains @ symbol
          if (params.value && typeof params.value === 'string' && params.value.includes('@')) {
            return params.value
          }
          return ''
        }
        return params.value || ''
      }
    },
    {
      field: 'buildSpaceId',
      headerName: 'Build Space ID',
      enableRowGroup: true,
      enableValue: true,
      editable: isRowEditable,
      filter: 'agTextColumnFilter',
      sortable: true,
      minWidth: 130,
      aggFunc: (params) => {
        // For group rows, collect unique buildSpaceIds from children; for leaf rows, count unique buildSpaceIds
        if (params.rowNode && params.rowNode.group) {
          // This is a group row - collect unique buildSpaceIds from all children
          const uniqueValues = new Set<string>()
          
          const collectFromChildren = (node: any) => {
            if (node.childrenAfterGroup) {
              node.childrenAfterGroup.forEach((childNode: any) => {
                if (childNode.group) {
                  // Child is also a group, recursively collect from it
                  collectFromChildren(childNode)
                } else {
                  // Child is a leaf node, collect its buildSpaceId if it exists
                  if (childNode.data?.buildSpaceId && childNode.data.buildSpaceId !== 'N/A') {
                    uniqueValues.add(childNode.data.buildSpaceId)
                  }
                }
              })
            }
          }
          
          collectFromChildren(params.rowNode)
          return uniqueValues.size
        } else {
          // This is a leaf aggregation - count unique buildSpaceIds
          const values = params.values.filter(v => v && v !== 'N/A' && v !== null && v !== undefined)
          if (values.length === 0) return 0
          const uniqueValues = Array.from(new Set(values))
          return uniqueValues.length
        }
      }
    },
    {
      field: 'taskId',
      headerName: 'Agentic Task',
      enableRowGroup: true,
      enableValue: true,
      sortable: true,
      filter: 'agTextColumnFilter',
      minWidth: 150,
      aggFunc: (params) => {
        // For group rows, collect unique taskIds from children; for leaf rows, count unique taskIds
        if (params.rowNode && params.rowNode.group) {
          // This is a group row - collect unique taskIds from all children
          const uniqueValues = new Set<string>()
          
          const collectFromChildren = (node: any) => {
            if (node.childrenAfterGroup) {
              node.childrenAfterGroup.forEach((childNode: any) => {
                if (childNode.group) {
                  // Child is also a group, recursively collect from it
                  collectFromChildren(childNode)
                } else {
                  // Child is a leaf node, collect its taskId if it exists
                  if (childNode.data?.taskId && childNode.data.taskId !== 'N/A') {
                    uniqueValues.add(childNode.data.taskId)
                  }
                }
              })
            }
          }
          
          collectFromChildren(params.rowNode)
          return uniqueValues.size
        } else {
          // This is a leaf aggregation - count unique taskIds
          const values = params.values.filter(v => v && v !== 'N/A' && v !== null && v !== undefined)
          if (values.length === 0) return 0
          const uniqueValues = Array.from(new Set(values))
          return uniqueValues.length
        }
      }
    },
    {
      field: 'usageCount',
      headerName: 'Prompt',
      aggFunc: 'sum',
      enableValue: true,
      sortable: true,
      filter: 'agNumberColumnFilter',
      minWidth: 120,
      cellEditor: 'agTextCellEditor',
      cellEditorParams: {
        parseValue: (value: string) => {
          const numValue = parseInt(value, 10)
          return isNaN(numValue) || numValue < 0 ? 0 : numValue
        }
      },
      valueFormatter: (params) => {
        if (params.value == null) return '0'
        return new Intl.NumberFormat('en-US').format(Number(params.value))
      },
      cellStyle: getCellStyle
    },
    {
      field: 'cost',
      headerName: 'Cost',
      aggFunc: 'sum',
      enableValue: true,
      sortable: true,
      filter: 'agNumberColumnFilter',
      minWidth: 100,
      cellEditor: 'agTextCellEditor',
      cellEditorParams: {
        parseValue: (value: string) => {
          const numValue = parseFloat(value)
          return isNaN(numValue) || numValue < 0 ? 0 : numValue
        }
      },
      valueFormatter: (params) => {
        if (params.value == null) return '$0.00'
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 3
        }).format(Number(params.value))
      },
      cellStyle: getCellStyle
    },
    // Add monthly cost columns dynamically
    ...monthlyColumns
  ], [isRowEditable, getCellStyle, data, monthlyColumns, isPivotMode])

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 90,
    // Enable drag and drop for all columns
    enableRowGroup: true,
    enablePivot: true,
    enableValue: true,
    // Auto-size columns based on header content
    suppressSizeToFit: false,
    // Don't make all columns editable by default - only those explicitly marked as editable
    editable: false
  }), [])

  const autoGroupColumnDef = useMemo(() => ({
    headerName: 'Executive Overview Details',
    field: 'name',
    minWidth: 350,
    pinned: 'left' as const, // Pin the group column to the left during horizontal scroll
    cellRenderer: 'agGroupCellRenderer',
    cellRendererParams: {
      suppressCount: false,
      checkbox: false
    }
  }), [])

  // Configure group display type to show aggregated values
  const groupDisplayType = useMemo(() => 'groupRows' as const, [])

  const sideBar = useMemo(() => ({
    toolPanels: [
      {
        id: 'columns',
        labelDefault: 'Columns',
        labelKey: 'columns',
        iconKey: 'columns',
        toolPanel: 'agColumnsToolPanel',
        toolPanelParams: {
          suppressRowGroups: false,
          suppressValues: false,
          suppressPivots: false,
          suppressPivotMode: false,
          suppressColumnFilter: false,
          suppressColumnSelectAll: false,
          suppressColumnExpandAll: false,
          // Enable drag and drop from tool panel
          suppressSyncLayoutWithGrid: false,
          suppressColumnMove: false
        }
      },
      {
        id: 'filters',
        labelDefault: 'Filters',
        labelKey: 'filters',
        iconKey: 'filter',
        toolPanel: 'agFiltersToolPanel'
      }
    ],
    defaultToolPanel: 'columns'
  }), [])

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Editing Information Banner */}
      {isEditMode && !isPivotMode && isUserAuthorized && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Edit Mode Active</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>You can now edit cells by double-clicking on them. Editable fields include: Cost and Usage Count. Changed cells will be highlighted in yellow. Click "Save Changes" when you're done editing.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pivot Mode Information Banner */}
      {isPivotMode && isUserAuthorized && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Pivot Mode - Editing Disabled</h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>Pivot tables show aggregated data, so direct editing is not available. To edit data, switch to "Table View" first, then enable "Edit Mode". Changes to source data will automatically update the pivot table when you switch back.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Summary Statistics</h3>
        </div>

        {/* Summary Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{summaryStats.totalOrganizations}</div>
            <div className="text-sm text-blue-800">Organizations</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{summaryStats.totalProjects}</div>
            <div className="text-sm text-green-800">Projects</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{summaryStats.totalBuildspaces}</div>
            <div className="text-sm text-purple-800">Buildspaces</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">{summaryStats.totalUsers}</div>
            <div className="text-sm text-orange-800">Users</div>
          </div>
          <div className="bg-emerald-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-emerald-600">
              ${summaryStats.totalCost.toLocaleString()}
            </div>
            <div className="text-sm text-emerald-800">Cost</div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-indigo-600">{summaryStats.totalAgenticCost}</div>
            <div className="text-sm text-indigo-800">Agentic Task</div>
          </div>
          <div className="bg-pink-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-pink-600">{summaryStats.totalPrompts}</div>
            <div className="text-sm text-pink-800">Prompts</div>
          </div>
        </div>
      </Card>

      {/* Weekly Statistics Analytics */}
      <WeeklyStatsAnalytics data={data} />

      {/* Top 5 Tables - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Organizations Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-blue-600" />
              Top 5 Organizations
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Org Name - Domain Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No. of Users
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No. of Buildspaces
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topOrganizations.length > 0 ? (
                  topOrganizations.map((org, index) => (
                    <tr key={`org-${org.domainName}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {org.orgName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {org.noOfUsers.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {org.noOfBuildspaces.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-medium">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        }).format(org.cost)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                      {loading ? 'Loading organizations...' : 'No organization data available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top 5 Users Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-green-600" />
              Top 5 Users
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No. of Agent Task
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No. of Buildspaces
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topUsers.length > 0 ? (
                  topUsers.map((user, index) => (
                    <tr key={`user-${user.userName}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {user.userName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {user.noOfAgentTask.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {user.noOfBuildspaces.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-medium">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        }).format(user.cost)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                      {loading ? 'Loading users...' : 'No user data available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">Executive Overview Insights • Total {data.length} records {loading && ' • Loading...'}</h2>
        </div>
        
        {/* Search and Controls */}
        <div className="flex items-center space-x-3">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search records..."
              className="block w-64 pl-10 pr-10 py-1.5 text-sm text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 text-gray-400"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center space-x-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                <span>Refreshing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </div>
            )}
          </button>
          <button
            onClick={handleTogglePivotMode}
            className={`px-3 py-1 text-xs font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isPivotMode
                ? 'text-white bg-purple-600 border-purple-600 hover:bg-purple-700'
                : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            {isPivotMode ? 'Table View' : 'Pivot View'}
          </button>
          
          {isUserAuthorized && (
            <>
              <button
                onClick={handleToggleEditMode}
                disabled={isPivotMode}
                className={`px-3 py-1 text-xs font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isEditMode
                    ? 'text-white bg-blue-600 border-blue-600 hover:bg-blue-700'
                    : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                }`}
                title={isPivotMode ? 'Switch to Table View to enable editing' : ''}
              >
                {isEditMode ? 'Exit Edit Mode' : 'Edit Mode'}
              </button>
              {isEditMode && changedRows.size > 0 && !isPivotMode && (
                <button
                  data-save-button
                  onClick={handleSaveChanges}
                  className="px-3 py-1 text-xs font-medium text-white bg-green-600 border border-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes ({changedRows.size})
                </button>
              )}
            </>
          )}
          
          <ExportDropdown
            gridApi={gridApi}
            entityName="UserExtendedInsights"
            disabled={loading}
          />
        </div>
      </div>

      {/* AG Grid */}
      <div className="ag-theme-alpine" style={{ height: '600px', width: '100%' }}>
        <AgGridReact
          columnDefs={columnDefs}
          rowData={data}
          defaultColDef={defaultColDef}
          autoGroupColumnDef={autoGroupColumnDef}
          onGridReady={onGridReady}
          sideBar={sideBar}
          pivotMode={isPivotMode}
          rowGroupPanelShow={isPivotMode ? "always" : "never"}
          pivotPanelShow={isPivotMode ? "always" : "never"}
          suppressAggFuncInHeader={true}
          groupDisplayType={groupDisplayType}
          suppressAggAtRootLevel={false}
          alwaysShowHorizontalScroll={false}
          suppressHorizontalScroll={false}
          // Enable drag and drop functionality
          allowDragFromColumnsToolPanel={true}
          suppressDragLeaveHidesColumns={true}
          suppressMoveWhenRowDragging={true}
          animateRows={true}
          enableRangeSelection={true}
          enableCharts={true}
          suppressMenuHide={false}
          allowContextMenuWithControlKey={true}
          getContextMenuItems={(params) => [
            'copy',
            'copyWithHeaders',
            'paste',
            'separator',
            'chartRange',
            'separator',
            'export'
          ]}
          statusBar={{
            statusPanels: [
              { statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left' },
              { statusPanel: 'agSelectedRowCountComponent', align: 'center' },
              { statusPanel: 'agAggregationComponent', align: 'right' }
            ]
          }}
          enableCellTextSelection={true}
          ensureDomOrder={true}
          suppressRowClickSelection={false}
          rowSelection="multiple"
          // Event handlers for saving grid state
          onColumnMoved={onColumnMoved}
          onColumnResized={onColumnResized}
          onColumnVisible={onColumnVisible}
          onColumnPinned={onColumnPinned}
          onFilterChanged={onFilterChanged}
          onSortChanged={onSortChanged}
          onCellValueChanged={handleCellValueChanged}
          stopEditingWhenCellsLoseFocus={true}
          undoRedoCellEditing={true}
          undoRedoCellEditingLimit={20}
        />
      </div>
    </div>
  )
}
