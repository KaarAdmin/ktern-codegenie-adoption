'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { TokenAllocationProject } from '@/types'
import { X, CheckCircle2, XCircle } from 'lucide-react'

interface EditTokenAllocationModalProps {
  project: TokenAllocationProject | null
  onClose: () => void
  onSave: (
    project: TokenAllocationProject,
    payload: { isCodeGenie?: boolean; allocatedCost?: number }
  ) => Promise<void>
  onError: (message: string) => void
}

export function EditTokenAllocationModal({
  project,
  onClose,
  onSave,
  onError,
}: EditTokenAllocationModalProps) {
  const [mounted, setMounted] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [costInput, setCostInput] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Reset local state whenever a new project is opened.
  useEffect(() => {
    if (project) {
      setSubscribed(project.isCodeGenie)
      setCostInput(project.allocatedCost != null ? String(project.allocatedCost) : '')
      setConfirmed(false)
      setSaving(false)
    }
  }, [project])

  const alreadySubscribed = project?.isCodeGenie ?? false

  const parsedCost = useMemo(() => {
    const trimmed = costInput.trim()
    if (trimmed === '') return null
    const n = Number(trimmed)
    return Number.isFinite(n) ? n : NaN
  }, [costInput])

  const costIsInvalid = parsedCost != null && (Number.isNaN(parsedCost) || parsedCost < 0)

  // Build the PATCH payload from only the fields that actually changed.
  const payload = useMemo(() => {
    if (!project) return {}
    const body: { isCodeGenie?: boolean; allocatedCost?: number } = {}
    // One-way enable: only send when turning it on.
    if (subscribed && !project.isCodeGenie) {
      body.isCodeGenie = true
    }
    if (parsedCost != null && !Number.isNaN(parsedCost) && parsedCost !== project.allocatedCost) {
      body.allocatedCost = parsedCost
    }
    return body
  }, [project, subscribed, parsedCost])

  const hasChanges = Object.keys(payload).length > 0
  const canSubmit = hasChanges && !costIsInvalid && confirmed && !saving

  // Close on Escape.
  useEffect(() => {
    if (!project) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [project, saving, onClose])

  if (!mounted || !project) return null

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSaving(true)
    try {
      await onSave(project, payload)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to update token allocation')
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={() => !saving && onClose()}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-token-title"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <h2 id="edit-token-title" className="text-base font-semibold text-gray-900">
              Edit Token Allocation
            </h2>
            <p className="mt-0.5 truncate text-xs text-gray-500">{project.projectName}</p>
          </div>
          <button
            type="button"
            onClick={() => !saving && onClose()}
            aria-label="Close"
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-5 py-4">
          {/* Project details */}
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <dl className="grid grid-cols-3 gap-y-2 text-xs">
              <dt className="text-gray-500">Project name</dt>
              <dd className="col-span-2 break-words font-medium text-gray-800">
                {project.projectName}
              </dd>
              <dt className="text-gray-500">Project ID</dt>
              <dd className="col-span-2 break-all font-medium text-gray-800">
                {project.projectID}
              </dd>
              <dt className="text-gray-500">Internal ID</dt>
              <dd className="col-span-2 break-all font-mono text-[11px] text-gray-600">
                {project._id}
              </dd>
              <dt className="text-gray-500">Current cost</dt>
              <dd className="col-span-2 font-medium text-gray-800">
                {project.allocatedCost != null
                  ? formatCurrency(project.allocatedCost)
                  : 'No allocation'}
              </dd>
            </dl>
          </div>

          {/* Subscription one-way toggle */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Subscription
            </label>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5">
              <div className="flex items-center gap-2 text-sm">
                {subscribed ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="font-medium text-emerald-700">Subscribed</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Not subscribed</span>
                  </>
                )}
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={subscribed}
                disabled={alreadySubscribed}
                onClick={() => !alreadySubscribed && setSubscribed(true)}
                title={
                  alreadySubscribed
                    ? 'Subscription is already enabled and cannot be disabled'
                    : 'Enable subscription'
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
                  subscribed ? 'bg-emerald-500' : 'bg-gray-300'
                } ${alreadySubscribed ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    subscribed ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Enabling a subscription is permanent — it cannot be turned off here.
            </p>
          </div>

          {/* Allocated cost */}
          <div>
            <label htmlFor="allocated-cost" className="mb-1.5 block text-sm font-medium text-gray-700">
              Allocated token cost
            </label>
            <input
              id="allocated-cost"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={costInput}
              onChange={(e) => setCostInput(e.target.value)}
              placeholder="e.g. 50"
              className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 ${
                costIsInvalid
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
            {costIsInvalid && (
              <p className="mt-1 text-xs text-red-500">Enter a valid non-negative amount.</p>
            )}
          </div>

          {/* Confirmation */}
          <label className="flex items-start gap-2 rounded-lg bg-amber-50 p-3">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-amber-800">
              I confirm these changes to the token allocation for this project.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!canSubmit} loading={saving}>
            Submit
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
