'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Segmented } from 'antd'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { getTokenAllocation, updateTokenAllocation, TokenAllocationForbiddenError } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { TokenAllocationProject } from '@/types'
import { useToast } from '@/contexts/ToastContext'
import { Search, Pencil, CheckCircle2, XCircle } from 'lucide-react'
import { EditTokenAllocationModal } from './EditTokenAllocationModal'

type FilterMode = 'all' | 'subscribed'

export function TokenAllocation() {
  const router = useRouter()
  const { showSuccess, showError } = useToast()

  const [projects, setProjects] = useState<TokenAllocationProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<FilterMode>('all')

  const [editing, setEditing] = useState<TokenAllocationProject | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getTokenAllocation()
      setProjects(res.projects ?? [])
    } catch (err) {
      if (err instanceof TokenAllocationForbiddenError) {
        showError('You are not authorized to access token allocation')
        router.replace('/dashboard')
        return
      }
      setError(err instanceof Error ? err.message : 'Failed to load token allocation')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projects.filter((p) => {
      if (mode === 'subscribed' && !p.isCodeGenie) return false
      if (!q) return true
      return (
        (p.projectName ?? '').toLowerCase().includes(q) ||
        (p.projectID ?? '').toLowerCase().includes(q) ||
        (p._id ?? '').toLowerCase().includes(q)
      )
    })
  }, [projects, query, mode])

  const subscribedCount = useMemo(
    () => projects.filter((p) => p.isCodeGenie).length,
    [projects]
  )

  const handleSave = async (
    project: TokenAllocationProject,
    payload: { isCodeGenie?: boolean; allocatedCost?: number }
  ) => {
    let res
    try {
      res = await updateTokenAllocation(project._id, payload)
    } catch (err) {
      if (err instanceof TokenAllocationForbiddenError) {
        setEditing(null)
        showError('You are not authorized to edit token allocation')
        router.replace('/dashboard')
        return
      }
      throw err
    }
    const updated: TokenAllocationProject = res.project ?? {
      ...project,
      ...(payload.isCodeGenie != null ? { isCodeGenie: payload.isCodeGenie } : {}),
      ...(payload.allocatedCost != null ? { allocatedCost: payload.allocatedCost } : {}),
    }
    setProjects((prev) => prev.map((p) => (p._id === project._id ? updated : p)))
    showSuccess(`Token allocation updated for ${project.projectName}`)
    setEditing(null)
  }

  return (
    <div className="space-y-4 py-2">
      {/* Search + toggle bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by project name, ID or _id..."
              className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <Segmented
            value={mode}
            onChange={(val) => setMode(val as FilterMode)}
            options={[
              { label: `All Projects (${projects.length})`, value: 'all' },
              { label: `Subscribed (${subscribedCount})`, value: 'subscribed' },
            ]}
          />
        </div>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : error ? (
        <Card className="m-0">
          <div className="text-center py-8">
            <p className="text-red-600 font-medium">Failed to load token allocation</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
            <Button className="mt-4" onClick={load}>
              Retry
            </Button>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <Search className="h-8 w-8 mb-2" />
          <p className="text-sm">No projects match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <div
              key={p._id}
              className="group relative flex min-h-[180px] flex-col overflow-hidden rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600 break-all">
                      {p.projectID}
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-gray-900 line-clamp-2">
                    {p.projectName}
                  </h3>
                  <p className="mt-1 text-xs text-gray-400 break-all">{p._id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(p)}
                  aria-label={`Edit token allocation for ${p.projectName}`}
                  title="Edit token allocation"
                  className="inline-flex items-center justify-center rounded-md bg-gray-50 p-2 text-gray-500 shrink-0 transition-colors hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium ${
                    p.isCodeGenie ? 'text-emerald-600' : 'text-gray-400'
                  }`}
                >
                  {p.isCodeGenie ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Subscribed
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" /> Not subscribed
                    </>
                  )}
                </span>
                <span className="text-xs text-gray-500">
                  {p.allocatedCost != null ? formatCurrency(p.allocatedCost) : 'No allocation'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <EditTokenAllocationModal
        project={editing}
        onClose={() => setEditing(null)}
        onSave={handleSave}
        onError={(msg) => showError(msg)}
      />
    </div>
  )
}
