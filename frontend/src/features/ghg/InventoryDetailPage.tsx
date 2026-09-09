import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { InputField } from '../../components/Field'
import { GlassCard } from '../../components/GlassCard'
import { Modal } from '../../components/Modal'
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
import { ReportMetadataCard } from './components/ReportMetadataCard'
import { ScopeBreakdown } from './components/ScopeBreakdown'
import { formatCo2e } from './format'
import {
  useBoundaryQuery,
  useVoidRun,
  useAuditEventsQuery,
  useExecuteRun,
  useFinalizeRun,
  useInventoryQuery,
  useRunsQuery,
  useValidationQuery,
} from './useGhg'
import type { AuditEvent, Inventory, Run } from './api'

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
        <AssignmentsSection
          organizationId={organizationId}
          inventoryId={inventoryId}
          editable={editable}
        />
      </div>
      <div className="animate-fade-up" style={{ '--stagger': 5 } as CSSProperties}>
        <MarketFactorsCard organizationId={organizationId} inventory={inventory} />
        <ReportMetadataCard
          key={`header-${inventory.status}`}
          inventory={inventory}
          intensityMetrics={[]}
        />
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
  const voidRun = useVoidRun(inventoryId)
  const eventsQuery = useAuditEventsQuery(inventoryId)
  const toast = useToast()
  const navigate = useNavigate()
  const nextRunNo = Math.max(0, ...(runsQuery.data?.map((run) => run.runNo) ?? [])) + 1
  // null until the accountant types: the proposal follows the highest number issued so far
  const [customLabel, setCustomLabel] = useState<string | null>(null)
  const label = customLabel ?? `Run ${String(nextRunNo).padStart(3, '0')}`
  const [voiding, setVoiding] = useState<Run | null>(null)
  const [voidReason, setVoidReason] = useState('')

  const report = validationQuery.data
  const canDesignate = inventory.status === 'FROZEN' || inventory.status === 'FINAL'
  const canVoid = inventory.status !== 'PUBLISHED'

  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <div className="flex flex-col gap-4">
        {validationQuery.isPending && <Skeleton className="h-40" />}
        {report && <PreflightPanel report={report} />}

        <GlassCard className="flex flex-wrap items-center gap-3 p-5">
          <input
            aria-label="Run label"
            value={label}
            onChange={(event) => setCustomLabel(event.target.value)}
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
          run; earlier runs are kept. A run is never deleted: it can be voided with a reason, and
          its number is never reused.
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
                  <span className="mr-2 font-mono text-xs text-ink-muted">
                    #{String(run.runNo).padStart(3, '0')}
                  </span>
                  <Link
                    to={`runs/${run.id}`}
                    className={`font-semibold hover:text-link ${run.voided ? 'line-through' : ''}`}
                  >
                    {run.label}
                  </Link>
                  {run.voided && (
                    <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600">
                      VOIDED
                    </span>
                  )}
                  {run.id === inventory.finalRunId && (
                    <span className="ml-2 rounded-full bg-accent-green/25 px-2 py-0.5 text-xs font-bold text-dark-teal">
                      FINAL
                    </span>
                  )}
                  <span className="block text-xs text-ink-muted">
                    {new Date(run.createdAt).toLocaleString()} · {run.activityCount} line
                    {run.activityCount === 1 ? '' : 's'} · boundary v{run.boundaryVersionNo ?? '?'}
                  </span>
                  {run.voided && (
                    <span className="block text-xs text-slate-600">
                      Voided by {run.voidedBy ?? 'unknown'}
                      {run.voidedAt ? ` on ${new Date(run.voidedAt).toLocaleString()}` : ''}:{' '}
                      {run.voidReason}
                    </span>
                  )}
                </div>
                <span className="font-bold text-dark-teal">{formatCo2e(run.totalKgCo2e)}</span>
              </div>
              <div className="mt-2">
                <ScopeBreakdown run={run} />
              </div>
              <div className="mt-2 flex gap-2">
                {run.id !== inventory.finalRunId && canDesignate && !run.voided && (
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
                {canVoid && !run.voided && run.id !== inventory.finalRunId && (
                  <Button
                    variant="ghost"
                    className="px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setVoidReason('')
                      setVoiding(run)
                    }}
                  >
                    Void…
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
        <HistoryList events={eventsQuery.data ?? []} />
      </GlassCard>

      {voiding && (
        <Modal title={`Void ${voiding.label}?`} onClose={() => setVoiding(null)}>
          <p className="text-sm text-ink-muted">
            The run keeps its number, lines and totals on the record, marked VOIDED with your reason
            and your name. Run numbers are never reused. This cannot be undone.
          </p>
          <div className="mt-4">
            <InputField
              label="Reason"
              placeholder="Why this run must not be relied on"
              value={voidReason}
              onChange={(event) => setVoidReason(event.target.value)}
              minLength={5}
              maxLength={500}
              required
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setVoiding(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={voidReason.trim().length < 5}
              busy={voidRun.isPending}
              onClick={() =>
                voidRun.mutate(
                  { id: voiding.id, reason: voidReason.trim() },
                  {
                    onSuccess: () => {
                      toast(`${voiding.label} voided.`)
                      setVoiding(null)
                    },
                    onError: (error) =>
                      toast(problemDetail(error) ?? 'Could not void the run.', 'error'),
                  },
                )
              }
            >
              Void run
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

const actionLabels: Record<AuditEvent['action'], string> = {
  RUN_VOIDED: 'Run voided',
  FINAL_WITHDRAWN: 'Final designation withdrawn',
}

/** The recorded acts on the inventory (spec 05.2), newest first. */
function HistoryList({ events }: { events: AuditEvent[] }) {
  if (events.length === 0) return null
  return (
    <div className="mt-6 border-t border-teal/10 pt-4">
      <h3 className="text-sm font-semibold">History</h3>
      <ul className="mt-2 flex flex-col gap-2 text-sm">
        {events.map((event) => (
          <li key={event.id}>
            <span className="font-medium">{actionLabels[event.action]}</span>
            {event.runNo !== null && (
              <span className="text-ink-muted"> · run #{String(event.runNo).padStart(3, '0')}</span>
            )}
            <span className="block text-xs text-ink-muted">
              {event.actor}, {new Date(event.at).toLocaleString()}: {event.reason}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
