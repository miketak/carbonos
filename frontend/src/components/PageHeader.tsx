import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Breadcrumb } from './Breadcrumb'
import type { Crumb } from './Breadcrumb'

/**
 * The head of every page (spec 10): a breadcrumb row with the way back, the
 * trail, a help link and the page's status line; then the title row with
 * the title, its chips, a subtitle, and the page's actions on the right.
 */
export function PageHeader({
  back,
  crumbs,
  help,
  status,
  title,
  chips,
  subtitle,
  actions,
  size = 'lg',
}: {
  /** where Back leads: a form to its list, a run to its inventory, the register to the overview */
  back?: { to: string; label?: string }
  crumbs?: Crumb[]
  help?: ReactNode
  status?: ReactNode
  title: ReactNode
  chips?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  size?: 'lg' | 'md'
}) {
  const hasTrail = back || (crumbs && crumbs.length > 0) || help || status
  return (
    <div className="flex flex-col gap-6">
      {hasTrail && (
        <div className="flex min-h-6 items-center justify-between gap-4 text-sm text-ink-muted">
          <div className="flex items-center gap-3.5">
            {back && (
              <Link
                to={back.to}
                className="-ml-1.5 inline-flex min-h-8 items-center gap-1.5 rounded-md py-0 pr-2.5 pl-1.5 text-sm font-medium text-ink-muted hover:bg-surface-sunken hover:text-ink"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                {back.label ?? 'Back'}
              </Link>
            )}
            {crumbs && crumbs.length > 0 && <Breadcrumb items={crumbs} />}
            {help}
          </div>
          {status && <div className="text-xs whitespace-nowrap text-ink-muted">{status}</div>}
        </div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3.5">
            <h1
              className={`leading-[1.1] font-semibold tracking-[-0.02em] ${size === 'lg' ? 'text-[40px]' : 'text-[32px]'}`}
            >
              {title}
            </h1>
            {chips}
          </div>
          {subtitle && <p className="mt-2 text-[17px] text-ink-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </div>
  )
}
