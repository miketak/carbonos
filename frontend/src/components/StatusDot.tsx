import type { ReactNode } from 'react'

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const dots: Record<StatusTone, string> = {
  success: 'bg-success-dot',
  warning: 'bg-warning-dot',
  danger: 'bg-danger-dot',
  info: 'bg-info',
  neutral: 'bg-ink-faint',
}

const words: Record<StatusTone, string> = {
  success: 'text-ink',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-ink',
  neutral: 'text-ink-muted',
}

/**
 * A state as a dot and a word (spec 10): the dot is coloured by tone, the word
 * carries the meaning, so nothing here is said by colour alone.
 */
export function StatusDot({
  tone,
  title,
  className = '',
  children,
}: {
  tone: StatusTone
  title?: string
  className?: string
  children: ReactNode
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-2 font-medium whitespace-nowrap ${words[tone]} ${className}`}
    >
      <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${dots[tone]}`} />
      {children}
    </span>
  )
}
