import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { InputField } from '../../../components/Field'
import { GlassCard } from '../../../components/GlassCard'
import { Modal } from '../../../components/Modal'
import { Skeleton } from '../../../components/Skeleton'
import { useToast } from '../../../components/toast'
import { fieldErrors, problemDetail } from '../../../lib/api'
import { categoryLabel, formatCo2e, scopeLabels } from '../format'
import { useDeleteRun, useExecuteRun, useRunQuery, useRunsQuery } from '../useGhg'
import { ScopeBadge } from './badges'
import type { GhgScope, Run } from '../api'

/** Calculation runs: execute the inventory over a period and read the results. */
export function RunsSection({ organizationId }: { organizationId: string }) {
  const runsQuery = useRunsQuery(organizationId)
  const deleteRun = useDeleteRun(organizationId)
  const toast = useToast()
  const [creating, setCreating] = useState(false)
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)

  const runs = runsQuery.data

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-lg">Calculation runs</h2>
          <p className="text-sm text-dark-teal/60">
            Each run is an immutable snapshot of the inventory over a reporting period.
          </p>
        </div>
        <Button className="px-4 py-1.5 text-sm" onClick={() => setCreating(true)}>
          Run inventory
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {runsQuery.isPending && (
          <div aria-label="Loading runs">
            <Skeleton className="h-24" />
          </div>
        )}
        {runs?.length === 0 && (
          <GlassCard className="p-8 text-center">
            <h3 className="font-semibold">No runs yet</h3>
            <p className="mt-1 text-sm text-dark-teal/60">
              Run the inventory to roll your activity data up to CO₂e by scope.
            </p>
          </GlassCard>
        )}
        {runs?.map((run) => (
          <RunCard
            key={run.id}
            run={run}
            expanded={expandedRunId === run.id}
            onToggle={() => setExpandedRunId(expandedRunId === run.id ? null : run.id)}
            onDelete={() =>
              deleteRun.mutate(run.id, {
                onSuccess: () => toast(`Run "${run.label}" deleted.`),
                onError: (error) =>
                  toast(problemDetail(error) ?? 'Could not delete the run.', 'error'),
              })
            }
          />
        ))}
      </div>

      {creating && (
        <RunFormModal
          organizationId={organizationId}
          onClose={() => setCreating(false)}
          onDone={(runId) => {
            setCreating(false)
            setExpandedRunId(runId)
            toast('Inventory calculated.')
          }}
        />
      )}
    </section>
  )
}

const scopeBarStyles: Record<GhgScope, string> = {
  SCOPE_1: 'bg-dark-teal',
  SCOPE_2: 'bg-teal',
  SCOPE_3: 'bg-accent-green',
}

function RunCard({
  run,
  expanded,
  onToggle,
  onDelete,
}: {
  run: Run
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  const scopes: { scope: GhgScope; kg: number }[] = [
    { scope: 'SCOPE_1', kg: run.scope1KgCo2e },
    { scope: 'SCOPE_2', kg: run.scope2KgCo2e },
    { scope: 'SCOPE_3', kg: run.scope3KgCo2e },
  ]

  return (
    <GlassCard className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{run.label}</h3>
          <p className="text-sm text-dark-teal/60">
            {run.periodStart} → {run.periodEnd} · {run.activityCount} activit
            {run.activityCount === 1 ? 'y' : 'ies'}
          </p>
        </div>
        <p className="text-xl font-bold text-dark-teal">{formatCo2e(run.totalKgCo2e)}</p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {scopes.map(({ scope, kg }) => (
          <div key={scope} className="flex items-center gap-3 text-sm">
            <span className="w-16 shrink-0 text-dark-teal/70">{scopeLabels[scope]}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-teal/10">
              <div
                className={`h-full rounded-full ${scopeBarStyles[scope]}`}
                style={{
                  width:
                    run.totalKgCo2e > 0
                      ? `${Math.max((kg / run.totalKgCo2e) * 100, kg > 0 ? 2 : 0)}%`
                      : '0%',
                }}
              />
            </div>
            <span className="w-28 shrink-0 text-right whitespace-nowrap text-dark-teal/80">
              {formatCo2e(kg)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="ghost" className="px-3 py-1.5 text-sm" onClick={onToggle}>
          {expanded ? 'Hide details' : 'Show details'}
        </Button>
        <Button
          variant="ghost"
          className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
          onClick={onDelete}
        >
          Delete
        </Button>
      </div>

      {expanded && <RunLines runId={run.id} />}
    </GlassCard>
  )
}

function RunLines({ runId }: { runId: string }) {
  const runQuery = useRunQuery(runId, true)

  if (runQuery.isPending) {
    return (
      <div aria-label="Loading run details" className="mt-4">
        <Skeleton className="h-16" />
      </div>
    )
  }
  const lines = runQuery.data?.lines ?? []
  if (lines.length === 0) {
    return (
      <p className="mt-4 text-sm text-dark-teal/60">No activity fell inside this run's period.</p>
    )
  }
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-teal/10 text-xs text-dark-teal/60 uppercase">
            <th className="px-3 py-2 font-semibold">Facility</th>
            <th className="px-3 py-2 font-semibold">Source</th>
            <th className="px-3 py-2 font-semibold">Scope</th>
            <th className="px-3 py-2 font-semibold">Quantity</th>
            <th className="px-3 py-2 font-semibold">Factor</th>
            <th className="px-3 py-2 font-semibold">Weight</th>
            <th className="px-3 py-2 font-semibold">CO₂e</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id} className="border-b border-teal/5 last:border-0">
              <td className="px-3 py-2">{line.facilityName}</td>
              <td className="px-3 py-2">
                <span className="font-medium">{line.factorName}</span>
                <span className="block text-xs text-dark-teal/60">
                  {categoryLabel(line.category)}
                </span>
              </td>
              <td className="px-3 py-2">
                <ScopeBadge scope={line.scope} />
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {line.quantity.toLocaleString()} {line.unit}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {line.kgCo2ePerUnit} kg/{line.unit}
              </td>
              <td className="px-3 py-2">{(line.weight * 100).toFixed(0)}%</td>
              <td className="px-3 py-2 whitespace-nowrap font-medium">{formatCo2e(line.kgCo2e)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RunFormModal({
  organizationId,
  onClose,
  onDone,
}: {
  organizationId: string
  onClose: () => void
  onDone: (runId: string) => void
}) {
  const execute = useExecuteRun(organizationId)
  const year = new Date().getFullYear()
  const [label, setLabel] = useState(`FY${year} inventory`)
  const [periodStart, setPeriodStart] = useState(`${year}-01-01`)
  const [periodEnd, setPeriodEnd] = useState(`${year}-12-31`)

  const errors = fieldErrors(execute.error)
  const generalError = execute.isError && !errors ? problemDetail(execute.error) : undefined

  const submit = (event: FormEvent) => {
    event.preventDefault()
    execute.mutate(
      { label, periodStart, periodEnd },
      { onSuccess: (detail) => onDone(detail.run.id) },
    )
  }

  return (
    <Modal title="Run inventory" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <InputField
          label="Label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          error={errors?.label}
          required
        />
        <InputField
          label="Period start"
          type="date"
          value={periodStart}
          onChange={(event) => setPeriodStart(event.target.value)}
          error={errors?.periodStart}
          required
        />
        <InputField
          label="Period end"
          type="date"
          value={periodEnd}
          onChange={(event) => setPeriodEnd(event.target.value)}
          error={errors?.periodEnd}
          required
        />
        {generalError && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {generalError}
          </p>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" busy={execute.isPending}>
            Calculate
          </Button>
        </div>
      </form>
    </Modal>
  )
}
