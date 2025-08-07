'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { DataService } from '@/lib/dataService'
import { Card } from '@/components/ui/Card'
import { FallbackTable } from './FallbackTable'

interface SyncfusionPivotTableProps {
  title: string
  dataService: DataService<any>
  dataSourceSettings: any
  filters?: Record<string, string | undefined>
  className?: string
}

export function SyncfusionPivotTable({
  title,
  dataService,
  dataSourceSettings,
  filters = {},
  className = ''
}: SyncfusionPivotTableProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [pivotReady, setPivotReady] = useState(false)
  const [useFallback, setUseFallback] = useState(false)
  const [syncfusionLoaded, setSyncfusionLoaded] = useState(false)
  const [PivotViewComponent, setPivotViewComponent] = useState<any>(null)
  const [InjectComponent, setInjectComponent] = useState<any>(null)
  const [FieldList, setFieldList] = useState<any>(null)
  const [GroupingBar, setGroupingBar] = useState<any>(null)
  const [CalculatedField, setCalculatedField] = useState<any>(null)
  const pivotRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mountTimeoutRef = useRef<NodeJS.Timeout>()

  // Load Syncfusion components
  useEffect(() => {
    const loadSyncfusion = async () => {
      try {
        // Initialize Syncfusion license first
        const { initializeSyncfusion } = await import('@/lib/syncfusionConfig')
        initializeSyncfusion()

        // Load Syncfusion components
        const pivotModule = await import('@syncfusion/ej2-react-pivotview')
        setPivotViewComponent(() => pivotModule.PivotViewComponent)
        setInjectComponent(() => pivotModule.Inject)
        setFieldList(() => pivotModule.FieldList)
        setGroupingBar(() => pivotModule.GroupingBar)
        setCalculatedField(() => pivotModule.CalculatedField)
        setSyncfusionLoaded(true)
        console.log('Syncfusion components loaded successfully')
      } catch (error) {
        console.error('Failed to load Syncfusion components:', error)
        setUseFallback(true)
      }
    }

    if (typeof window !== 'undefined') {
      setIsClient(true)
      loadSyncfusion()
    }
  }, [])

  // Set pivot ready after components are loaded
  useEffect(() => {
    if (syncfusionLoaded && isClient) {
      mountTimeoutRef.current = setTimeout(() => {
        setPivotReady(true)
      }, 500)
    }

    return () => {
      if (mountTimeoutRef.current) {
        clearTimeout(mountTimeoutRef.current)
      }
    }
  }, [syncfusionLoaded, isClient])

  // Subscribe to data service
  useEffect(() => {
    if (!isClient) return

    const unsubscribe = dataService.subscribe((state: any) => {
      setData(state.data)
      setLoading(state.loading)
      setError(state.error)
    })

    dataService.loadInitialData(filters)

    return () => {
      unsubscribe()
    }
  }, [dataService, filters, isClient])

  // Auto-fallback after timeout
  useEffect(() => {
    if (pivotReady && data.length > 0 && !useFallback) {
      const fallbackTimer = setTimeout(() => {
        if (!pivotRef.current) {
          console.warn('Pivot table failed to initialize, falling back to table view')
          setUseFallback(true)
        }
      }, 5000) // 5 second timeout

      return () => clearTimeout(fallbackTimer)
    }
  }, [pivotReady, data.length, useFallback])

  const updatedDataSourceSettings = {
    ...dataSourceSettings,
    dataSource: data
  }

  // Debug data structure
  useEffect(() => {
    if (data.length > 0) {
      console.log('🔍 Data structure for pivot table:', {
        dataLength: data.length,
        sampleRecord: data[0],
        availableFields: Object.keys(data[0] || {}),
        dataSourceSettings: updatedDataSourceSettings
      })
    }
  }, [data, updatedDataSourceSettings])

  const handlePivotCreated = useCallback(() => {
    console.log('Pivot table created successfully')
    setError(null)
  }, [])

  const handlePivotError = useCallback((err: any) => {
    console.error('Pivot table error:', err)
    setError('Failed to render pivot table')
    setUseFallback(true)
  }, [])

  // Disable fallback now that we know data is loading
  // if (error || useFallback) {
  //   return (
  //     <FallbackTable
  //       title={title}
  //       dataService={dataService}
  //       filters={filters}
  //       className={className}
  //     />
  //   )
  // }

  if (!isClient) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Initializing...</span>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {loading && (
            <div className="text-sm text-gray-500">Loading data...</div>
          )}
        </div>
        <button
          onClick={() => setUseFallback(true)}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
          title="Switch to table view"
        >
          Table View
        </button>
      </div>
      
      <div 
        ref={containerRef}
        className="w-full"
        style={{ minHeight: '600px' }}
      >
        {pivotReady && PivotViewComponent && data.length > 0 && (
          <div className="pivot-container">
            <div className="text-center text-blue-600 mb-4 p-2 bg-blue-50 rounded">
              🎯 Total {data.length} records
            </div>
            <ErrorBoundary onError={() => setUseFallback(true)}>
              <PivotViewComponent
                ref={pivotRef}
                id={`pivot-${title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`}
                dataSourceSettings={updatedDataSourceSettings}
                width="100%"
                height="600px"
                showFieldList={true}
                showGroupingBar={true}
                allowExcelExport={true}
                allowPdfExport={true}
                allowCalculatedField={true}
                allowDrillThrough={true}
                allowConditionalFormatting={true}
                allowNumberFormatting={true}
                enableValueSorting={true} 
                created={handlePivotCreated}
                actionFailure={handlePivotError}
                gridSettings={{
                  columnWidth: 120,
                  allowSelection: true,
                  selectionSettings: {
                    mode: 'Both',
                    type: 'Multiple'
                  }
                }}
              >
                {InjectComponent && FieldList && GroupingBar && CalculatedField && (
                  <InjectComponent services={[FieldList, GroupingBar, CalculatedField]} />
                )}
              </PivotViewComponent>
            </ErrorBoundary>
          </div>
        )}
        
        {pivotReady && PivotViewComponent && data.length === 0 && !loading && (
          <div className="text-center text-yellow-600 p-8 border border-yellow-200 rounded-lg bg-yellow-50">
            <h4 className="font-semibold mb-2">No Data Available</h4>
            <p className="text-sm mb-4">The pivot table has no data to display.</p>
            <div className="text-xs text-left bg-white p-3 rounded border">
              <div><strong>Debug Info:</strong></div>
              <div>Data Length: {data.length}</div>
              <div>Loading: {loading ? 'Yes' : 'No'}</div>
              <div>Error: {error || 'None'}</div>
              <div>Filters: {JSON.stringify(filters)}</div>
            </div>
            <button
              onClick={() => {
                console.log('Refreshing data...')
                dataService.refresh()
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Data
            </button>
          </div>
        )}
        
        {pivotReady && data.length === 0 && !loading && (
          <div className="text-center text-gray-500 mt-8">
            No data available for pivot table
          </div>
        )}
        
        {!pivotReady && (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Preparing pivot table...</span>
            <div className="mt-4 text-sm text-gray-500">
              <div>Client: {isClient ? '✓' : '✗'}</div>
              <div>Syncfusion Loaded: {syncfusionLoaded ? '✓' : '✗'}</div>
              <div>Data Length: {data.length}</div>
              <div>Loading: {loading ? 'Yes' : 'No'}</div>
              <div>Error: {error || 'None'}</div>
            </div>
          </div>
        )}
        
        {/* {pivotReady && PivotViewComponent && data.length > 0 && (
          <div className="text-center text-green-600 mb-4">
            ✓ Pivot table should render below
          </div>
        )} */}
        
        {pivotReady && !PivotViewComponent && (
          <div className="text-center text-red-600 mb-4">
            ✗ PivotViewComponent not loaded
          </div>
        )}
      </div>
    </Card>
  )
}

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Pivot table error boundary caught:', error, errorInfo)
    this.props.onError()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center text-red-500 p-4">
          <p>Something went wrong with the pivot table.</p>
          <p className="text-sm text-gray-600 mt-2">Switching to table view...</p>
        </div>
      )
    }

    return this.props.children
  }
}
