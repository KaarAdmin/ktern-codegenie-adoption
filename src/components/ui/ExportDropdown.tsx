'use client'

import React, { useState, useRef, useEffect } from 'react'
import { GridApi, ColDef } from 'ag-grid-community'

interface ExportDropdownProps {
  gridApi: GridApi | null
  entityName: string
  disabled?: boolean
}

export function ExportDropdown({ gridApi, entityName, disabled = false }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleExportCsv = () => {
    if (gridApi) {
      gridApi.exportDataAsCsv({
        fileName: `${entityName.toLowerCase()}_export_${new Date().toISOString().split('T')[0]}.csv`,
        columnSeparator: ',',
        suppressQuotes: false,
        skipColumnHeaders: false,
        skipColumnGroupHeaders: false,
        skipPinnedTop: false,
        skipPinnedBottom: false,
        allColumns: false,
        onlySelected: false,
        onlySelectedAllPages: false
      })
    }
    setIsOpen(false)
  }

  const handleExportExcel = () => {
    if (gridApi) {
      gridApi.exportDataAsExcel({
        fileName: `${entityName.toLowerCase()}_export_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: entityName,
        columnWidth: 100,
        headerRowHeight: 30,
        rowHeight: 20,
        skipColumnHeaders: false,
        skipColumnGroupHeaders: false,
        skipPinnedTop: false,
        skipPinnedBottom: false,
        allColumns: false,
        onlySelected: false,
        onlySelectedAllPages: false
      })
    }
    setIsOpen(false)
  }

  const handleExportSelectedCsv = () => {
    if (gridApi) {
      const selectedRows = gridApi.getSelectedRows()
      if (selectedRows.length === 0) {
        alert('Please select rows to export')
        return
      }
      gridApi.exportDataAsCsv({
        fileName: `${entityName.toLowerCase()}_selected_export_${new Date().toISOString().split('T')[0]}.csv`,
        onlySelected: true,
        columnSeparator: ',',
        suppressQuotes: false,
        skipColumnHeaders: false
      })
    }
    setIsOpen(false)
  }

  const handleExportSelectedExcel = () => {
    if (gridApi) {
      const selectedRows = gridApi.getSelectedRows()
      if (selectedRows.length === 0) {
        alert('Please select rows to export')
        return
      }
      gridApi.exportDataAsExcel({
        fileName: `${entityName.toLowerCase()}_selected_export_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: `Selected ${entityName}`,
        onlySelected: true,
        columnWidth: 100,
        headerRowHeight: 30,
        rowHeight: 20,
        skipColumnHeaders: false
      })
    }
    setIsOpen(false)
  }

  const handleExportVisibleCsv = () => {
    if (gridApi) {
      gridApi.exportDataAsCsv({
        fileName: `${entityName.toLowerCase()}_visible_export_${new Date().toISOString().split('T')[0]}.csv`,
        allColumns: false,
        columnSeparator: ',',
        suppressQuotes: false,
        skipColumnHeaders: false,
        skipColumnGroupHeaders: false
      })
    }
    setIsOpen(false)
  }

  const handleExportVisibleExcel = () => {
    if (gridApi) {
      gridApi.exportDataAsExcel({
        fileName: `${entityName.toLowerCase()}_visible_export_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: `Visible ${entityName}`,
        allColumns: false,
        columnWidth: 100,
        headerRowHeight: 30,
        rowHeight: 20,
        skipColumnHeaders: false,
        skipColumnGroupHeaders: false
      })
    }
    setIsOpen(false)
  }

  const handlePrintToPdf = () => {
    if (gridApi) {
      // Get displayed data including group information
      const displayedData: any[] = []
      
      // Get all displayed rows (including group rows)
      gridApi.forEachNodeAfterFilterAndSort((node) => {
        if (node.data) {
          const rowData: any = { ...node.data }
          
          // Build group hierarchy for multi-level grouping
          let currentNode = node.parent
          const groupPath: string[] = []
          
          // Traverse up the group hierarchy to collect all group keys
          while (currentNode && currentNode.key) {
            groupPath.unshift(currentNode.key)
            currentNode = currentNode.parent
          }
          
          // Add group information based on the hierarchy
          if (groupPath.length > 0) {
            // For organization-based grouping
            if (groupPath[0]) {
              rowData.organization = groupPath[0]
            }
            // For project-based grouping (second level)
            if (groupPath[1]) {
              rowData.projectName = groupPath[1]
            }
            // For user-based grouping (third level)
            if (groupPath[2]) {
              rowData.fullName = groupPath[2]
            }
          }
          
          displayedData.push(rowData)
        }
      })

      // Create a new window with printable content
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        const columns = gridApi.getColumnDefs()
        
        // Create a list of columns to display, including row group columns
        const visibleColumns: ColDef[] = []
        
        // Find and add all row group columns in order
        const rowGroupFields = ['organization', 'organizations', 'projectName', 'fullName']
        
        rowGroupFields.forEach(fieldName => {
          const groupColumn = columns?.find((col): col is ColDef =>
            'field' in col && col.field === fieldName && col.rowGroup === true
          )
          if (groupColumn) {
            visibleColumns.push({
              ...groupColumn,
              hide: false, // Force show in PDF
              headerName: groupColumn.headerName || fieldName
            })
          }
        })
        
        // Add other visible columns (excluding row group columns since we added them above)
        const otherColumns = columns?.filter((col): col is ColDef =>
          'field' in col && col.field != null && !col.hide && !col.rowGroup
        ) || []
        
        visibleColumns.push(...otherColumns)
        
        let htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>${entityName} Export</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; margin-bottom: 20px; }
              table { border-collapse: collapse; width: 100%; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
              th { background-color: #f2f2f2; font-weight: bold; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .export-info { margin-bottom: 20px; color: #666; font-size: 14px; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <h1>${entityName} Export</h1>
            <div class="export-info">
              <p>Exported on: ${new Date().toLocaleString()}</p>
              <p>Total records: ${displayedData.length}</p>
            </div>
            <button class="no-print" onclick="window.print()" style="margin-bottom: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Print to PDF</button>
            <table>
              <thead>
                <tr>
                  ${visibleColumns.map(col => `<th>${col.headerName || col.field}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${displayedData.map((row: any) => `
                  <tr>
                    ${visibleColumns.map(col => {
                      let value = row[col.field || '']
                      if (value === null || value === undefined) value = ''
                      if (typeof value === 'boolean') value = value ? 'Yes' : 'No'
                      if (typeof value === 'number' && col.field?.includes('Cost')) {
                        value = new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(value)
                      } else if (typeof value === 'number') {
                        value = new Intl.NumberFormat('en-US').format(value)
                      }
                      if (col.field?.includes('Date') || col.field?.includes('On')) {
                        const date = new Date(value)
                        if (!isNaN(date.getTime())) {
                          value = date.toLocaleDateString()
                        }
                      }
                      return `<td>${String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
          </html>
        `
        
        printWindow.document.write(htmlContent)
        printWindow.document.close()
      }
    }
    setIsOpen(false)
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export
        <svg className="h-3 w-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right bg-white border border-gray-200 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
              All Data
            </div>
            <button
              onClick={handleExportCsv}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <svg className="h-4 w-4 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export as CSV
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <svg className="h-4 w-4 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export as Excel
            </button>

            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 border-t border-gray-100 mt-1">
              Visible Columns Only
            </div>
            <button
              onClick={handleExportVisibleCsv}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <svg className="h-4 w-4 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Visible CSV
            </button>
            <button
              onClick={handleExportVisibleExcel}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <svg className="h-4 w-4 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Visible Excel
            </button>

            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 border-t border-gray-100 mt-1">
              Selected Rows Only
            </div>
            <button
              onClick={handleExportSelectedCsv}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <svg className="h-4 w-4 mr-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Selected CSV
            </button>
            <button
              onClick={handleExportSelectedExcel}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <svg className="h-4 w-4 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Selected Excel
            </button>

            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 border-t border-gray-100 mt-1">
              Print & PDF
            </div>
            <button
              onClick={handlePrintToPdf}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <svg className="h-4 w-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print to PDF
            </button>
          </div>
        </div>
      )}
    </div>
  )
}