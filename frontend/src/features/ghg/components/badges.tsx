import { StatusPill } from '../../../components/StatusPill'
import type { Activity, ConsolidationApproach, GhgScope, Inventory } from '../api'
import { activityIssueLabels, approachLabels, scopeLabels } from '../format'

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
