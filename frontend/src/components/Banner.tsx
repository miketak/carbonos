import type { ReactNode } from 'react'

export type BannerTone = 'neutral' | 'info' | 'warning' | 'danger'

const edges: Record<BannerTone, string> = {
  neutral: 'border-l-ink-muted',
  info: 'border-l-info',
  warning: 'border-l-warning-dot',
  danger: 'border-l-danger-dot',
}

/**
 * A notice in the flow of the page (spec 10): a hairline box with a coloured
 * left edge. The read-only, support-access and completeness notices.
 */
export function Banner({
  tone = 'neutral',
  title,
  role,
  className = '',
  children,
}: {
  tone?: BannerTone
  title?: ReactNode
  role?: 'status' | 'alert'
  className?: string
  children?: ReactNode
}) {
  return (
    <div
      role={role}
      className={`flex items-start gap-3 rounded-lg border border-hairline border-l-[3px] bg-surface px-4 py-3.5 text-sm ${edges[tone]} ${className}`}
    >
      <div className="min-w-0">
        {title && <div className="font-semibold">{title}</div>}
        {children && <div className={title ? 'mt-0.5 text-ink-muted' : ''}>{children}</div>}
      </div>
    </div>
  )
}
