'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, GridReadyEvent, GridApi, ColumnApi } from 'ag-grid-community'
import { createOrganizationDataService, DataServiceState } from '@/lib/dataService'
import { updateOrganizationData } from '@/lib/api'
import { OrganizationModel } from '@/types'
import { ExportDropdown } from '@/components/ui/ExportDropdown'
import { isAuthorizedUser, getCurrentUserEmail } from '@/lib/auth'
import { useToastActions } from '@/contexts/ToastContext'
import 'ag-grid-enterprise'

interface OrganizationAgGridPivotProps {
  filters?: Record<string, string | undefined>
  className?: string
}

export function OrganizationAgGridPivot({
  filters = {},
  className = ''
}: OrganizationAgGridPivotProps) {
  const [gridApi, setGridApi] = useState<GridApi | null>(null)
  const [columnApi, setColumnApi] = useState<ColumnApi | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [isPivotMode, setIsPivotMode] = useState(true)
  const [changedRows, setChangedRows] = useState<Set<string>>(new Set())
  const [isUserAuthorized, setIsUserAuthorized] = useState(false)
  const [state, setState] = useState<DataServiceState<OrganizationModel>>({
    data: [],
    loading: true,
    error: null,
    hasMore: false,
    currentPage: 0,
    totalCount: 0
  })

  const { showSuccess, showError, showWarning, showInfo } = useToastActions()
  const dataService = useMemo(() => createOrganizationDataService(), [])

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

  useEffect(() => {
    const unsubscribe = dataService.subscribe(setState)
    dataService.loadInitialData(filters)
    
    return () => {
      unsubscribe()
      dataService.destroy()
    }
  }, [dataService, filters])

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api)
    setColumnApi(params.columnApi)
    
    // Load saved grid state from localStorage
    const savedState = localStorage.getItem('organizationPivotGridState')
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

  // Save grid state to localStorage
  const saveGridState = useCallback(() => {
    if (gridApi && columnApi) {
      const gridState = {
        columnState: columnApi.getColumnState(),
        filterModel: gridApi.getFilterModel(),
        timestamp: Date.now()
      }
      localStorage.setItem('organizationPivotGridState', JSON.stringify(gridState))
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

  const handleRefresh = useCallback(() => {
    dataService.loadInitialData(filters)
  }, [dataService, filters])

  const handleToggleEditMode = useCallback(() => {
    if (!isUserAuthorized) {
      showError('You are not authorized to edit this data. Please contact your administrator.')
      return
    }
    setIsEditMode(!isEditMode)
    setChangedRows(new Set())
    if (gridApi) {
      gridApi.refreshCells()
    }
  }, [isEditMode, gridApi, isUserAuthorized, showError])

  const handleTogglePivotMode = useCallback(() => {
    setIsPivotMode(!isPivotMode)
    setChangedRows(new Set())
    if (gridApi) {
      gridApi.setPivotMode(!isPivotMode)
    }
  }, [isPivotMode, gridApi])

  const handleCellValueChanged = useCallback((event: any) => {
    if (event.data && event.data.organization) {
      setChangedRows(prev => new Set(prev).add(event.data.organization))
      console.log('Cell value changed:', {
        rowId: event.data.organization,
        field: event.colDef.field,
        oldValue: event.oldValue,
        newValue: event.newValue,
        rowData: event.data
      })
      
      // Refresh the row to apply the new cell styling
      if (gridApi) {
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
    gridApi.forEachNode((node) => {
      if (node.data && changedRows.has(node.data.organization)) {
        changedData.push(node.data)
      }
    })

    console.log('Saving changes:', {
      totalChangedRows: changedRows.size,
      changedData: changedData
    })

    try {
      // Show loading state
      const saveButton = document.querySelector('[data-save-button]') as HTMLButtonElement
      if (saveButton) {
        saveButton.disabled = true
        saveButton.textContent = 'Saving...'
      }

      // Make API call to save the data
      const result = await updateOrganizationData(changedData)
      
      if (result.status_code === 201) {
        setChangedRows(new Set())
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
  }, [gridApi, changedRows, handleRefresh, showSuccess, showError])

  // Custom function to check if a node is editable
  const isRowEditable = useCallback((params: any) => {
    // Only allow editing if user is authorized, in edit mode, NOT in pivot mode, and has actual data
    return isUserAuthorized && isEditMode && !isPivotMode && params.data && params.data.organization
  }, [isUserAuthorized, isEditMode, isPivotMode])

  // Custom cell style function to highlight edited cells
  const getCellStyle = useCallback((params: any) => {
    if (params.data && changedRows.has(params.data.organization)) {
      return { backgroundColor: '#fff3cd', border: '1px solid #ffc107' }
    }
    return null
  }, [changedRows])

  const columnDefs: ColDef[] = useMemo(() => [
    {
      field: 'organization',
      headerName: 'Organization',
      rowGroup: true,
      hide: true,
      enableRowGroup: true,
      filter: 'agTextColumnFilter',
      sortable: true
    },
    {
      field: 'active',
      headerName: 'Status',
      enableValue: true,
      aggFunc: (params) => {
        const values = params.values as string[];
        if (!values || values.length === 0) return null;

        const counts = values.reduce((acc, val) => {
          acc[val] = (acc[val] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Pick the most frequent value, breaking ties by preferring "Active"
        return Object.entries(counts).reduce((a, b) => {
          if (b[1] > a[1]) return b;
          if (b[1] === a[1]) {
            if (b[0] === 'Active') return b; // prefer Active in ties
          }
          return a;
        })[0];
      },
      editable: isRowEditable,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Active', 'Inactive']
      },
      valueGetter: (params) => params.data?.active ? 'Active' : 'Inactive',
      valueSetter: (params) => {
        const newValue = params.newValue === 'Active'
        params.data.active = newValue
        return true
      },
      valueFormatter: (params) => params.value,
      getQuickFilterText: (params) => params.value,
      cellStyle: getCellStyle
    },
    {
      field: 'country',
      headerName: 'Country',
      enablePivot: true,
      filter: 'agTextColumnFilter',
      aggFunc: 'first',
      sortable: true,
      editable: isRowEditable,
      cellStyle: getCellStyle
    },
    {
      field: 'sbu',
      headerName: 'SBU',
      enablePivot: true,
      filter: 'agTextColumnFilter',
      aggFunc: 'first',
      sortable: true,
      editable: isRowEditable,
      cellStyle: getCellStyle
    },
    {
      field: 'industry',
      headerName: 'Industry',
      enablePivot: true,
      filter: 'agTextColumnFilter',
      aggFunc: 'first',
      sortable: true,
      editable: isRowEditable,
      cellStyle: getCellStyle
    },
    {
      field: 'createdOn',
      headerName: 'Created Date',
      enableValue: true,
      aggFunc: 'first',
      valueFormatter: (params) => {
        if (!params.value) return ''
        const date = new Date(params.value)
        return isNaN(date.getTime()) ? '' : date.toLocaleDateString()
      }
    }
    ,
    {
      field: 'lastCodeGenieEventOn',
      headerName: 'Latest CodeGenie Event',
      enableValue: true,
      minWidth: 200,
      aggFunc: 'first',
      valueFormatter: (params) => {
        if (!params.value) return ''
        const date = new Date(params.value)
        return isNaN(date.getTime()) ? '' : date.toLocaleDateString()
      }
    },
    {
      field: 'totalProject',
      headerName: 'Projects',
      aggFunc: 'sum',
      enableValue: true,
      filter: 'agNumberColumnFilter',
      sortable: true,
      valueFormatter: (params) => {
        if (params.value == null) return '0'
        return new Intl.NumberFormat('en-US').format(params.value)
      }
    },
    {
      field: 'totalActiveProject',
      headerName: 'Active Projects',
      aggFunc: 'sum',
      enableValue: true,
      filter: 'agNumberColumnFilter',
      sortable: true,
      valueFormatter: (params) => {
        if (params.value == null) return '0'
        return new Intl.NumberFormat('en-US').format(params.value)
      }
    },
    {
      field: 'totalUsers',
      headerName: 'Users',
      aggFunc: 'sum',
      enableValue: true,
      filter: 'agNumberColumnFilter',
      sortable: true,
      valueFormatter: (params) => {
        if (params.value == null) return '0'
        return new Intl.NumberFormat('en-US').format(params.value)
      }
    },
    {
      field: 'totalUsersInvited',
      headerName: 'Users Status Invited',
      aggFunc: 'sum',
      enableValue: true,
      filter: 'agNumberColumnFilter',
      sortable: true,
      minWidth: 130,
      valueFormatter: (params) => {
        if (params.value == null) return '0'
        return new Intl.NumberFormat('en-US').format(params.value)
      }
    },
    {
      field: 'totalUsersAccepted',
      headerName: 'Users Status Accepted',
      aggFunc: 'sum',
      enableValue: true,
      filter: 'agNumberColumnFilter',
      sortable: true,
      minWidth: 140,
      valueFormatter: (params) => {
        if (params.value == null) return '0'
        return new Intl.NumberFormat('en-US').format(params.value)
      }
    },
    {
      field: 'totalActiveUser',
      headerName: 'Active Users',
      aggFunc: 'sum',
      enableValue: true,
      filter: 'agNumberColumnFilter',
      sortable: true,
      valueFormatter: (params) => {
        if (params.value == null) return '0'
        return new Intl.NumberFormat('en-US').format(params.value)
      }
    },
    {
      field: 'app_deployed_count',
      headerName: 'Apps Deployed',
      aggFunc: 'sum',
      enableValue: true,
      filter: 'agNumberColumnFilter',
      sortable: true,
      editable: isRowEditable,
      cellEditor: 'agTextCellEditor',
      cellEditorParams: {
        parseValue: (value: string) => {
          const numValue = parseInt(value, 10)
          return isNaN(numValue) || numValue < 0 ? 0 : numValue
        }
      },
      valueFormatter: (params) => {
        if (params.value == null) return '0'
        return new Intl.NumberFormat('en-US').format(params.value)
      },
      cellStyle: getCellStyle
    },
    {
      field: 'app_generated_count',
      headerName: 'Apps Generated',
      aggFunc: 'sum',
      enableValue: true,
      filter: 'agNumberColumnFilter',
      sortable: true,
      editable: isRowEditable,
      cellEditor: 'agTextCellEditor',
      cellEditorParams: {
        parseValue: (value: string) => {
          const numValue = parseInt(value, 10)
          return isNaN(numValue) || numValue < 0 ? 0 : numValue
        }
      },
      valueFormatter: (params) => {
        if (params.value == null) return '0'
        return new Intl.NumberFormat('en-US').format(params.value)
      },
      cellStyle: getCellStyle
    },
    {
      field: 'totalEvents',
      headerName: 'Agentic Tasks',
      aggFunc: 'sum',
      enableValue: true,
      filter: 'agNumberColumnFilter',
      sortable: true,
      valueFormatter: (params) => {
        if (params.value == null) return '0'
        return new Intl.NumberFormat('en-US').format(params.value)
      }
    },
    {
      field: 'eventsLast4Weeks',
      headerName: 'Agentic Tasks in Last 4 Weeks',
      aggFunc: 'sum',
      enableValue: true,
      filter: 'agNumberColumnFilter',
      sortable: true,
      minWidth: 280, // Wider for longer header
      valueFormatter: (params) => {
        if (params.value == null) return '0'
        return new Intl.NumberFormat('en-US').format(params.value)
      }
    },
    {
      field: 'totalCost',
      headerName: 'Cost',
      aggFunc: 'sum',
      enableValue: true,
      filter: 'agNumberColumnFilter',
      sortable: true,
      valueFormatter: (params) => {
        if (params.value == null) return '$0.00'
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 3
        }).format(params.value)
      }
    }
  ], [isRowEditable])

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 90,
    // Remove flex to allow auto-sizing based on content
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
    headerName: 'Organization',
    field: 'organization',
    minWidth: 250,
    pinned: 'left' as const, // Pin the group column to the left during horizontal scroll
    cellRenderer: 'agGroupCellRenderer',
    cellRendererParams: {
      suppressCount: false,
      checkbox: false
    }
  }), [])

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

  if (state.error) {
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
              <p>{state.error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Editing Information Banner */}
      {isEditMode && !isPivotMode &&  isUserAuthorized &&(
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
                <p>You can now edit cells by double-clicking on them. Editable fields include: Country, SBU, Industry, Status, Apps Deployed, and Apps Generated. Click "Save Changes" when you're done editing.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pivot Mode Information Banner */}
      {isPivotMode && isUserAuthorized &&(
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">Organization Level Insights • Total {state.totalCount} records {state.loading && ' • Loading...'}</h2>
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
              placeholder="Search organizations..."
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
            disabled={state.loading}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.loading ? (
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
            entityName="Organizations"
            disabled={state.loading}
          />
        </div>
      </div>

      {/* AG Grid */}
      <div className="ag-theme-alpine" style={{ height: '600px', width: '100%' }}>
        <AgGridReact
          columnDefs={columnDefs}
          rowData={state.data}
          defaultColDef={defaultColDef}
          autoGroupColumnDef={autoGroupColumnDef}
          onGridReady={onGridReady}
          sideBar={sideBar}
          pivotMode={isPivotMode}
          rowGroupPanelShow={isPivotMode ? "always" : "never"}
          pivotPanelShow={isPivotMode ? "always" : "never"}
          suppressAggFuncInHeader={true}
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

      {/* Loading indicator */}
      {state.loading && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Loading data...</span>
          </div>
        </div>
      )}
    </div>
  )
}
