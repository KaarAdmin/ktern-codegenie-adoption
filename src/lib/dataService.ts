import { 
  getOrganizationLevelInsightsResponse, 
  getprojectLevelInsights, 
  getUserLevelInsightsResponse 
} from '@/lib/api'
import { 
  OrganizationModel, 
  ProjectModel, 
  UserModel,
  OrganizationLevelInsightsResponse,
  ProjectLevelInsightsResponse,
  UserLevelInsightsResponse
} from '@/types'

export interface BatchLoadConfig {
  batchSize: number
  delayMs: number
  autoRefreshIntervalMs: number
}

export interface DataServiceState<T> {
  data: T[]
  loading: boolean
  error: string | null
  hasMore: boolean
  currentPage: number
  totalCount: number
}

export type DataType = 'organization' | 'project' | 'user'

export class DataService<T> {
  private config: BatchLoadConfig
  private state: DataServiceState<T>
  private listeners: Set<(state: DataServiceState<T>) => void> = new Set()
  private batchLoadTimer: NodeJS.Timeout | null = null
  private autoRefreshTimer: NodeJS.Timeout | null = null
  private dataType: DataType
  private filters: Record<string, string | undefined>
  private allData: T[] = [] // Store all data for simulated batch loading
  private batchLoadingPaused: boolean = true

  constructor(
    dataType: DataType,
    config: BatchLoadConfig = {
      batchSize: 10,
      delayMs: 5000, // 5 seconds between batchesrg
      autoRefreshIntervalMs: 300000 // 5 minutes
    }
  ) {
    this.dataType = dataType
    this.config = config
    this.filters = {}
    this.state = {
      data: [],
      loading: false,
      error: null,
      hasMore: true,
      currentPage: 0,
      totalCount: 0
    }
  }

  subscribe(listener: (state: DataServiceState<T>) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.state }))
  }

  private updateState(updates: Partial<DataServiceState<T>>) {
    this.state = { ...this.state, ...updates }
    this.notifyListeners()
  }

  private async fetchData(start: number, end: number): Promise<{ data: T[], totalCount: number }> {
    const filters = {
      ...this.filters,
      start: start.toString(),
      end: end.toString(),
    }

    try {
      switch (this.dataType) {
        case 'organization': {
          const response = await getOrganizationLevelInsightsResponse(filters) as OrganizationLevelInsightsResponse
          // console.log('Organization API Response:', response) // Debug log
          return {
            data: (response.organizations || []) as T[],
            totalCount: response.count || 0
          }
        }
        case 'project': {
          const response = await getprojectLevelInsights(filters) as ProjectLevelInsightsResponse
          // console.log('Project API Response:', response) // Debug log
          return {
            data: (response.projects || []) as T[],
            totalCount: response.count || 0
          }
        }
        case 'user': {
          const response = await getUserLevelInsightsResponse(filters) as UserLevelInsightsResponse
          // console.log('User API Response:', response) // Debug log
          return {
            data: (response.users || []) as T[],
            totalCount: response.count || 0
          }
        }
        default:
          throw new Error(`Unknown data type: ${this.dataType}`)
      }
    } catch (error) {
      console.error('Data fetch error:', error) // Debug log
      
      // Handle authentication errors specifically
      if (error instanceof Error && (
        error.message.includes('Authentication required') ||
        error.message.includes('Token has expired') ||
        error.message.includes('401')
      )) {
        // Clear tokens and reload window for authentication errors
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ktoken')
          localStorage.removeItem('krefreshToken')
          setTimeout(() => {
            window.location.reload()
          }, 100)
        }
      }
      
      throw error instanceof Error ? error : new Error('Failed to fetch data')
    }
  }

  async loadInitialData(filters: Record<string, string | undefined> = {}) {
    console.log(`[${this.dataType}] Loading initial data with filters:`, filters)
    this.filters = filters
    this.updateState({
      data: [],
      loading: true,
      error: null,
      hasMore: true,
      currentPage: 0,
      totalCount: 0
    })

    try {
      // First batch: start = 0 * batchSize, end = 1 * batchSize
      const start = 0 * this.config.batchSize
      const end = 1 * this.config.batchSize
      console.log(`[${this.dataType}] Fetching data from ${start} to ${end}`)
      const { data, totalCount } = await this.fetchData(start, end)
      console.log(`[${this.dataType}] Initial data loaded:`, { 
        start, 
        end, 
        dataLength: data.length, 
        totalCount,
        batchSize: this.config.batchSize,
        sampleData: data.slice(0, 2) // Show first 2 records for debugging
      })
      
      // Continue to next batch if API returned data
      const hasMore = data.length > 0
      console.log(`[${this.dataType}] Has more data (data.length > 0):`, hasMore)
      
      this.updateState({
        data,
        loading: false,
        currentPage: 1,
        totalCount: totalCount || data.length,
        hasMore
      })

      // Start batch loading - continue making API calls until empty array
      if (hasMore) {
        console.log(`[${this.dataType}] Starting batch loading with API calls...`)
        this.startBatchLoading()
      } else {
        console.log(`[${this.dataType}] No data returned, stopping`)
      }
    } catch (error) {
      console.error(`[${this.dataType}] Error loading initial data:`, error)
      this.updateState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data'
      })
    }
  }

  private startBatchLoading() {
    if (this.batchLoadTimer) {
      clearTimeout(this.batchLoadTimer)
    }

    // console.log(`[${this.dataType}] Scheduling next batch API call in ${this.config.delayMs}ms`)
    this.batchLoadTimer = setTimeout(async () => {
      if (!this.state.hasMore) {
        // console.log(`[${this.dataType}] No more data to load, stopping batch loading`)
        return
      }
      
      if (this.state.loading) {
        // console.log(`[${this.dataType}] Already loading, skipping batch`)
        return
      }

      if (this.batchLoadingPaused) {
        // console.log(`[${this.dataType}] Batch loading is paused, skipping`)
        this.startBatchLoading() // Reschedule for next check
        return
      }

      // Calculate next batch range using the formula:
      // start = currentPage * batchSize, end = (currentPage + 1) * batchSize
      const start = this.state.currentPage * this.config.batchSize
      const end = (this.state.currentPage + 1) * this.config.batchSize
      // console.log(`[${this.dataType}] Making batch API call:`, { 
      //   currentPage: this.state.currentPage,
      //   start, 
      //   end,
      //   batchSize: this.config.batchSize
      // })

      try {
        const { data: newData } = await this.fetchData(start, end)
        // console.log(`[${this.dataType}] Batch API response:`, { newDataLength: newData.length })
        
        const updatedData = [...this.state.data, ...newData]
        
        // Continue loading only if API returned data (stop when empty array)
        const hasMore = newData.length > 0
        // console.log(`[${this.dataType}] After batch API call:`, {
        //   totalLoaded: updatedData.length,
        //   newDataLength: newData.length,
        //   hasMore: hasMore ? 'Yes (got data)' : 'No (empty array)'
        // })

        this.updateState({
          data: updatedData,
          currentPage: this.state.currentPage + 1,
          totalCount: updatedData.length,
          hasMore
        })

        // Continue batch loading if API returned data
        if (hasMore) {
          // console.log(`[${this.dataType}] Continuing batch loading...`)
          this.startBatchLoading()
        } else {
          // console.log(`[${this.dataType}] Batch loading completed - API returned empty array`)
        }
      } catch (error) {
        console.error(`[${this.dataType}] Error loading batch:`, error)
        this.updateState({
          error: error instanceof Error ? error.message : 'Failed to load batch data'
        })
      }
    }, this.config.delayMs)
  }

  startAutoRefresh() {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer)
    }

    // console.log(`[${this.dataType}] Starting auto-refresh every ${this.config.autoRefreshIntervalMs}ms`)
    this.autoRefreshTimer = setInterval(() => {
      // console.log(`[${this.dataType}] Auto-refresh triggered`)
      this.refresh()
    }, this.config.autoRefreshIntervalMs)
  }

  stopAutoRefresh() {
    if (this.autoRefreshTimer) {
      // console.log(`[${this.dataType}] Stopping auto-refresh`)
      clearInterval(this.autoRefreshTimer)
      this.autoRefreshTimer = null
    }
  }

  async refresh() {
    // console.log(`[${this.dataType}] Manual refresh triggered`)
    await this.loadInitialData(this.filters)
  }

  updateFilters(newFilters: Record<string, string | undefined>) {
    this.filters = { ...this.filters, ...newFilters }
    this.loadInitialData(this.filters)
  }

  getState(): DataServiceState<T> {
    return { ...this.state }
  }

  pauseBatchLoading() {
    this.batchLoadingPaused = true
    // console.log(`[${this.dataType}] Batch loading paused`)
  }

  resumeBatchLoading() {
    this.batchLoadingPaused = false
    // console.log(`[${this.dataType}] Batch loading resumed`)
    // If there's more data and no timer is running, restart batch loading
    if (this.state.hasMore && !this.batchLoadTimer) {
      this.startBatchLoading()
    }
  }

  isBatchLoadingPaused(): boolean {
    return this.batchLoadingPaused
  }

  destroy() {
    if (this.batchLoadTimer) {
      clearTimeout(this.batchLoadTimer)
    }
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer)
    }
    this.listeners.clear()
  }
}

// Factory functions for creating data services
export const createOrganizationDataService = (config?: Partial<BatchLoadConfig>) =>
  new DataService<OrganizationModel>('organization', {
    batchSize: 5000,
    delayMs: 10000, // 10 seconds between batches
    autoRefreshIntervalMs: 300000, // 5 minutes
    ...config
  })

export const createProjectDataService = (config?: Partial<BatchLoadConfig>) =>
  new DataService<ProjectModel>('project', {
    batchSize: 5000,
    delayMs: 10000, // 10 seconds between batches
    autoRefreshIntervalMs: 300000, // 5 minutes
    ...config
  })

export const createUserDataService = (config?: Partial<BatchLoadConfig>) =>
  new DataService<UserModel>('user', {
    batchSize: 5000,
    delayMs: 10000, // 10 seconds between batches
    autoRefreshIntervalMs: 300000, // 5 minutes
    ...config
  })
