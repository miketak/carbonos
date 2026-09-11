import type { ReactNode } from 'react'

export type PillTone = 'ready' | 'attention' | 'draft' | 'neutral'

const tones: Record<PillTone, string> = {
  ready: 'border-teal/30 bg-accent-green/25 text-dark-teal',
  attention: 'border-amber-300 bg-amber-50 text-amber-800',
  draft: 'border-slate-300 bg-slate-100 text-slate-700',
  neutral: 'border-teal/20 bg-teal/10 text-ink-muted',
}

const marks: Record<PillTone, string> = {
  ready: '✓',
  attention: '△',
  draft: '◌',
  neutral: '·',
}

/** A small state label: a mark and a word, coloured by tone but never by colour alone. */
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
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${tones[tone]}`}
    >
      <span aria-hidden="true">{marks[tone]}</span>
      {children}
    </span>
  )
}
