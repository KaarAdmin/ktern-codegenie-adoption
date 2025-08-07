'use client'

import React, { useMemo } from 'react'
import { IDataOptions } from '@syncfusion/ej2-react-pivotview'
import { SyncfusionPivotTable } from './SyncfusionPivotTable'
import { createProjectDataService } from '@/lib/dataService'
import { ProjectModel } from '@/types'

interface ProjectPivotTableProps {
  filters?: Record<string, string | undefined>
  className?: string
}

export function ProjectPivotTable({ 
  filters = {}, 
  className = '' 
}: ProjectPivotTableProps) {
  const dataService = useMemo(() => createProjectDataService(), [])

  const dataSourceSettings: IDataOptions = {
    dataSource: [],
    expandAll: true,
    enableSorting: true,
    allowLabelFilter: true,
    allowValueFilter: true,
    rows: [
      { name: 'organizations', caption: 'Organizations' },
      { name: 'projectName', caption: 'Project Name' }
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
        name: 'totalUsers',
        caption: 'Users',
        showFilterIcon: true,
        showSortIcon: true,
      },
      {
        name: 'totalEvents',
        caption: 'Task Created With CodeGenie',
        showFilterIcon: true,
        showSortIcon: true
      },
    ],
    filters: [
      { name: 'projectId', caption: 'Project ID' },
      { name: 'createdOn', caption: 'Created Date' },
      { name: 'country', caption: 'Country' },
      { name: 'sbu', caption: 'SBU' },
      { name: 'industry', caption: 'Industry' },
      { name: 'active', caption: 'Status' },
      { name: 'eventsLast4Weeks', caption: 'Task Created With CodeGenie Last 4 Weeks'},
      { name: 'totalUsersInvited', caption: 'Users Invited'},
      { name: 'totalUsersAccepted', caption: 'Users Accepted'},
      { name: 'totalActiveUser', caption: 'Active Users'},
      { name: 'app_deployed_count', caption: 'App Deployed'},
      { name: 'app_generated_count', caption: 'App Generated'},
      { name: 'lastCodeGenieEventOn', caption: 'Last CodeGenie Event' },
    ],
    formatSettings: [
      { name: 'totalCost', format: 'C2' },
      { name: 'createdOn', format: 'dd/MM/yyyy' }
    ],
    conditionalFormatSettings: [
      {
        measure: 'totalCost',
        value1: 500,
        conditions: 'GreaterThan',
        style: {
          backgroundColor: '#ffcdd2',
          color: 'black',
          fontFamily: 'Tahoma',
          fontSize: '12px'
        }
      },
      {
        measure: 'totalUsers',
        value1: 10,
        conditions: 'GreaterThan',
        style: {
          backgroundColor: '#c8e6c9',
          color: 'black',
          fontFamily: 'Tahoma',
          fontSize: '12px'
        }
      },
      {
        measure: 'app_deployed_count',
        value1: 10,
        conditions: 'GreaterThan',
        style: {
          backgroundColor: '#bbdefb',
          color: 'black',
          fontFamily: 'Tahoma',
          fontSize: '12px'
        }
      }
    ],
    sortSettings: [
      { name: 'totalCost', order: 'Descending' }
    ]
  }

  return (
    <SyncfusionPivotTable
      title="Project Level Insights"
      dataService={dataService}
      dataSourceSettings={dataSourceSettings}
      filters={filters}
      className={className}
    />
  )
}
