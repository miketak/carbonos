import type { ConsolidationApproach, GhgScope } from '../api'
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
