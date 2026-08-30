import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { useToast } from '../../components/toast'
import { problemDetail } from '../../lib/api'
import { ApproachBadge, ScopeBadge } from './components/badges'
import { Breadcrumb } from './components/Breadcrumb'
import { PreflightPanel } from './components/PreflightPanel'
import { ScopeBreakdown } from './components/ScopeBreakdown'
import { formatCo2e } from './format'
import {
  useAssignmentsQuery,
  useBoundaryQuery,
  useClassifyAssignment,
  useDeleteRun,
  useEmissionFactorsQuery,
  useExcludeAssignment,
  useExecuteRun,
  useFinalizeRun,
  useIncludeAssignment,
  useInventoryQuery,
  useRemoveBoundaryTreatment,
  useRunsQuery,
  useSetBoundaryTreatment,
  useSyncAssignments,
  useValidationQuery,
} from './useGhg'
import type { Assignment, BoundaryEntry, ExclusionReason } from './api'

const exclusionLabels: Record<ExclusionReason, string> = {
  OUTSIDE_PERIOD: 'Outside reporting period',
  OUTSIDE_BOUNDARY: 'Outside boundary',
  NON_GHG: 'Non-GHG activity',
  DUPLICATE: 'Duplicate',
  NOT_APPLICABLE: 'Not applicable',
  METHODOLOGY: 'Methodology exclusion',
  OTHER: 'Other documented reason',
}

/**
 * A checkbox with a generous tap area (DR-02, WCAG 2.5.8): 40px on touch, ≥28px
 * on desktop, around a 20px control — well above the 24px minimum either way.
 */
function TapCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="inline-flex h-10 w-10 cursor-pointer items-center justify-center md:h-7 md:w-7">
      <input
        type="checkbox"
        aria-label={label}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-teal-deep"
      />
    </label>
  )
}

function OwnershipInput({
  entry,
  onUpdate,
}: {
  entry: BoundaryEntry
  onUpdate: (value: number) => void
}) {
  return (
    <input
      type="number"
      min={0}
      max={100}
      aria-label={`${entry.facilityName} ownership percent`}
      defaultValue={entry.ownershipPercent ?? 100}
      onBlur={(event) => onUpdate(Number(event.target.value))}
      className="w-20 rounded-lg border border-teal/20 bg-white/70 px-2 py-1 text-sm focus:ring-2 focus:ring-teal focus:outline-none"
    />
  )
}

function AccountingShare({ entry }: { entry: BoundaryEntry }) {
  return (
    <span className="font-mono font-semibold">
      {entry.accountingShare !== null ? `${Math.round(entry.accountingShare * 100)}%` : '—'}
    </span>
  )
}

/**
 * This inventory's decision about one fact, as pill(s). When excluded, the pill
 * is removable — the ✕ re-includes the fact (DR-03), mirroring how exclusion is
 * captured, so the decision and its reversal are both visible.
 */
function StatusPills({
  assignment,
  onInclude,
}: {
  assignment: Assignment
  onInclude?: () => void
}) {
  if (!assignment.included) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 py-0.5 pr-1 pl-2.5 text-xs font-semibold text-slate-600">
        Excluded · {assignment.exclusionReason ? exclusionLabels[assignment.exclusionReason] : ''}
        {onInclude && (
          <button
            type="button"
            onClick={onInclude}
            aria-label={`Re-include ${assignment.activityType}`}
            title="Re-include"
            className="flex size-5 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-300 hover:text-slate-700"
          >
            ✕
          </button>
        )}
      </span>
    )
  }
  if (assignment.classified) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block rounded-full bg-teal/15 px-2.5 py-0.5 text-xs font-semibold text-dark-teal">
          Included
        </span>
        {assignment.scope && <ScopeBadge scope={assignment.scope} />}
      </span>
    )
  }
  return (
    <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
      Unclassified
    </span>
  )
}

function ClassifySelect({
  assignment,
  factors,
  onClassify,
}: {
  assignment: Assignment
  factors: { id: string; name: string; unit: string }[]
  onClassify: (factorId: string) => void
}) {
  // CLASS-01: only factors whose unit matches the fact are offered
  const compatible = factors.filter(
    (factor) => factor.unit.toLowerCase() === assignment.unit.toLowerCase(),
  )
  const options = compatible.length > 0 ? compatible : factors
  return (
    // DR-04: wide enough not to truncate the factor + unit; teal border marks it as the primary action
    <select
      aria-label={`Classify ${assignment.activityType}`}
      value={assignment.emissionFactorId ?? ''}
      onChange={(event) => event.target.value && onClassify(event.target.value)}
      className="w-full rounded-lg border border-teal/40 bg-white/70 px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-teal focus:outline-none md:w-72"
    >
      <option value="">Select emission factor…</option>
      {options.map((factor) => (
        <option key={factor.id} value={factor.id}>
          {factor.name} (/{factor.unit})
        </option>
      ))}
    </select>
  )
}

/**
 * DR-03: exclusion is a deliberate button-and-popover, not a disguised dropdown.
 * The button opens a small menu to capture the required reason; nothing changes
 * until a reason is chosen. Renders nothing once excluded (the removable status
 * chip owns the reversal).
 */
function ExcludeMenu({
  assignment,
  onExclude,
}: {
  assignment: Assignment
  onExclude: (reason: ExclusionReason) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative inline-block text-left">
      <Button
        variant="ghost"
        className="px-2.5 py-1 text-xs"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Exclude…
      </Button>
      {open && (
        <div
          role="menu"
          aria-label={`Exclude ${assignment.activityType} — choose a reason`}
          className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-teal/15 bg-white shadow-[0_8px_28px_rgba(9,168,149,0.18)]"
        >
          <p className="border-b border-teal/10 px-3 py-2 text-xs font-semibold text-ink-muted">
            Exclude — reason
          </p>
          {Object.entries(exclusionLabels).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onExclude(value as ExclusionReason)
              }}
              className="block w-full px-3 py-2 text-left text-sm text-dark-teal transition-colors hover:bg-teal/10"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** One inventory's workspace: boundary, activity view, pre-flight gates, runs. */
export function InventoryDetailPage() {
  const { organizationId = '', inventoryId = '' } = useParams()
  const inventoryQuery = useInventoryQuery(inventoryId)

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
        </div>
        <p className="mt-1 text-sm text-ink-muted">
          {inventory.periodStart} → {inventory.periodEnd}
          {inventory.purpose ? ` · ${inventory.purpose}` : ''}
        </p>
      </div>

      <div className="animate-fade-up" style={{ '--stagger': 1 } as CSSProperties}>
        <BoundarySection inventoryId={inventoryId} />
      </div>
      <div className="animate-fade-up" style={{ '--stagger': 2 } as CSSProperties}>
        <AssignmentsSection inventoryId={inventoryId} />
      </div>
      <div className="animate-fade-up" style={{ '--stagger': 3 } as CSSProperties}>
        <LaunchSection inventoryId={inventoryId} finalRunId={inventory.finalRunId} />
      </div>
    </div>
  )
}

// --- boundary ---------------------------------------------------------------

function BoundarySection({ inventoryId }: { inventoryId: string }) {
  const boundaryQuery = useBoundaryQuery(inventoryId)
  const setTreatment = useSetBoundaryTreatment(inventoryId)
  const removeTreatment = useRemoveBoundaryTreatment(inventoryId)
  const toast = useToast()

  const toggle = (entry: BoundaryEntry) => {
    if (entry.inBoundary) {
      removeTreatment.mutate(entry.facilityId, {
        onError: (error) => toast(problemDetail(error) ?? 'Could not update boundary.', 'error'),
      })
    } else {
      setTreatment.mutate(
        {
          facilityId: entry.facilityId,
          input: { ownershipPercent: 100, financialControl: true, operationalControl: true },
        },
        {
          onError: (error) => toast(problemDetail(error) ?? 'Could not update boundary.', 'error'),
        },
      )
    }
  }

  const updateOwnership = (entry: BoundaryEntry, ownershipPercent: number) => {
    setTreatment.mutate({
      facilityId: entry.facilityId,
      input: {
        ownershipPercent,
        financialControl: entry.financialControl ?? false,
        operationalControl: entry.operationalControl ?? false,
      },
    })
  }

  const updateControl = (
    entry: BoundaryEntry,
    field: 'financialControl' | 'operationalControl',
    value: boolean,
  ) => {
    setTreatment.mutate({
      facilityId: entry.facilityId,
      input: {
        ownershipPercent: entry.ownershipPercent ?? 100,
        financialControl: field === 'financialControl' ? value : (entry.financialControl ?? false),
        operationalControl:
          field === 'operationalControl' ? value : (entry.operationalControl ?? false),
      },
    })
  }

  return (
    <GlassCard className="p-6">
      <h2 className="text-xl">Organizational boundary</h2>
      <p className="text-sm text-ink-muted">
        Which facilities this view accounts for, and how much of each. The accounting share follows
        the consolidation approach.
      </p>
      {boundaryQuery.isPending && (
        <div aria-label="Loading boundary" className="mt-4">
          <Skeleton className="h-16" />
        </div>
      )}
      {boundaryQuery.data && boundaryQuery.data.length === 0 && (
        <p className="mt-4 text-sm text-ink-muted">
          The organization has no facilities yet — add them under Facilities first.
        </p>
      )}

      {/* desktop: table */}
      {boundaryQuery.data && boundaryQuery.data.length > 0 && (
        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
                <th className="px-3 py-2 font-semibold">In boundary</th>
                <th className="px-3 py-2 font-semibold">Facility</th>
                <th className="px-3 py-2 font-semibold">Ownership %</th>
                <th className="px-3 py-2 font-semibold">Financial ctrl</th>
                <th className="px-3 py-2 font-semibold">Operational ctrl</th>
                <th className="px-3 py-2 font-semibold">Accounting share</th>
              </tr>
            </thead>
            <tbody>
              {boundaryQuery.data.map((entry) => (
                <tr key={entry.facilityId} className="border-b border-teal/5 last:border-0">
                  <td className="px-3 py-1">
                    <TapCheckbox
                      label={`${entry.facilityName} in boundary`}
                      checked={entry.inBoundary}
                      onChange={() => toggle(entry)}
                    />
                  </td>
                  <td className="px-3 py-2 font-medium">
                    {entry.facilityName}
                    <span className="block text-xs font-normal text-ink-muted">
                      {entry.location}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {entry.inBoundary ? (
                      <OwnershipInput
                        entry={entry}
                        onUpdate={(value) => updateOwnership(entry, value)}
                      />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-1">
                    {entry.inBoundary ? (
                      <TapCheckbox
                        label={`${entry.facilityName} financial control`}
                        checked={entry.financialControl ?? false}
                        onChange={(value) => updateControl(entry, 'financialControl', value)}
                      />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-1">
                    {entry.inBoundary ? (
                      <TapCheckbox
                        label={`${entry.facilityName} operational control`}
                        checked={entry.operationalControl ?? false}
                        onChange={(value) => updateControl(entry, 'operationalControl', value)}
                      />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <AccountingShare entry={entry} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* mobile: one card per facility */}
      {boundaryQuery.data && boundaryQuery.data.length > 0 && (
        <ul className="mt-4 flex flex-col gap-3 md:hidden">
          {boundaryQuery.data.map((entry) => (
            <li key={entry.facilityId} className="rounded-xl border border-teal/10 bg-white/40 p-3">
              <div className="flex items-center gap-2">
                <TapCheckbox
                  label={`${entry.facilityName} in boundary`}
                  checked={entry.inBoundary}
                  onChange={() => toggle(entry)}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{entry.facilityName}</p>
                  <p className="truncate text-xs text-ink-muted">{entry.location}</p>
                </div>
                {entry.inBoundary && (
                  <span className="text-xs text-ink-muted">
                    share <AccountingShare entry={entry} />
                  </span>
                )}
              </div>
              {entry.inBoundary && (
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 pl-12 text-sm">
                  <label className="flex items-center gap-2">
                    <span className="text-ink-muted">Ownership %</span>
                    <OwnershipInput
                      entry={entry}
                      onUpdate={(value) => updateOwnership(entry, value)}
                    />
                  </label>
                  <span className="flex items-center gap-1">
                    <TapCheckbox
                      label={`${entry.facilityName} financial control`}
                      checked={entry.financialControl ?? false}
                      onChange={(value) => updateControl(entry, 'financialControl', value)}
                    />
                    <span className="text-ink-muted">Financial</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <TapCheckbox
                      label={`${entry.facilityName} operational control`}
                      checked={entry.operationalControl ?? false}
                      onChange={(value) => updateControl(entry, 'operationalControl', value)}
                    />
                    <span className="text-ink-muted">Operational</span>
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  )
}

// --- assignments ------------------------------------------------------------

function AssignmentsSection({ inventoryId }: { inventoryId: string }) {
  const assignmentsQuery = useAssignmentsQuery(inventoryId)
  const factorsQuery = useEmissionFactorsQuery()
  const sync = useSyncAssignments(inventoryId)
  const classify = useClassifyAssignment(inventoryId)
  const exclude = useExcludeAssignment(inventoryId)
  const include = useIncludeAssignment(inventoryId)
  const toast = useToast()

  const assignments = assignmentsQuery.data
  const factors = factorsQuery.data ?? []

  return (
    <GlassCard className="p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl">Activity view</h2>
          <p className="text-sm text-ink-muted">
            This inventory's accounting decisions about the facts. The records themselves are never
            modified.
          </p>
        </div>
        <Button
          className="px-4 py-1.5 text-sm"
          busy={sync.isPending}
          onClick={() =>
            sync.mutate(undefined, {
              onSuccess: ({ created, updated }) => {
                const parts = []
                if (created > 0)
                  parts.push(`${created} new record${created === 1 ? '' : 's'} under review`)
                if (updated > 0)
                  parts.push(`${updated} stale decision${updated === 1 ? '' : 's'} refreshed`)
                toast(
                  parts.length === 0
                    ? 'All activity records are already reviewed.'
                    : parts.join(' · ') + '.',
                )
              },
              onError: (error) => toast(problemDetail(error) ?? 'Could not sync.', 'error'),
            })
          }
        >
          Review activity data
        </Button>
      </div>

      {assignmentsQuery.isPending && (
        <div aria-label="Loading assignments" className="mt-4">
          <Skeleton className="h-16" />
        </div>
      )}
      {assignments?.length === 0 && (
        <p className="mt-4 text-sm text-ink-muted">
          Nothing under review yet — hit "Review activity data" to pull in the organization's
          records.
        </p>
      )}
      {assignments && assignments.length > 0 && (
        <>
          {/* desktop: table */}
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
                  <th className="px-3 py-2 font-semibold">Fact</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Classification</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <AssignmentRow
                    key={assignment.id}
                    assignment={assignment}
                    factors={factors}
                    onClassify={(emissionFactorId) =>
                      classify.mutate(
                        { id: assignment.id, emissionFactorId },
                        {
                          onError: (error) =>
                            toast(problemDetail(error) ?? 'Could not classify.', 'error'),
                        },
                      )
                    }
                    onExclude={(reason) =>
                      exclude.mutate(
                        { id: assignment.id, reason },
                        {
                          onError: (error) =>
                            toast(problemDetail(error) ?? 'Could not exclude.', 'error'),
                        },
                      )
                    }
                    onInclude={() =>
                      include.mutate(assignment.id, {
                        onError: (error) =>
                          toast(problemDetail(error) ?? 'Could not include.', 'error'),
                      })
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* mobile: one card per fact */}
          <ul className="mt-4 flex flex-col gap-3 md:hidden">
            {assignments.map((assignment) => (
              <li
                key={assignment.id}
                className="flex flex-col gap-2 rounded-xl border border-teal/10 bg-white/40 p-3"
              >
                <div>
                  <p className="font-medium">{assignment.activityType}</p>
                  <p className="text-xs text-ink-muted">
                    {assignment.facilityName} · {assignment.quantity.toLocaleString()}{' '}
                    {assignment.unit} · {assignment.activityDate}
                  </p>
                </div>
                <StatusPills
                  assignment={assignment}
                  onInclude={() =>
                    include.mutate(assignment.id, {
                      onError: (error) =>
                        toast(problemDetail(error) ?? 'Could not include.', 'error'),
                    })
                  }
                />
                {assignment.included && (
                  <>
                    <ClassifySelect
                      assignment={assignment}
                      factors={factors}
                      onClassify={(emissionFactorId) =>
                        classify.mutate(
                          { id: assignment.id, emissionFactorId },
                          {
                            onError: (error) =>
                              toast(problemDetail(error) ?? 'Could not classify.', 'error'),
                          },
                        )
                      }
                    />
                    <div>
                      <ExcludeMenu
                        assignment={assignment}
                        onExclude={(reason) =>
                          exclude.mutate(
                            { id: assignment.id, reason },
                            {
                              onError: (error) =>
                                toast(problemDetail(error) ?? 'Could not exclude.', 'error'),
                            },
                          )
                        }
                      />
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </GlassCard>
  )
}

function AssignmentRow({
  assignment,
  factors,
  onClassify,
  onExclude,
  onInclude,
}: {
  assignment: Assignment
  factors: { id: string; name: string; unit: string }[]
  onClassify: (factorId: string) => void
  onExclude: (reason: ExclusionReason) => void
  onInclude: () => void
}) {
  return (
    <tr className="border-b border-teal/5 last:border-0">
      <td className="px-3 py-2">
        <span className="font-medium">{assignment.activityType}</span>
        <span className="block text-xs text-ink-muted">
          {assignment.facilityName} · {assignment.quantity.toLocaleString()} {assignment.unit} ·{' '}
          {assignment.activityDate}
        </span>
      </td>
      <td className="px-3 py-2">
        <StatusPills assignment={assignment} onInclude={onInclude} />
      </td>
      <td className="px-3 py-2">
        {assignment.included ? (
          <ClassifySelect assignment={assignment} factors={factors} onClassify={onClassify} />
        ) : (
          <span className="text-xs text-ink-muted">—</span>
        )}
      </td>
      <td className="px-3 py-2 text-right whitespace-nowrap">
        {assignment.included && <ExcludeMenu assignment={assignment} onExclude={onExclude} />}
      </td>
    </tr>
  )
}

// --- launch + runs -----------------------------------------------------------

function LaunchSection({
  inventoryId,
  finalRunId,
}: {
  inventoryId: string
  finalRunId: string | null
}) {
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
            disabled={!report?.ready}
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
          Immutable snapshots of this view. Recalculation creates a new run; earlier runs are kept.
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
                  {run.id === finalRunId && (
                    <span className="ml-2 rounded-full bg-accent-green/25 px-2 py-0.5 text-xs font-bold text-dark-teal">
                      FINAL
                    </span>
                  )}
                  <span className="block text-xs text-ink-muted">
                    {new Date(run.createdAt).toLocaleString()} · {run.activityCount} line
                    {run.activityCount === 1 ? '' : 's'}
                  </span>
                </div>
                <span className="font-bold text-dark-teal">{formatCo2e(run.totalKgCo2e)}</span>
              </div>
              <div className="mt-2">
                <ScopeBreakdown run={run} />
              </div>
              <div className="mt-2 flex gap-2">
                {run.id !== finalRunId && (
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
              </div>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  )
}
