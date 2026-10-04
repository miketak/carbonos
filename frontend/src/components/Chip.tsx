import type { ReactNode } from 'react'

export type ChipTone = 'neutral' | 'primary' | 'success' | 'warning'

const tones: Record<ChipTone, string> = {
  neutral: 'border-hairline-strong text-ink-muted',
  primary: 'border-primary text-primary',
  success: 'border-success-dot text-success',
  warning: 'border-warning-dot text-warning',
}

/** An outlined label (spec 10): a state (Draft, Final), an approach, a pack tag. */
export function Chip({
  tone = 'neutral',
  title,
  className = '',
  children,
}: {
  tone?: ChipTone
  title?: string
  className?: string
  children: ReactNode
}) {
  return (
    <span
      title={title}
      className={`inline-flex h-[26px] items-center gap-1.5 rounded-md border bg-surface px-2 text-[13px] font-medium whitespace-nowrap ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
