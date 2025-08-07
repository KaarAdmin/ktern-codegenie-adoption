'use client'

import React, { useMemo } from 'react'
import { IDataOptions } from '@syncfusion/ej2-react-pivotview'
import { SyncfusionPivotTable } from './SyncfusionPivotTable'
import { createUserDataService } from '@/lib/dataService'
import { UserModel } from '@/types'

interface UserPivotTableProps {
  filters?: Record<string, string | undefined>
  className?: string
}

export function UserPivotTable({ 
  filters = {}, 
  className = '' 
}: UserPivotTableProps) {
  const dataService = useMemo(() => createUserDataService(), [])

  const dataSourceSettings: IDataOptions = {
    dataSource: [],
    expandAll: true,
    enableSorting: true,
    allowLabelFilter: true,
    allowValueFilter: true,
    rows: [
      { name: 'organization', caption: 'Organization' },
      { name: 'projectName', caption: 'Project Name' },
      { name: 'fullName', caption: 'User Name' },
    ],
    columns: [
    ],
    values: [
      {
        name: 'totalCost',
        caption: 'Cost',
        showFilterIcon: true,
        showSortIcon: true
      },
      {
        name: 'totalEvents',
        caption: 'Task Created With CodeGenie',
        showFilterIcon: true,
        showSortIcon: true
      }
    ],
    filters: [
      { name: 'status', caption: 'Status' },
      { name: 'projectId', caption: 'Project ID'},
      { name: 'eventsLast4Weeks', caption: 'Recent Events'},
      { name: 'app_deployed_count', caption: 'App Deployed'},
      { name: 'app_generated_count', caption: 'App Generated'},
      { name: 'lastCodeGenieEventOn', caption: 'Last CodeGenie Event' },
      { name: 'email', caption: 'Email' }
    ],
    formatSettings: [
      { name: 'totalCost', format: 'C2' }
    ],
    conditionalFormatSettings: [
    ],
    sortSettings: [
      { name: 'totalCost', order: 'Descending' },
      { name: 'totalEvents', order: 'Descending' }
    ]
  }

  return (
    <SyncfusionPivotTable
      title="User Level Insights"
      dataService={dataService}
      dataSourceSettings={dataSourceSettings}
      filters={filters}
      className={className}
    />
  )
}
