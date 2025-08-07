'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, GridReadyEvent, GridApi, ColumnApi } from 'ag-grid-community'
import { createUserDataService, DataServiceState } from '@/lib/dataService'
import { UserModel } from '@/types'
import 'ag-grid-enterprise'

interface UserAgGridPivotProps {
  filters?: Record<string, string | undefined>
  className?: string
}

export function UserAgGridPivot({ 
  filters = {}, 
  className = '' 
}: UserAgGridPivotProps) {
  const [gridApi, setGridApi] = useState<GridApi | null>(null)
  const [columnApi, setColumnApi] = useState<ColumnApi | null>(null)
  const [state, setState] = useState<DataServiceState<UserModel>>({
    data: [],
    loading: true,
    error: null,
    hasMore: false,
    currentPage: 0,
    totalCount: 0
  })

  const dataService = useMemo(() => createUserDataService(), [])

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
      field: 'projectName',
      headerName: 'Project Name',
      rowGroup: true,
      hide: true,
      enableRowGroup: true,
      filter: 'agTextColumnFilter',
      sortable: true
    },
    {
      field: 'fullName',
      headerName: 'User Name',
      rowGroup: true,
      hide: true,
      enableRowGroup: true,
      filter: 'agTextColumnFilter',
      sortable: true
    },
    {
      field: 'email',
      headerName: 'Email',
      enablePivot: true,
      filter: 'agTextColumnFilter',
      sortable: true
    },
    {
      field: 'projectId',
      headerName: 'Project ID',
      enablePivot: true,
      filter: 'agTextColumnFilter',
      sortable: true
    },
    {
      field: 'status',
      headerName: 'Status',
      enablePivot: true,
      filter: 'agTextColumnFilter',
      sortable: true
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
      valueFormatter: (params) => {
        if (params.value == null) return '0'
        return new Intl.NumberFormat('en-US').format(params.value)
      }
    },
    {
      field: 'app_generated_count',
      headerName: 'Apps Generated',
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
      field: 'lastCodeGenieEventOn',
      headerName: 'Latest CodeGenie Event',
      enablePivot: true,
      filter: 'agDateColumnFilter',
      sortable: true,
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
    minWidth: 100,
    flex: 1
  }), [])

  const autoGroupColumnDef = useMemo(() => ({
    headerName: 'User Details',
    field: 'fullName',
    minWidth: 350,
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
          suppressColumnExpandAll: false
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
          <h2 className="text-lg font-semibold text-gray-900">User Level Insights - AG Grid Pivot</h2>
          <p className="text-sm text-gray-600">
            Interactive pivot table with advanced analytics • Total {state.totalCount} records
            {state.loading && ' • Loading...'}
          </p>
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
          suppressAggFuncInHeader={false}
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