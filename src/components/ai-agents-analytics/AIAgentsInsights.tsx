'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, GridReadyEvent, GridApi, ColumnApi } from 'ag-grid-community'
import { getAIAgentExtendedInsights, updateAIAgentExtendedData } from '@/lib/aiAgentsApi'
import { AIAgentExtendedModel } from '@/types/aiAgents'
import { ExportDropdown } from '@/components/ui/ExportDropdown'
import { Card } from '@/components/ui/Card'
import { isAuthorizedUser, getCurrentUserEmail } from '@/lib/auth'
import { useToastActions } from '@/contexts/ToastContext'
import { Calendar, Filter, RefreshCw, Users, Building2, FolderOpen, Layers, DollarSign, Zap, MessageSquare, Activity, ChevronDown, X, Check } from 'lucide-react'
import { AIAgentsWeeklyStats } from './AIAgentsWeeklyStats'
import { useClickOutside } from '@/hooks/useClickOutside'
import 'ag-grid-enterprise'

interface AIAgentsInsightsProps {
  filters?: Record<string, string | undefined>
  className?: string
}

interface SummaryStats {
  totalOrganizations: number
  totalProjects: number
  totalAgents: number
  totalUsers: number
  totalCost: number
  successRate: number
  totalTokens: number
}

interface TopOrganization {
  orgName: string
  domainName: string
  noOfUsers: number
  cost: number
}

interface TopAgent {
  agentName: string
  noOfRuns: number
  cost: number
}

export function AIAgentsInsights({
  filters = {},
  className = ''
}: AIAgentsInsightsProps) {
  const [gridApi, setGridApi] = useState<GridApi | null>(null)
  const [columnApi, setColumnApi] = useState<ColumnApi | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [data, setData] = useState<AIAgentExtendedModel[]>([])
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

  // Multi-project filter state
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const [projectSearchTerm, setProjectSearchTerm] = useState('')
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)

  // Multi-agent filter state
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([])

  const { showSuccess, showError } = useToastActions()

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
      
      const response = await getAIAgentExtendedInsights(combinedFilters)
      
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

  // Derive unique project list from loaded data
  const availableProjects = useMemo(() => {
    const seen = new Map<string, string>() // id -> projectName
    let hasUnassigned = false

    data.forEach(item => {
      // Fallback to projectName if projectId is missing to maintain legacy single-select behavior
      const id = item.projectId || item.projectName
      if (id) {
        if (!seen.has(id)) {
          seen.set(id, item.projectName || id)
        }
      } else {
        hasUnassigned = true
      }
    })

    const projects = Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))

    if (hasUnassigned) {
      projects.push({ id: 'UNASSIGNED_PROJECT', name: 'Unassigned / No Project' })
    }

    return projects
  }, [data])

  // Filtered project list based on search term in dropdown
  const filteredAvailableProjects = useMemo(() => {
    if (!projectSearchTerm.trim()) return availableProjects
    const lower = projectSearchTerm.toLowerCase()
    return availableProjects.filter(p => p.name.toLowerCase().includes(lower))
  }, [availableProjects, projectSearchTerm])

  // The data slice used by all views — respects multi-project selection.
  const filteredData = useMemo(() => {
    if (selectedProjectIds.length === 0) return data
    const idSet = new Set(selectedProjectIds)
    return data.filter(item => {
      const id = item.projectId || item.projectName
      if (id) {
        return idSet.has(id)
      }
      return idSet.has('UNASSIGNED_PROJECT')
    })
  }, [data, selectedProjectIds])

  // Project dropdown handlers
  const handleToggleProject = useCallback((projectId: string) => {
    setSelectedProjectIds(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }, [])

  const handleSelectAllProjects = useCallback(() => {
    setSelectedProjectIds([])
  }, [])

  const handleClearProjectFilter = useCallback(() => {
    setSelectedProjectIds([])
    setProjectSearchTerm('')
  }, [])

  // Agent dropdown handlers
  const handleToggleAgent = useCallback((agentId: string) => {
    setSelectedAgentIds(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    )
  }, [])

  const handleClearAgentFilter = useCallback(() => {
    setSelectedAgentIds([])
  }, [])

  // Close dropdown when clicking outside
  const projectDropdownRef = useRef<HTMLDivElement>(null)
  useClickOutside(projectDropdownRef, () => {
    setShowProjectDropdown(false)
  })

  // Calculate summary statistics
  const summaryStats = useMemo((): SummaryStats => {
    if (!filteredData.length) {
      return {
        totalOrganizations: 0,
        totalProjects: 0,
        totalAgents: 0,
        totalUsers: 0,
        totalCost: 0,
        successRate: 0,
        totalTokens: 0
      }
    }

    const uniqueDomains = new Set(
      filteredData
        .map(item => item.email && item.email.includes('@') ? item.email.split('@')[1] : '')
        .filter(Boolean)
    )
    const uniqueProjects = new Set(filteredData.map(item => item.projectId).filter(Boolean))
    const uniqueAgents = new Set(filteredData.map(item => item.agentId).filter(Boolean))
    const uniqueUsers = new Set(filteredData.map(item => item.email).filter(Boolean))

    const totalCost = filteredData.reduce((sum, item) => sum + (Number(item.cost) || 0), 0)
    const totalTokens = filteredData.reduce((sum, item) => sum + (Number(item.totalTokens) || 0), 0)
    
    const successfulRuns = filteredData.filter(item => item.status && item.status.toLowerCase() === 'completed').length
    const successRate = (successfulRuns / filteredData.length) * 100

    return {
      totalOrganizations: uniqueDomains.size || 0,
      totalProjects: uniqueProjects.size || 0,
      totalAgents: uniqueAgents.size || 0,
      totalUsers: uniqueUsers.size || 0,
      totalCost: parseFloat(totalCost.toFixed(2)) || 0,
      successRate: parseFloat(successRate.toFixed(1)) || 0,
      totalTokens: totalTokens || 0
    }
  }, [filteredData])

  // Calculate Top 5 Organizations
  const topOrganizations = useMemo((): TopOrganization[] => {
    if (!filteredData.length) return []

    const orgMap = new Map<string, {
      domain: string
      users: Set<string>
      cost: number
    }>()

    // Aggregate data by email domain
    filteredData.forEach(item => {
      // Always extract domain from email
      const emailDomain = item.email && item.email.includes('@') ? item.email.split('@')[1] : 'unknown'
      
      if (!orgMap.has(emailDomain)) {
        orgMap.set(emailDomain, {
          domain: emailDomain,
          users: new Set(),
          cost: 0
        })
      }

      const org = orgMap.get(emailDomain)!
      org.users.add(item.email)
      org.cost += (Number(item.cost) || 0)
    })

    // Convert to array and sort by cost (descending)
    return Array.from(orgMap.values())
      .map(org => ({
        orgName: org.domain,
        domainName: org.domain,
        noOfUsers: org.users.size,
        cost: org.cost
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5)
  }, [filteredData])

  // Calculate Top 5 Agents
  const topAgents = useMemo((): TopAgent[] => {
    if (!filteredData.length) return []

    const agentMap = new Map<string, {
      name: string
      sessions: Set<string>
      cost: number
    }>()

    // Aggregate data by agent ID / Name
    filteredData.forEach(item => {
      const key = item.agentName || item.agentId || 'Unknown Agent'
      if (!agentMap.has(key)) {
        agentMap.set(key, {
          name: key,
          sessions: new Set(),
          cost: 0
        })
      }

      const agent = agentMap.get(key)!
      agent.sessions.add(item.sessionId)
      agent.cost += (Number(item.cost) || 0)
    })

    // Convert to array and sort by cost (descending)
    return Array.from(agentMap.values())
      .map(agent => ({
        agentName: agent.name,
        noOfRuns: agent.sessions.size,
        cost: agent.cost
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5)
  }, [filteredData])

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
    if (event.data && event.data.agentId) {
      // Create unique identifier using sessionId
      const uniqueKey = event.data.sessionId
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
            const nodeUniqueKey = node.data.sessionId
            
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
      const result = await updateAIAgentExtendedData(changedData)
      
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
    return isUserAuthorized && isEditMode && !isPivotMode && params.data && params.data.sessionId
  }, [isUserAuthorized, isEditMode, isPivotMode])

  // Custom cell style function to highlight edited cells
  const getCellStyle = useCallback((params: any) => {
    if (params.data) {
      const uniqueKey = params.data.sessionId
      if (changedRows.has(uniqueKey)) {
        return { backgroundColor: '#fff3cd', border: '1px solid #ffc107' }
      }
    }
    return null
  }, [changedRows])

  // Generate monthly cost columns dynamically.
  // Deliberately uses full `data` (not filteredData) so columns stay stable
  // and never appear/disappear when the project filter changes.
  const monthlyColumns = useMemo(() => {
    if (!data.length) return []

    // Get unique months from the full dataset
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
      field: 'agentName',
      headerName: 'Agent Name',
      rowGroup: isPivotMode,
      hide: isPivotMode,
      enableRowGroup: true,
      filter: 'agTextColumnFilter',
      sortable: true
    },
    {
      field: 'user',
      headerName: 'User Name',
      rowGroup: isPivotMode,
      hide: isPivotMode,
      enableRowGroup: true,
      filter: 'agTextColumnFilter',
      sortable: true
    },
    {
      field: 'purpose',
      headerName: 'Purpose',
      enableRowGroup: true,
      filter: 'agTextColumnFilter',
      sortable: true,
      minWidth: 120
    },
    {
      field: 'environment',
      headerName: 'Environment',
      enableRowGroup: true,
      filter: 'agTextColumnFilter',
      sortable: true,
      minWidth: 100
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
      sortable: true
    },
    {
      field: 'inputTokens',
      headerName: 'Input Tokens',
      aggFunc: 'sum',
      enableValue: true,
      sortable: true,
      filter: 'agNumberColumnFilter',
      minWidth: 120,
      valueFormatter: (params) => {
        if (params.value == null) return '0'
        return new Intl.NumberFormat('en-US').format(Number(params.value))
      }
    },
    {
      field: 'outputTokens',
      headerName: 'Output Tokens',
      aggFunc: 'sum',
      enableValue: true,
      sortable: true,
      filter: 'agNumberColumnFilter',
      minWidth: 120,
      valueFormatter: (params) => {
        if (params.value == null) return '0'
        return new Intl.NumberFormat('en-US').format(Number(params.value))
      }
    },
    {
      field: 'totalTokens',
      headerName: 'Total Tokens',
      aggFunc: 'sum',
      enableValue: true,
      sortable: true,
      filter: 'agNumberColumnFilter',
      minWidth: 120,
      valueFormatter: (params) => {
        if (params.value == null) return '0'
        return new Intl.NumberFormat('en-US').format(Number(params.value))
      }
    },
    {
      field: 'cost',
      headerName: 'Cost',
      aggFunc: 'sum',
      enableValue: true,
      sortable: true,
      filter: 'agNumberColumnFilter',
      minWidth: 100,
      valueFormatter: (params) => {
        if (params.value == null) return '$0.00'
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 3
        }).format(Number(params.value))
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      enableRowGroup: true,
      filter: 'agTextColumnFilter',
      sortable: true,
      minWidth: 120,
      cellStyle: (params) => {
        if (params.value && params.value.toLowerCase() === 'completed') {
          return { color: '#0f766e', fontWeight: 'bold' }
        }
        if (params.value && params.value.toLowerCase() === 'error') {
          return { color: '#be123c', fontWeight: 'bold' }
        }
        return null
      }
    },
    // Add monthly cost columns dynamically
    ...monthlyColumns
  ], [monthlyColumns, isPivotMode])

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

  // Transform data to extract email domain as organization before passing to grid
  const gridData = useMemo(() => {
    return filteredData.map(item => ({
      ...item,
      // Override domain field with email domain extraction
      domain: item.email && item.email.includes('@') ? item.email.split('@')[1] : (item.domain || 'Unknown')
    }))
  }, [filteredData])

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
          <div 
            className="bg-blue-50 p-4 rounded-lg text-center cursor-help transition-all duration-200 hover:bg-blue-100 hover:shadow-md"
            title="Total number of active organizations"
          >
            <div className="text-2xl font-bold text-blue-600">{summaryStats.totalOrganizations}</div>
            <div className="text-sm text-blue-800">Organizations</div>
          </div>
          <div 
            className="bg-green-50 p-4 rounded-lg text-center cursor-help transition-all duration-200 hover:bg-green-100 hover:shadow-md"
            title="Total number of active projects across all organizations"
          >
            <div className="text-2xl font-bold text-green-600">{summaryStats.totalProjects}</div>
            <div className="text-sm text-green-800">Projects</div>
          </div>
          <div 
            className="bg-purple-50 p-4 rounded-lg text-center cursor-help transition-all duration-200 hover:bg-purple-100 hover:shadow-md"
            title="Total number of active AI agents"
          >
            <div className="text-2xl font-bold text-purple-600">{summaryStats.totalAgents}</div>
            <div className="text-sm text-purple-800">Agents</div>
          </div>
          <div 
            className="bg-orange-50 p-4 rounded-lg text-center cursor-help transition-all duration-200 hover:bg-orange-100 hover:shadow-md"
            title="Total number of active users across all organizations"
          >
            <div className="text-2xl font-bold text-orange-600">{summaryStats.totalUsers}</div>
            <div className="text-sm text-orange-800">Users</div>
          </div>
          <div 
            className="bg-emerald-50 p-4 rounded-lg text-center cursor-help transition-all duration-200 hover:bg-emerald-100 hover:shadow-md"
            title="Total cost incurred across all users, projects, and organizations"
          >
            <div className="text-xl md:text-1.5xl font-bold text-emerald-600">
              ${summaryStats.totalCost.toLocaleString()}
            </div>
            <div className="text-sm text-emerald-800">Cost</div>
          </div>
          <div 
            className="bg-indigo-50 p-4 rounded-lg text-center cursor-help transition-all duration-200 hover:bg-indigo-100 hover:shadow-md"
            title="Success rate of agent runs"
          >
            <div className="text-2xl font-bold text-indigo-600">{summaryStats.successRate}%</div>
            <div className="text-sm text-indigo-800">Success Rate</div>
          </div>
          <div 
            className="bg-pink-50 p-4 rounded-lg text-center cursor-help transition-all duration-200 hover:bg-pink-100 hover:shadow-md"
            title="Total number of tokens consumed"
          >
            <div className="text-2xl font-bold text-pink-600">{new Intl.NumberFormat('en-US', { notation: 'compact' }).format(summaryStats.totalTokens)}</div>
            <div className="text-sm text-pink-800">Total Tokens</div>
          </div>
        </div>
      </Card>

      {/* Combined Daily Statistics Analytics and User Trend */}
      <Card className="p-3">
        <div className="flex flex-col space-y-3">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-semibold text-gray-900">Daily Statistics Analytics & User Trend</h2>
              <span className="text-sm text-gray-500">Analyze daily trends across users, projects, and organizations</span>
            </div>
          </div>
          
          {/* WeeklyStatsAnalytics Component */}
          <AIAgentsWeeklyStats
            data={filteredData}
            allData={data}
            selectedProjectIds={selectedProjectIds}
            selectedAgentIds={selectedAgentIds}
            onProjectToggle={handleToggleProject}
            onProjectClear={handleClearProjectFilter}
            onAgentToggle={handleToggleAgent}
            onAgentClear={handleClearAgentFilter}
          />
        </div>
      </Card>


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
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
                      {loading ? 'Loading organizations...' : 'No organization data available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top 5 Agents Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-green-600" />
              Top 5 Agents by Usage
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No. of Runs
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topAgents.length > 0 ? (
                  topAgents.map((agent, index) => (
                    <tr key={`agent-${agent.agentName}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {agent.agentName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {agent.noOfRuns.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-medium">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        }).format(agent.cost)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
                      {loading ? 'Loading agents...' : 'No agent data available'}
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
          <h2 className="text-lg font-semibold text-gray-900">Executive Overview Insights • Total {filteredData.length} records{selectedProjectIds.length > 0 ? ` (${selectedProjectIds.length} project${selectedProjectIds.length > 1 ? 's' : ''} selected)` : ''} {loading && ' • Loading...'}</h2>
        </div>
        
        {/* Search and Controls */}
        <div className="flex items-center space-x-3">
          {/* Multi-Project Filter Dropdown */}
          <div className="relative" data-project-dropdown ref={projectDropdownRef}>
            <button
              onClick={() => setShowProjectDropdown(prev => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${
                selectedProjectIds.length > 0
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <FolderOpen className="h-3.5 w-3.5" />
              <span>
                {selectedProjectIds.length === 0
                  ? 'All Projects'
                  : `${selectedProjectIds.length} Project${selectedProjectIds.length > 1 ? 's' : ''}`}
              </span>
              {selectedProjectIds.length > 0 ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={e => { e.stopPropagation(); handleClearProjectFilter() }}
                  onKeyDown={e => e.key === 'Enter' && (e.stopPropagation(), handleClearProjectFilter())}
                  className="ml-0.5 hover:text-blue-200"
                  title="Clear project filter"
                >
                  <X className="h-3 w-3" />
                </span>
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>

            {showProjectDropdown && (
              <div className="absolute left-0 top-full mt-1 z-50 w-72 bg-white border border-gray-200 rounded-lg shadow-lg">
                {/* Search inside dropdown */}
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    value={projectSearchTerm}
                    onChange={e => setProjectSearchTerm(e.target.value)}
                    placeholder="Search projects..."
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                </div>

                {/* Select All / Clear row */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 bg-gray-50">
                  <button
                    onClick={handleSelectAllProjects}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Show All
                  </button>
                  {selectedProjectIds.length > 0 && (
                    <button
                      onClick={handleClearProjectFilter}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear ({selectedProjectIds.length})
                    </button>
                  )}
                  <span className="text-xs text-gray-400">
                    {filteredAvailableProjects.length} / {availableProjects.length}
                  </span>
                </div>

                {/* Project list */}
                <div className="max-h-60 overflow-y-auto py-1">
                  {/* All Projects Option */}
                  <button
                    onClick={handleSelectAllProjects}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                      selectedProjectIds.length === 0 ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className={`flex-shrink-0 h-4 w-4 rounded border flex items-center justify-center ${
                      selectedProjectIds.length === 0
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300 bg-white'
                    }`}>
                      {selectedProjectIds.length === 0 && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className={`truncate ${selectedProjectIds.length === 0 ? 'text-blue-800 font-medium' : 'text-gray-700'}`}>
                      All Projects
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">({availableProjects.length})</span>
                  </button>
                  
                  {filteredAvailableProjects.length === 0 ? (
                    <div className="px-3 py-4 text-xs text-gray-500 text-center">No projects found</div>
                  ) : (
                    filteredAvailableProjects.map(project => {
                      const isSelected = selectedProjectIds.includes(project.id)
                      return (
                        <button
                          key={project.id}
                          onClick={() => handleToggleProject(project.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50 transition-colors ${
                            isSelected ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className={`flex-shrink-0 h-4 w-4 rounded border flex items-center justify-center ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-300 bg-white'
                          }`}>
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span className={`truncate ${isSelected ? 'text-blue-800 font-medium' : 'text-gray-700'}`}>
                            {project.name}
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

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
          rowData={gridData}
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
