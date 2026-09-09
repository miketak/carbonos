import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { useToast } from '../../components/toast'
import { problemDetail } from '../../lib/api'
import { AssignmentsSection } from './components/AssignmentsSection'
import { ApproachBadge, InventoryStatusBadge } from './components/badges'
import { BoundarySection } from './components/BoundarySection'
import { Breadcrumb } from './components/Breadcrumb'
import { LifecycleBar } from './components/LifecycleBar'
import { MarketFactorsCard } from './components/MarketFactorsCard'
import { OperationalBoundaryCard } from './components/OperationalBoundaryCard'
import { PreflightPanel } from './components/PreflightPanel'
import { ScopeBreakdown } from './components/ScopeBreakdown'
import { formatCo2e } from './format'
import {
  useBoundaryQuery,
  useDeleteRun,
  useExecuteRun,
  useFinalizeRun,
  useInventoryQuery,
  useRunsQuery,
  useValidationQuery,
} from './useGhg'
import type { Inventory } from './api'

/** One inventory's workspace: lifecycle, boundary, declaration, activity view, instruments, runs. */
export function InventoryDetailPage() {
  const { organizationId = '', inventoryId = '' } = useParams()
  const inventoryQuery = useInventoryQuery(inventoryId)
  const boundaryQuery = useBoundaryQuery(inventoryId)

  if (inventoryQuery.isPending) {
    return (
      <div aria-label="Loading inventory" className="flex flex-col gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-48" />
      </div>
    )
  }
  if (inventoryQuery.isError) {
    return (
      <GlassCard className="p-8 text-center">
        <h1 className="text-lg">Inventory not found</h1>
        <p className="mt-1 text-sm text-ink-muted">
          It may have been deleted.{' '}
          <Link to=".." relative="path" className="font-semibold text-link">
            Back to inventories
          </Link>
        </p>
      </GlassCard>
    )
  }

  const inventory = inventoryQuery.data
  const editable = inventory.status === 'DRAFT'
  const inBoundaryCount =
    boundaryQuery.data?.reduce(
      (count, entity) => count + entity.facilities.filter((facility) => facility.inBoundary).length,
      0,
    ) ?? 0
  return (
    <div className="flex flex-col gap-8">
      <div className="animate-fade-up">
        <Breadcrumb
          items={[
            { label: 'Inventories', to: `/app/ghg/${organizationId}/inventories` },
            { label: inventory.name },
          ]}
        />
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl">{inventory.name}</h1>
          <ApproachBadge approach={inventory.consolidationApproach} />
          <InventoryStatusBadge inventory={inventory} />
          <span className="inline-block rounded-full border border-teal/20 px-2.5 py-0.5 font-mono text-xs font-bold tracking-widest whitespace-nowrap text-ink-muted">
            GWP {inventory.gwpSet}
          </span>
        </div>
        <p className="mt-1 text-sm text-ink-muted">
          {inventory.periodStart} → {inventory.periodEnd}
          {inventory.purpose ? ` · ${inventory.purpose}` : ''}
        </p>
        {inventory.supersededById && (
          <p className="mt-1 text-sm">
            <Link
              to={`../${inventory.supersededById}`}
              relative="path"
              className="font-semibold text-link"
            >
              Superseded by a correction
            </Link>
          </p>
        )}
      </div>

      <div className="animate-fade-up" style={{ '--stagger': 1 } as CSSProperties}>
        <LifecycleBar inventory={inventory} inBoundaryCount={inBoundaryCount} />
      </div>
      <div className="animate-fade-up" style={{ '--stagger': 2 } as CSSProperties}>
        <BoundarySection inventory={inventory} />
      </div>
      <div className="animate-fade-up" style={{ '--stagger': 3 } as CSSProperties}>
        <OperationalBoundaryCard key={inventory.status} inventory={inventory} />
      </div>
      <div className="animate-fade-up" style={{ '--stagger': 4 } as CSSProperties}>
        <AssignmentsSection inventoryId={inventoryId} editable={editable} />
      </div>
      <div className="animate-fade-up" style={{ '--stagger': 5 } as CSSProperties}>
        <MarketFactorsCard organizationId={organizationId} inventory={inventory} />
      </div>
      <div className="animate-fade-up" style={{ '--stagger': 6 } as CSSProperties}>
        <LaunchSection inventory={inventory} />
      </div>
    </div>
  )
}

// --- launch + runs -----------------------------------------------------------

function LaunchSection({ inventory }: { inventory: Inventory }) {
  const inventoryId = inventory.id
  const validationQuery = useValidationQuery(inventoryId)
  const runsQuery = useRunsQuery(inventoryId)
  const execute = useExecuteRun(inventoryId)
  const finalize = useFinalizeRun(inventoryId)
  const deleteRun = useDeleteRun(inventoryId)
  const toast = useToast()
  const navigate = useNavigate()
  const [label, setLabel] = useState(
    `Run ${String((runsQuery.data?.length ?? 0) + 1).padStart(3, '0')}`,
  )

  const report = validationQuery.data
  const canDesignate = inventory.status === 'FROZEN' || inventory.status === 'FINAL'
  const canDelete = inventory.status !== 'PUBLISHED'

  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <div className="flex flex-col gap-4">
        {validationQuery.isPending && <Skeleton className="h-40" />}
        {report && <PreflightPanel report={report} />}

        <GlassCard className="flex flex-wrap items-center gap-3 p-5">
          <input
            aria-label="Run label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className="min-w-40 flex-1 rounded-lg border border-teal/20 bg-white/70 px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-teal focus:outline-none"
          />
          <Button
            disabled={!report?.ready || inventory.status === 'PUBLISHED'}
            busy={execute.isPending}
            title={report?.ready ? undefined : 'Resolve the blocking findings first'}
            onClick={() =>
              execute.mutate(label, {
                onSuccess: (detail) => {
                  toast('Calculation complete.')
                  void navigate(`runs/${detail.run.id}`)
                },
                onError: (error) => toast(problemDetail(error) ?? 'The run was refused.', 'error'),
              })
            }
          >
            Launch calculation run
          </Button>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <h2 className="text-xl">Calculation runs</h2>
        <p className="text-sm text-ink-muted">
          Immutable snapshots of this view, lines and exclusions alike. Recalculation creates a new
          run; earlier runs are kept.
        </p>
        {runsQuery.isPending && (
          <div aria-label="Loading runs" className="mt-4">
            <Skeleton className="h-16" />
          </div>
        )}
        {runsQuery.data?.length === 0 && (
          <p className="mt-4 text-sm text-ink-muted">No runs yet.</p>
        )}
        <ul className="mt-4 flex flex-col gap-4">
          {runsQuery.data?.map((run) => (
            <li key={run.id} className="border-b border-teal/5 pb-4 last:border-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Link to={`runs/${run.id}`} className="font-semibold hover:text-link">
                    {run.label}
                  </Link>
                  {run.id === inventory.finalRunId && (
                    <span className="ml-2 rounded-full bg-accent-green/25 px-2 py-0.5 text-xs font-bold text-dark-teal">
                      FINAL
                    </span>
                  )}
                  <span className="block text-xs text-ink-muted">
                    {new Date(run.createdAt).toLocaleString()} · {run.activityCount} line
                    {run.activityCount === 1 ? '' : 's'} · boundary v{run.boundaryVersionNo ?? '?'}
                  </span>
                </div>
                <span className="font-bold text-dark-teal">{formatCo2e(run.totalKgCo2e)}</span>
              </div>
              <div className="mt-2">
                <ScopeBreakdown run={run} />
              </div>
              <div className="mt-2 flex gap-2">
                {run.id !== inventory.finalRunId && canDesignate && (
                  <Button
                    variant="ghost"
                    className="px-2 py-1 text-xs"
                    onClick={() =>
                      finalize.mutate(run.id, {
                        onSuccess: () => toast(`${run.label} designated final.`),
                        onError: (error) =>
                          toast(problemDetail(error) ?? 'Could not finalize.', 'error'),
                      })
                    }
                  >
                    Mark as final
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    className="px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    onClick={() =>
                      deleteRun.mutate(run.id, {
                        onSuccess: () => toast(`${run.label} deleted.`),
                        onError: (error) =>
                          toast(problemDetail(error) ?? 'Could not delete the run.', 'error'),
                      })
                    }
                  >
                    Delete
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  )
}
