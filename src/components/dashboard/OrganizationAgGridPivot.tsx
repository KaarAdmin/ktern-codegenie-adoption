'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, GridReadyEvent, GridApi, ColumnApi } from 'ag-grid-community'
import { createOrganizationDataService, DataServiceState } from '@/lib/dataService'
import { OrganizationModel } from '@/types'
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
  const [state, setState] = useState<DataServiceState<OrganizationModel>>({
    data: [],
    loading: true,
    error: null,
    hasMore: false,
    currentPage: 0,
    totalCount: 0
  })

  const dataService = useMemo(() => createOrganizationDataService(), [])

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
  }, [])

  const handleRefresh = useCallback(() => {
    dataService.loadInitialData(filters)
  }, [dataService, filters])

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
      field: 'country',
      headerName: 'Country',
      enablePivot: true,
      filter: 'agTextColumnFilter',
      sortable: true
    },
    {
      field: 'sbu',
      headerName: 'SBU',
      enablePivot: true,
      filter: 'agTextColumnFilter',
      sortable: true
    },
    {
      field: 'industry',
      headerName: 'Industry',
      enablePivot: true,
      filter: 'agTextColumnFilter',
      sortable: true
    },
    {
      field: 'active',
      headerName: 'Status',
      enablePivot: true,
      filter: 'agTextColumnFilter',
      sortable: true,
      valueFormatter: (params) => params.value ? 'Active' : 'Inactive'
    },
    {
      field: 'totalCost',
      headerName: 'Cost',
      aggFunc: 'sum',
      enableValue: true,
      filter: 'agNumberColumnFilter',
      sortable: true,
      valueFormatter: (params) => {
        if (params.value == null) return '0'
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(params.value)
      }
    },
    {
      field: 'totalEvents',
      headerName: 'CodeGenie Events',
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
      headerName: 'CodeGenie Events in Last 4 Weeks',
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
      field: 'app_deployed_count',
      headerName: 'Apps Deployed',
      enableValue: true,
      filter: 'agNumberColumnFilter',
      sortable: true,
      valueFormatter: (params) => {
        if (params.value == null) return '0'
        return new Intl.NumberFormat('en-US').format(params.value)
      }
    },
    {
      field: 'app_generated_count',
      headerName: 'Apps Generated',
      enableValue: true,
      filter: 'agNumberColumnFilter',
      sortable: true,
      valueFormatter: (params) => {
        if (params.value == null) return '0'
        return new Intl.NumberFormat('en-US').format(params.value)
      }
    },
    {
      field: 'totalActiveUser',
      headerName: 'Active Users',
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
      headerName: 'Invited Users',
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
      headerName: 'Accepted Users',
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
      enableValue: true,
      filter: 'agNumberColumnFilter',
      sortable: true,
      valueFormatter: (params) => {
        if (params.value == null) return '0'
        return new Intl.NumberFormat('en-US').format(params.value)
      }
    },
    {
      field: 'createdOn',
      headerName: 'Created Date',
      enablePivot: true,
      filter: 'agDateColumnFilter',
      sortable: true,
      valueFormatter: (params) => {
        if (!params.value) return ''
        return new Date(params.value).toLocaleDateString()
      }
    },
    {
      field: 'lastCodeGenieEventOn',
      headerName: 'Latest CodeGenie Event',
      enablePivot: true,
      filter: 'agDateColumnFilter',
      sortable: true,
      minWidth: 200,
      valueFormatter: (params) => {
        if (!params.value) return 'Never'
        return new Date(params.value).toLocaleDateString()
      }
    }
  ], [])

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
    suppressSizeToFit: false
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Organization Level Insights • Total {state.totalCount} records {state.loading && ' • Loading...'}</h2>
        </div>
        
        {/* Controls */}
        <div className="flex items-center space-x-2">
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
            onClick={() => gridApi?.exportDataAsCsv()}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Export CSV
          </button>
          <button
            onClick={() => gridApi?.exportDataAsExcel()}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Export Excel
          </button>
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
          pivotMode={true}
          rowGroupPanelShow="always"
          pivotPanelShow="always"
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