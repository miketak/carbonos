import { StatusPill } from '../../../components/StatusPill'
import type { Activity, Assignment, ConsolidationApproach, GhgScope, Inventory } from '../api'
import {
  activityIssueLabels,
  approachLabels,
  exclusionLabels,
  formatCo2e,
  scopeLabels,
} from '../format'

const scopeStyles: Record<GhgScope, string> = {
  SCOPE_1: 'bg-dark-teal text-white',
  SCOPE_2: 'bg-teal/20 text-dark-teal',
  SCOPE_3: 'bg-accent-green/25 text-dark-teal',
}

export function ScopeBadge({ scope }: { scope: GhgScope }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${scopeStyles[scope]}`}
    >
      {scopeLabels[scope]}
    </span>
  )
}

export function ApproachBadge({ approach }: { approach: ConsolidationApproach }) {
  return (
    <span className="inline-block rounded-full bg-teal/15 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-dark-teal">
      {approachLabels[approach]}
    </span>
  )
}

const statusStyles: Record<Inventory['status'], string> = {
  DRAFT: 'border-amber-300 bg-amber-50 text-amber-700',
  FROZEN: 'border-teal/40 bg-teal/10 text-link',
  FINAL: 'border-teal/40 bg-accent-green/25 text-dark-teal',
  PUBLISHED: 'border-dark-teal/40 bg-dark-teal text-white',
}

/** The inventory's lifecycle state (spec 05.1), in the pre-flight panel's instrument idiom. */
export function InventoryStatusBadge({
  inventory,
}: {
  inventory: Pick<Inventory, 'status' | 'currentBoundaryVersionNo' | 'supersededById'>
}) {
  const label =
    inventory.status === 'DRAFT'
      ? 'DRAFT'
      : inventory.status === 'PUBLISHED' && inventory.supersededById
        ? 'PUBLISHED · SUPERSEDED'
        : `${inventory.status} · BOUNDARY v${inventory.currentBoundaryVersionNo}`
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 font-mono text-xs font-bold tracking-widest whitespace-nowrap ${statusStyles[inventory.status]}`}
    >
      {label}
    </span>
  )
}

/**
 * A record's readiness (spec 04.6): Ready, Draft, or the first thing it
 * lacks with the rest in the tooltip. Completeness, not assurance.
 */
export function ActivityStatusPill({
  activity,
}: {
  activity: Pick<Activity, 'status' | 'issues'>
}) {
  const blocking = activity.issues.filter((issue) => issue !== 'EVIDENCE_REFERENCE_ONLY')
  const all = activity.issues.map((issue) => activityIssueLabels[issue]).join(', ')
  if (activity.status === 'READY') {
    return (
      <StatusPill tone="ready" title={all || 'All completeness checks passed'}>
        Ready
      </StatusPill>
    )
  }
  if (activity.status === 'DRAFT') {
    return (
      <StatusPill tone="draft" title={all || 'A draft; not yet a fact'}>
        Draft
      </StatusPill>
    )
  }
  const first = blocking[0]
  return (
    <StatusPill tone="attention" title={all}>
      {first ? activityIssueLabels[first] : 'Needs attention'}
      {blocking.length > 1 ? ` +${blocking.length - 1}` : ''}
    </StatusPill>
  )
}

/**
 * This inventory's decision about one fact, as pill(s). When excluded, the pill
 * is removable: the cross re-includes the fact (DR-03), and an automatic
 * exclusion says why in words (spec 03.2).
 */
export function AssignmentStatusPills({
  assignment,
  editable,
  onInclude,
}: {
  assignment: Assignment
  editable: boolean
  onInclude: () => void
}) {
  if (!assignment.included) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1 rounded-full bg-slate-200 py-0.5 pr-1 pl-2.5 text-xs font-semibold text-slate-600">
        Excluded · {assignment.exclusionReason ? exclusionLabels[assignment.exclusionReason] : ''}
        {assignment.exclusionDetail && (
          <span className="font-normal text-slate-500">({assignment.exclusionDetail})</span>
        )}
        {assignment.exclusionJustification && (
          <span className="font-normal text-slate-500">
            {assignment.exclusionJustification}
            {/* spec 04.8: a record nobody sized reads as "not estimated", never as ~0 */}
            {assignment.gas !== null ? `; ${assignment.gas}, outside the scopes` : ''}
            {assignment.estimateState === 'NOT_ESTIMATED' ? '; not estimated' : ''}
            {assignment.estimateState === 'EMITS_NOTHING' ? '; emits nothing' : ''}
            {assignment.estimateState === 'ESTIMATED' && assignment.estimatedKgCo2e !== null
              ? `; about ${formatCo2e(assignment.estimatedKgCo2e)} left out`
              : ''}
          </span>
        )}
        {editable && (
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
        {assignment.inherited && (
          <span
            className="inline-block rounded-full border border-teal/30 px-2 py-0.5 text-xs text-ink-muted"
            title="Copied from the source inventory's decision about this record (spec 05.3)"
          >
            inherited
          </span>
        )}
      </span>
    )
  }
  return (
    <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
      Unclassified
    </span>
  )
}
