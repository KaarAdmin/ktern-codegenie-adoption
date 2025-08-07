'use client'

import React, { useEffect, useState } from 'react'
import { DataService } from '@/lib/dataService'
import { Card } from '@/components/ui/Card'

interface FallbackTableProps {
  title: string
  dataService: DataService<any>
  filters?: Record<string, string | undefined>
  className?: string
}

export function FallbackTable({
  title,
  dataService,
  filters = {},
  className = ''
}: FallbackTableProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    const unsubscribe = dataService.subscribe((state: any) => {
      setData(state.data)
      setLoading(state.loading)
      setError(state.error)
    })

    dataService.loadInitialData(filters)

    return () => {
      unsubscribe()
    }
  }, [dataService, filters])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const sortedData = React.useMemo(() => {
    if (!sortField || !data.length) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortField] || 0
      const bVal = b[sortField] || 0
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
      }
      
      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()
      
      if (sortOrder === 'asc') {
        return aStr.localeCompare(bStr)
      } else {
        return bStr.localeCompare(aStr)
      }
    })
  }, [data, sortField, sortOrder])

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">{title}</h3>
          <p className="text-red-500">Error loading data: {error}</p>
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading data...</span>
          </div>
        </div>
      </Card>
    )
  }

  if (!data.length) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-500">No data available</p>
        </div>
      </Card>
    )
  }

  // Get the first few items to determine columns
  const sampleItem = data[0]
  const columns = Object.keys(sampleItem).filter(key => 
    typeof sampleItem[key] === 'number' || 
    typeof sampleItem[key] === 'string'
  ).slice(0, 8) // Limit to 8 columns for better display

  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">
          Showing {sortedData.length} records • Click column headers to sort
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  onClick={() => handleSort(column)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                    {sortField === column && (
                      <span className="text-blue-600">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.slice(0, 50).map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {typeof item[column] === 'number' 
                      ? column.toLowerCase().includes('cost') 
                        ? `$${item[column].toLocaleString()}`
                        : item[column].toLocaleString()
                      : String(item[column] || '-')
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {sortedData.length > 50 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Showing first 50 of {sortedData.length} records
        </div>
      )}
    </Card>
  )
}
