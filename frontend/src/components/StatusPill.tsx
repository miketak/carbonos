import type { ReactNode } from 'react'
import { StatusDot } from './StatusDot'
import type { StatusTone } from './StatusDot'

export type PillTone = 'ready' | 'attention' | 'draft' | 'neutral'

const tones: Record<PillTone, StatusTone> = {
  ready: 'success',
  attention: 'warning',
  draft: 'neutral',
  neutral: 'neutral',
}

/**
 * The readiness pill of the first design, now the dot and word of spec 10
 * under its old name and tones, while the features move to StatusDot
 * (rollout step 5).
 */
export function StatusPill({
  tone,
  title,
  children,
}: {
  tone: PillTone
  title?: string
  children: ReactNode
}) {
  return (
    <StatusDot tone={tones[tone]} title={title}>
      {children}
    </StatusDot>
  )
}
