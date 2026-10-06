import { Chip } from '../../../components/Chip'
import type { ChipTone } from '../../../components/Chip'
import { StatusDot } from '../../../components/StatusDot'
import type { Activity, Assignment, ConsolidationApproach, GhgScope, Inventory } from '../api'
import {
  activityIssueLabels,
  approachLabels,
  exclusionLabels,
  formatCo2e,
  scopeLabels,
} from '../format'

/** A scope as an outlined chip (spec 10): the word carries it, not a tint. */
export function ScopeBadge({ scope }: { scope: GhgScope }) {
  return <Chip>{scopeLabels[scope]}</Chip>
}

export function ApproachBadge({ approach }: { approach: ConsolidationApproach }) {
  return <Chip>{approachLabels[approach]}</Chip>
}

const statusTones: Record<Inventory['status'], ChipTone> = {
  DRAFT: 'neutral',
  FROZEN: 'primary',
  IN_REVIEW: 'warning',
  FINAL: 'primary',
  PUBLISHED: 'success',
}

/** The inventory's lifecycle state (spec 05.1) as a chip; the label text is what the QA procedures read. */
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
        : `${inventory.status.replace('_', ' ')} · BOUNDARY v${inventory.currentBoundaryVersionNo}`
  return (
    <Chip tone={statusTones[inventory.status]} className="tracking-wide">
      {label}
    </Chip>
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
      <StatusDot tone="success" title={all || 'All completeness checks passed'}>
        Ready
      </StatusDot>
    )
  }
  if (activity.status === 'DRAFT') {
    return (
      <StatusDot tone="neutral" title={all || 'A draft; not yet a fact'}>
        Draft
      </StatusDot>
    )
  }
  const first = blocking[0]
  return (
    <StatusDot tone="warning" title={all}>
      {first ? activityIssueLabels[first] : 'Needs attention'}
      {blocking.length > 1 ? ` +${blocking.length - 1}` : ''}
    </StatusDot>
  )
}

/**
 * This inventory's decision about one fact, as a dot and a word (spec 10).
 * When excluded, the reason follows the word and the cross re-includes the
 * fact (DR-03); an automatic exclusion says why in words (spec 03.2).
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
      <span className="inline-flex flex-wrap items-center gap-1 text-sm">
        <StatusDot tone="neutral">
          Excluded · {assignment.exclusionReason ? exclusionLabels[assignment.exclusionReason] : ''}
        </StatusDot>
        {assignment.exclusionDetail && (
          <span className="text-[13px] text-ink-muted">({assignment.exclusionDetail})</span>
        )}
        {assignment.exclusionJustification && (
          <span className="text-[13px] text-ink-muted">
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
            className="flex size-6 items-center justify-center rounded-md text-ink-muted transition-colors duration-150 hover:bg-surface-sunken hover:text-ink focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
          >
            ✕
          </button>
        )}
      </span>
    )
  }
  if (assignment.classified) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        <StatusDot tone="success">Included</StatusDot>
        {assignment.scope && <ScopeBadge scope={assignment.scope} />}
        {assignment.inherited && (
          <Chip title="Copied from the source inventory's decision about this record (spec 05.3)">
            inherited
          </Chip>
        )}
      </span>
    )
  }
  return <StatusDot tone="warning">Unclassified</StatusDot>
}
