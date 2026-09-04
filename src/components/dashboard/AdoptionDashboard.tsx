'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { DatePicker, Segmented, Select } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AdoptionPivotGrid } from '@/components/dashboard/AdoptionPivotGrid'
import { getAdoptionSummary, getAdoptionInsights } from '@/lib/api'
import {
  AdoptionSummaryResponse,
  AdoptionInsightsResponse,
  AdoptionInsightsRequest,
  AdoptionGranularity,
  AdoptionFilterProject,
} from '@/types'
import { formatCurrency, formatNumber } from '@/lib/utils'
import {
  Users,
  MessageSquare,
  DollarSign,
  Cpu,
  Clock,
  FolderKanban,
  ListTree,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

// ----- Chart metric definitions -----
type MetricKey =
  | 'prompts'
  | 'cost'
  | 'users'
  | 'buildspaces'
  | 'agenticTasks'
  | 'infraRuntimeMinutes'
  | 'userSessionMinutes'

const METRICS: { key: MetricKey; label: string; color: string; isCurrency?: boolean }[] = [
  { key: 'prompts', label: 'Prompts', color: '#3b82f6' },
  { key: 'cost', label: 'Cost', color: '#10b981', isCurrency: true },
  { key: 'agenticTasks', label: 'Agentic Tasks', color: '#f59e0b' },
  { key: 'users', label: 'Users', color: '#8b5cf6' },
]

const GRANULARITIES: AdoptionGranularity[] = ['daily', 'weekly', 'monthly', 'yearly', 'all']

const PAGE_SIZE = 100

const DEFAULT_GRANULARITY: AdoptionGranularity = 'daily'
// Default window: end = today, start = 30 days back.
const defaultEndDate = () => dayjs().format('YYYY-MM-DD')
const defaultStartDate = () => dayjs().subtract(30, 'day').format('YYYY-MM-DD')

// ----- helpers -----
function formatBucketLabel(iso: string, granularity: AdoptionGranularity): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  switch (granularity) {
    case 'yearly':
      return d.getUTCFullYear().toString()
    case 'monthly':
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    case 'all':
      return 'All time'
    default:
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  }
}

interface SummaryTile {
  label: string
  value: string
  hint?: string
  icon: React.ReactNode
  color: string
  /** Base hex color used for the gradient wash + icon tint on summary tiles. */
  accent?: string
}

export function AdoptionDashboard() {
  // Summary + filter tree
  const [summary, setSummary] = useState<AdoptionSummaryResponse | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  // Insights
  const [insights, setInsights] = useState<AdoptionInsightsResponse | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState<string | null>(null)

  // Filter state (applied)
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [startDate, setStartDate] = useState(defaultStartDate)
  const [endDate, setEndDate] = useState(defaultEndDate)
  const [granularity, setGranularity] = useState<AdoptionGranularity>(DEFAULT_GRANULARITY)

  // Chart + table view state
  const [metric, setMetric] = useState<MetricKey>('prompts')
  const [page, setPage] = useState(1)

  const projectMap = useMemo(() => {
    const map = new Map<string, AdoptionFilterProject>()
    summary?.filterTree.projects.forEach((p) => map.set(p.projectId, p))
    return map
  }, [summary])

  // Load summary once on mount
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setSummaryLoading(true)
      setSummaryError(null)
      try {
        const res = await getAdoptionSummary()
        if (!cancelled) setSummary(res)
      } catch (err) {
        if (!cancelled) {
          setSummaryError(err instanceof Error ? err.message : 'Failed to load summary')
        }
      } finally {
        if (!cancelled) setSummaryLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Build the insights request body from applied filters + page
  const buildBody = (targetPage: number): AdoptionInsightsRequest => {
    const body: AdoptionInsightsRequest = {
      granularity,
      page: targetPage,
      pageSize: PAGE_SIZE,
    }
    if (selectedProjects.length) body.projectIds = selectedProjects
    if (selectedUsers.length) body.users = selectedUsers
    if (startDate) body.startDate = startDate
    if (endDate) body.endDate = endDate
    return body
  }

  const fetchInsights = async (targetPage: number, keepExisting = false) => {
    setInsightsLoading(true)
    setInsightsError(null)
    try {
      const res = await getAdoptionInsights(buildBody(targetPage))
      setInsights((prev) => {
        // When just paging the table, keep cards/series and swap the table only
        if (keepExisting && prev) {
          return { ...prev, table: res.table }
        }
        return res
      })
      setPage(targetPage)
    } catch (err) {
      setInsightsError(err instanceof Error ? err.message : 'Failed to load insights')
    } finally {
      setInsightsLoading(false)
    }
  }

  // Once summary is loaded, fetch the unfiltered insights slice
  useEffect(() => {
    if (summary && !insights && !insightsLoading) {
      fetchInsights(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary])

  // Client-side validation mirroring the API contract to avoid 400s
  const validationError = useMemo(() => {
    if (startDate && endDate && startDate > endDate) {
      return 'Start date is later than end date.'
    }
    if (startDate && endDate) {
      const span =
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000 + 1
      if (span > 731) return 'Date range exceeds the 731-day maximum span.'
    }
    return null
  }, [startDate, endDate])

  const applyFilters = () => {
    if (validationError) return
    setPage(1)
    fetchInsights(1)
  }

  const resetFilters = () => {
    setSelectedProjects([])
    setSelectedUsers([])
    setStartDate(defaultStartDate())
    setEndDate(defaultEndDate())
    setGranularity(DEFAULT_GRANULARITY)
  }

  // Full project list for the dropdown (antd Select handles search)
  const projectOptions = useMemo(
    () => summary?.filterTree.projects ?? [],
    [summary]
  )

  // Users narrowed by the selected projects (client-side intersection),
  // or the union of all users when no project is selected.
  const userOptions = useMemo(() => {
    if (!summary) return []
    const source = selectedProjects.length
      ? selectedProjects.map((id) => projectMap.get(id)).filter(Boolean) as AdoptionFilterProject[]
      : summary.filterTree.projects

    const seen = new Map<string, string>() // email -> displayName
    source.forEach((p) => {
      const users = p.users ?? []
      users.forEach((u) => {
        if (!seen.has(u.email)) seen.set(u.email, u.displayName)
      })
    })

    return Array.from(seen.entries())
      .map(([email, displayName]) => ({ email, displayName }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
  }, [summary, selectedProjects, projectMap])

  // Drop selected users that are no longer valid when project selection changes
  useEffect(() => {
    if (!selectedUsers.length || !selectedProjects.length) return
    const valid = new Set(userOptions.map((u) => u.email))
    const next = selectedUsers.filter((u) => valid.has(u))
    if (next.length !== selectedUsers.length) setSelectedUsers(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjects])

  // ----- Summary tiles -----
  const summaryTiles: SummaryTile[] = useMemo(() => {
    const s = summary?.summary
    if (!s) return []
    return [
      { label: 'Projects', value: formatNumber(s.projects), icon: <FolderKanban className="h-5 w-5" />, color: 'bg-blue-50 text-blue-600', accent: '#3b82f6' },
      { label: 'Users', value: s.users.toLocaleString(), icon: <Users className="h-5 w-5" />, color: 'bg-violet-50 text-violet-600', accent: '#8b5cf6' },
      { label: 'Agentic Tasks', value: formatNumber(s.agenticTasks), icon: <Cpu className="h-5 w-5" />, color: 'bg-amber-50 text-amber-600', accent: '#f59e0b' },
      { label: 'Prompts', value: formatNumber(s.prompts), icon: <MessageSquare className="h-5 w-5" />, color: 'bg-sky-50 text-sky-600', accent: '#0ea5e9' },
      { label: 'Total Cost', value: formatCurrency(s.cost), icon: <DollarSign className="h-5 w-5" />, color: 'bg-emerald-50 text-emerald-600', accent: '#10b981' },
      { label: 'Infra Runtime', value: `${formatNumber(s.infraRuntimeMinutes)} min`, hint: 'Uptime / cost proxy', icon: <Clock className="h-5 w-5" />, color: 'bg-red-50 text-red-600', accent: '#ef4444' },
    ]
  }, [summary])

  // ----- Filtered insights tiles (same metrics as the summary tiles) -----
  const insightsTiles: SummaryTile[] = useMemo(() => {
    const c = insights?.cards
    if (!c) return []
    return [
      { label: 'Buildspaces', value: c.uniqueBuildspaces.toLocaleString(), icon: <FolderKanban className="h-5 w-5" />, color: 'bg-blue-50 text-blue-600' },
      { label: 'Users', value: c.uniqueUsers.toLocaleString(), icon: <Users className="h-5 w-5" />, color: 'bg-violet-50 text-violet-600' },
      { label: 'Agentic Tasks', value: formatNumber(c.agenticTasks), icon: <Cpu className="h-5 w-5" />, color: 'bg-amber-50 text-amber-600' },
      { label: 'Prompts', value: formatNumber(c.totalPrompts), icon: <MessageSquare className="h-5 w-5" />, color: 'bg-sky-50 text-sky-600' },
      { label: 'Total Cost', value: formatCurrency(c.totalCost), icon: <DollarSign className="h-5 w-5" />, color: 'bg-emerald-50 text-emerald-600' },
      { label: 'Infra Runtime', value: `${formatNumber(c.infraRuntimeMinutes)} min`, hint: 'Uptime / cost proxy', icon: <Clock className="h-5 w-5" />, color: 'bg-red-50 text-red-600' },
    ]
  }, [insights])

  // ----- Chart data -----
  const activeMetric = METRICS.find((m) => m.key === metric)!
  const chartData = useMemo(() => {
    return (insights?.series ?? []).map((b) => ({
      label: formatBucketLabel(b.bucketStart, granularity),
      value: b[metric] ?? 0,
    }))
  }, [insights, metric, granularity])

  const table = insights?.table
  const totalPages = table ? Math.max(1, Math.ceil(table.totalRows / table.pageSize)) : 1

  // ----- render -----
  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (summaryError) {
    return (
      <Card className="m-4">
        <div className="text-center py-8">
          <p className="text-red-600 font-medium">Failed to load the adoption dashboard</p>
          <p className="text-sm text-gray-500 mt-1">{summaryError}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4 py-2">
      {/* Summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryTiles.map((tile) => {
          const accent = tile.accent ?? '#3b82f6'
          return (
            <div
              key={tile.label}
              className="group relative overflow-hidden rounded-lg border border-gray-100 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              style={{ background: '#ffffff' }}
            >
              {/* base gradient wash: accent at top-left -> white at bottom-right */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${accent}26 0%, ${accent}0d 40%, #ffffff 85%)`,
                }}
              />
              {/* stronger wash fades in on hover */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                style={{
                  background: `linear-gradient(135deg, ${accent}40 0%, ${accent}1a 45%, #ffffff 90%)`,
                }}
              />
              <div className="relative flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-2xl font-semibold text-gray-900">{tile.value}</p>
                  <p className="text-xs font-medium text-gray-600">{tile.label}</p>
                  {tile.hint && <p className="text-[10px] text-gray-400 mt-0.5">{tile.hint}</p>}
                </div>
                <div
                  className="inline-flex items-center justify-center rounded-md p-2 shrink-0"
                  style={{ backgroundColor: `${accent}1f`, color: accent }}
                >
                  {tile.icon}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <ListTree className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-800">Filters</h2>

        </div>

        <div className="flex flex-wrap items-end gap-3">
          {/* Projects picker */}
          <div className="flex-1 min-w-[220px]">
            <label className="block text-[11px] font-medium text-gray-500 mb-1">
              Projects{selectedProjects.length ? ` (${selectedProjects.length})` : ''}
            </label>
            <Select
              mode="multiple"
              allowClear
              showSearch
              value={selectedProjects}
              onChange={(vals: string[]) => setSelectedProjects(vals)}
              placeholder="Select or search projects..."
              maxTagCount="responsive"
              className="w-full"
              filterOption={(input, option) =>
                (option?.searchText ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={projectOptions.map((p) => ({
                value: p.projectId,
                label: p.projectName,
                searchText: `${p.projectName} ${p.organization} ${p.projectId}`,
              }))}
              optionRender={(opt) => {
                const p = projectMap.get(opt.value as string)
                return (
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-gray-800 truncate">{opt.label}</div>
                    {p && (
                      <div className="text-[11px] text-gray-400 truncate">
                        {p.organization} · {p.projectId}
                      </div>
                    )}
                  </div>
                )
              }}
            />
          </div>

          {/* Users picker */}
          <div className="flex-1 min-w-[220px]">
            <label className="block text-[11px] font-medium text-gray-500 mb-1">
              Users{selectedUsers.length ? ` (${selectedUsers.length})` : ''}
            </label>
            <Select
              mode="multiple"
              allowClear
              showSearch
              value={selectedUsers}
              onChange={(vals: string[]) => setSelectedUsers(vals)}
              placeholder="Select or search users..."
              maxTagCount="responsive"
              className="w-full"
              filterOption={(input, option) =>
                (option?.searchText ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={userOptions.map((u) => ({
                value: u.email,
                label: u.displayName,
                searchText: `${u.displayName} ${u.email}`,
              }))}
              optionRender={(opt) => (
                <div className="min-w-0">
                  <div className="text-xs font-medium text-gray-800 truncate">{opt.label}</div>
                  <div className="text-[11px] text-gray-400 truncate">{opt.value as string}</div>
                </div>
              )}
            />
          </div>

          {/* Date range */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Date range</label>
            <RangePicker
              value={[startDate ? dayjs(startDate) : null, endDate ? dayjs(endDate) : null]}
              format="YYYY-MM-DD"
              allowEmpty={[true, true]}
              placeholder={['Start date', 'End date']}
              onChange={(dates: (Dayjs | null)[] | null) => {
                setStartDate(dates?.[0] ? dates[0]!.format('YYYY-MM-DD') : '')
                setEndDate(dates?.[1] ? dates[1]!.format('YYYY-MM-DD') : '')
              }}
            />
          </div>

          {/* Granularity */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Granularity</label>
            <Select
              value={granularity}
              onChange={(val: AdoptionGranularity) => setGranularity(val)}
              className="w-32 capitalize"
              options={GRANULARITIES.map((g) => ({ value: g, label: g }))}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={applyFilters} loading={insightsLoading} disabled={!!validationError}>
              Apply
            </Button>
            <Button size="sm" variant="outline" onClick={resetFilters}>
              <X className="h-4 w-4 mr-1" /> Reset
            </Button>
          </div>

          {validationError && <p className="text-xs text-red-600 w-full">{validationError}</p>}
        </div>

        {/* Filtered insights tiles (mirror the summary tiles) */}
        {insights && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-gray-100">
            {insightsTiles.map((tile) => (
              <div key={tile.label} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xl font-semibold text-gray-900">{tile.value}</p>
                    <p className="text-xs font-medium text-gray-500">{tile.label}</p>
                    {tile.hint && <p className="text-[10px] text-gray-400 mt-0.5">{tile.hint}</p>}
                  </div>
                  <div className={`inline-flex items-center justify-center rounded-md p-2 shrink-0 ${tile.color}`}>
                    {tile.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Chart */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-800">Usage over time</h2>
            {insights && (
              <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                {formatNumber(insights.cards.totalPeriods)} periods
              </span>
            )}
          </div>
          <Segmented
            value={metric}
            onChange={(val) => setMetric(val as MetricKey)}
            options={METRICS.map((m) => ({ label: m.label, value: m.key }))}
          />
        </div>

        {insightsError ? (
          <div className="text-center py-12">
            <p className="text-red-600 text-sm">{insightsError}</p>
            <Button className="mt-3" size="sm" onClick={() => fetchInsights(page)}>
              Retry
            </Button>
          </div>
        ) : insightsLoading && !insights ? (
          <div className="flex items-center justify-center h-72">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-72 text-gray-400">
            <Search className="h-8 w-8 mb-2" />
            <p className="text-sm">No data for the selected filters.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="metricFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={activeMetric.color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={activeMetric.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatNumber(Number(v))} />
              <Tooltip
                formatter={(value: number) => [
                  activeMetric.isCurrency ? formatCurrency(value) : value.toLocaleString(),
                  activeMetric.label,
                ]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={activeMetric.color}
                strokeWidth={2}
                fill="url(#metricFill)"
                name={activeMetric.label}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Table (AG Grid pivot) */}
      <Card className="p-0 overflow-hidden">
        <AdoptionPivotGrid rows={table?.rows ?? []} loading={insightsLoading} />

        {/* Server-side pagination for the raw rows */}
        {table && table.totalRows > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Page {table.page} of {totalPages} • {formatNumber(table.totalRows)} total rows
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1 || insightsLoading}
                onClick={() => fetchInsights(page - 1, true)}
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages || insightsLoading}
                onClick={() => fetchInsights(page + 1, true)}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
