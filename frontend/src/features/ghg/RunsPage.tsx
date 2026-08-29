import { useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { InputField } from '../../components/Field'
import { GlassCard } from '../../components/GlassCard'
import { Modal } from '../../components/Modal'
import { Skeleton } from '../../components/Skeleton'
import { useToast } from '../../components/toast'
import { fieldErrors, problemDetail } from '../../lib/api'
import { ScopeBreakdown } from './components/ScopeBreakdown'
import { formatCo2e } from './format'
import { useDeleteRun, useExecuteRun, useRunsQuery } from './useGhg'
import type { Run } from './api'

/** Calculation runs: execute the inventory over a period, each run is a report. */
export function RunsPage() {
  const { organizationId = '' } = useParams()
  const runsQuery = useRunsQuery(organizationId)
  const deleteRun = useDeleteRun(organizationId)
  const toast = useToast()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)

  const runs = runsQuery.data

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h1 className="text-xl">Calculation runs</h1>
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
            <h2 className="font-semibold">No runs yet</h2>
            <p className="mt-1 text-sm text-dark-teal/60">
              Run the inventory to roll your activity data up to CO₂e by scope.
            </p>
          </GlassCard>
        )}
        {runs?.map((run, index) => (
          <RunCard
            key={run.id}
            run={run}
            stagger={index}
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
            toast('Inventory calculated.')
            void navigate(runId)
          }}
        />
      )}
    </section>
  )
}

function RunCard({ run, stagger, onDelete }: { run: Run; stagger: number; onDelete: () => void }) {
  return (
    <GlassCard
      className="animate-fade-up hover-lift p-6"
      style={{ '--stagger': stagger } as CSSProperties}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">
            <Link to={run.id} className="hover:text-teal">
              {run.label}
            </Link>
          </h2>
          <p className="text-sm text-dark-teal/60">
            {run.periodStart} → {run.periodEnd} · {run.activityCount} activit
            {run.activityCount === 1 ? 'y' : 'ies'}
          </p>
        </div>
        <p className="text-xl font-bold text-dark-teal">{formatCo2e(run.totalKgCo2e)}</p>
      </div>

      <div className="mt-4">
        <ScopeBreakdown run={run} />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Link
          to={run.id}
          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-teal transition-colors duration-150 hover:bg-teal/10"
        >
          View report →
        </Link>
        <Button
          variant="ghost"
          className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
          onClick={onDelete}
        >
          Delete
        </Button>
      </div>
    </GlassCard>
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
