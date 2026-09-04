'use client'

import React, { useMemo, useState, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, GridReadyEvent, GridApi, ColumnApi } from 'ag-grid-community'
import { AdoptionTableRow } from '@/types'
import 'ag-grid-enterprise'

interface AdoptionPivotGridProps {
  rows: AdoptionTableRow[]
  loading?: boolean
  className?: string
}

export function AdoptionPivotGrid({ rows, loading = false, className = '' }: AdoptionPivotGridProps) {
  const [gridApi, setGridApi] = useState<GridApi | null>(null)
  const [columnApi, setColumnApi] = useState<ColumnApi | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isPivotMode, setIsPivotMode] = useState(false)

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api)
    setColumnApi(params.columnApi)
  }, [])

  // Quick filter
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setSearchTerm(value)
      gridApi?.setQuickFilter(value)
    },
    [gridApi]
  )

  const handleTogglePivotMode = useCallback(() => {
    setIsPivotMode((prev) => {
      const next = !prev
      gridApi?.setPivotMode(next)
      return next
    })
  }, [gridApi])

  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        field: 'date',
        headerName: 'Date',
        enableRowGroup: true,
        enablePivot: true,
        filter: 'agDateColumnFilter',
        sortable: true,
        // Group by calendar day
        valueGetter: (params) => {
          const d = params.data?.date ? new Date(params.data.date) : null
          if (!d || isNaN(d.getTime())) return ''
          return d.toISOString().slice(0, 10)
        },
      },
      {
        field: 'projectName',
        headerName: 'Project',
        enableRowGroup: true,
        enablePivot: true,
        filter: 'agTextColumnFilter',
        sortable: true,
      },
      {
        field: 'name',
        headerName: 'User',
        enableRowGroup: true,
        enablePivot: true,
        filter: 'agTextColumnFilter',
        sortable: true,
        valueGetter: (params) => params.data?.name || params.data?.email || 'Unknown User',
      },
      {
        field: 'email',
        headerName: 'Email',
        hide: true,
        enableRowGroup: true,
        enablePivot: true,
        filter: 'agTextColumnFilter',
        sortable: true,
      },
      {
        field: 'buildSpaceId',
        headerName: 'Buildspace',
        enableRowGroup: true,
        enablePivot: true,
        filter: 'agTextColumnFilter',
        sortable: true,
      },
      {
        field: 'usageCount',
        headerName: 'Prompts',
        aggFunc: 'sum',
        enableValue: true,
        filter: 'agNumberColumnFilter',
        sortable: true,
        valueFormatter: (params) =>
          params.value == null ? '0' : new Intl.NumberFormat('en-US').format(params.value),
      },
      {
        field: 'cost',
        headerName: 'Cost',
        aggFunc: 'sum',
        enableValue: true,
        filter: 'agNumberColumnFilter',
        sortable: true,
        valueFormatter: (params) =>
          params.value == null
            ? '$0.00'
            : new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 3,
              }).format(params.value),
      },
    ],
    []
  )

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      minWidth: 110,
      enableRowGroup: true,
      enablePivot: true,
      enableValue: true,
      editable: false,
    }),
    []
  )

  const autoGroupColumnDef = useMemo(
    () => ({
      headerName: 'Group',
      minWidth: 280,
      pinned: 'left' as const,
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: { suppressCount: false },
    }),
    []
  )

  const sideBar = useMemo(
    () => ({
      toolPanels: [
        {
          id: 'columns',
          labelDefault: 'Columns',
          labelKey: 'columns',
          iconKey: 'columns',
          toolPanel: 'agColumnsToolPanel',
        },
        {
          id: 'filters',
          labelDefault: 'Filters',
          labelKey: 'filters',
          iconKey: 'filter',
          toolPanel: 'agFiltersToolPanel',
        },
      ],
      defaultToolPanel: '',
    }),
    []
  )

  return (
    <div className={className}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-800">Raw usage rows</h2>
          <span className="text-xs text-gray-500">
            {rows.length.toLocaleString()} rows{loading ? ' • Loading…' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search rows..."
            className="h-8 w-56 rounded-md border border-gray-300 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleTogglePivotMode}
            className={`px-3 py-1 text-xs font-medium rounded-md border ${
              isPivotMode
                ? 'text-white bg-purple-600 border-purple-600 hover:bg-purple-700'
                : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            {isPivotMode ? 'Table View' : 'Pivot View'}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="ag-theme-alpine" style={{ height: '560px', width: '100%' }}>
        <AgGridReact
          columnDefs={columnDefs}
          rowData={rows}
          defaultColDef={defaultColDef}
          autoGroupColumnDef={autoGroupColumnDef}
          onGridReady={onGridReady}
          sideBar={sideBar}
          pivotMode={isPivotMode}
          rowGroupPanelShow={isPivotMode ? 'always' : 'never'}
          pivotPanelShow={isPivotMode ? 'always' : 'never'}
          suppressAggFuncInHeader={true}
          allowDragFromColumnsToolPanel={true}
          suppressDragLeaveHidesColumns={true}
          animateRows={true}
          enableRangeSelection={true}
          enableCharts={true}
          enableCellTextSelection={true}
          ensureDomOrder={true}
          statusBar={{
            statusPanels: [
              { statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left' },
              { statusPanel: 'agAggregationComponent', align: 'right' },
            ],
          }}
          getContextMenuItems={() => [
            'copy',
            'copyWithHeaders',
            'separator',
            'chartRange',
            'separator',
            'export',
          ]}
        />
      </div>
    </div>
  )
}
