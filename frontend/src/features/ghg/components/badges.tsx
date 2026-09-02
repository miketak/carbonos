import type { ConsolidationApproach, GhgScope, Inventory } from '../api'
import { approachLabels, scopeLabels } from '../format'

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

/** The boundary's lifecycle state (spec 007), in the pre-flight panel's instrument idiom. */
export function BoundaryStatusBadge({
  inventory,
}: {
  inventory: Pick<Inventory, 'boundaryStatus' | 'currentBoundaryVersionNo'>
}) {
  const frozen = inventory.boundaryStatus === 'FROZEN'
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 font-mono text-xs font-bold tracking-widest whitespace-nowrap ${
        frozen
          ? 'border-teal/40 bg-teal/10 text-link'
          : 'border-amber-300 bg-amber-50 text-amber-700'
      }`}
    >
      {frozen ? `BOUNDARY FROZEN v${inventory.currentBoundaryVersionNo}` : 'BOUNDARY DRAFT'}
    </span>
  )
}
