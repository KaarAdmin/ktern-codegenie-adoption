'use client'

import React, { useMemo } from 'react'
import { IDataOptions } from '@syncfusion/ej2-react-pivotview'
import { SyncfusionPivotTable } from './SyncfusionPivotTable'
import { createOrganizationDataService } from '@/lib/dataService'
import { OrganizationModel } from '@/types'

interface OrganizationPivotTableProps {
  filters?: Record<string, string | undefined>
  className?: string
}

export function OrganizationPivotTable({ 
  filters = {}, 
  className = '' 
}: OrganizationPivotTableProps) {
  const dataService = useMemo(() => createOrganizationDataService(), [])

  const dataSourceSettings: IDataOptions = {
    dataSource: [],
    expandAll: true,
    enableSorting: true,
    allowLabelFilter: true,
    allowValueFilter: true,
    showHeaderWhenEmpty: false,
    alwaysShowValueHeader: true,
    
    rows: [
      { name: 'organization', caption: 'Organization', showFilterIcon: true, allowDragAndDrop: true }
    ],
    columns: [
    ],
    values: [
      {
        name: 'totalCost',
        caption: 'Cost',
        showFilterIcon: true,
      },
      {
        name: 'totalEvents',
        caption: 'Task Created With CodeGenie',
        showFilterIcon: true,
      }
    ],
    filters: [
      { name: 'country', caption: 'Country', showFilterIcon: true, allowDragAndDrop: true },
      { name: 'sbu', caption: 'SBU', showFilterIcon: true, allowDragAndDrop: true },
      { name: 'industry', caption: 'Industry', showFilterIcon: true, allowDragAndDrop: true },
      { name: 'active', caption: 'Status', showFilterIcon: true, allowDragAndDrop: true },
      {
        name: 'app_deployed_count',
        caption: 'App Deployed',
        showFilterIcon: true,
        showSortIcon: true
      },
      {
        name: 'app_generated_count',
        caption: 'App Generated',
        showFilterIcon: true,
        showSortIcon: true,
      },
      { name: 'eventsLast4Weeks', caption: 'Task Created With CodeGenie Last 4 Weeks',  showFilterIcon: true, allowDragAndDrop: true },
      { name: 'totalActiveUser', caption: 'Active Users',  showFilterIcon: true, allowDragAndDrop: true },
      { name: 'totalUsersInvited', caption: 'Users Invited',  showFilterIcon: true, allowDragAndDrop: true },
      { name: 'totalUsersAccepted', caption: 'Users Accepted',  showFilterIcon: true, allowDragAndDrop: true },
      { name: 'totalProject', caption: 'Total Projects',  showFilterIcon: true, allowDragAndDrop: true },
      { name: 'totalActiveProject', caption: 'Active Projects',  showFilterIcon: true, allowDragAndDrop: true },
      { name: 'app_deployed_count', caption: 'App Deployed',  showFilterIcon: true, allowDragAndDrop: true },
      { name: 'app_generated_count', caption: 'App Generated',  showFilterIcon: true, allowDragAndDrop: true },
      { name: 'lastCodeGenieEventOn', caption: 'Last CodeGenie Event', showFilterIcon: true, allowDragAndDrop: true },
      { name: 'createdOn', caption: 'Created Date', showFilterIcon: true, allowDragAndDrop: true },
    ],
    sortSettings: [
      { name: 'app_deployed_count', order: 'Descending' },
      { name: 'app_generated_count', order: 'Descending' }
    ],
    filterSettings: [
      { name: 'app_deployed_count', type: 'Value', condition: 'GreaterThanOrEqualTo', value1: '0' },
      { name: 'app_generated_count', type: 'Value', condition: 'GreaterThanOrEqualTo', value1: '0' }
    ],
    formatSettings: [
      { name: 'app_deployed_count', format: 'N0' },
      { name: 'app_generated_count', format: 'N0' }
    ]
  }

  return (
    <SyncfusionPivotTable
      title="Organization Level Insights"
      dataService={dataService}
      dataSourceSettings={dataSourceSettings}
      filters={filters}
      className={className}
    />
  )
}
