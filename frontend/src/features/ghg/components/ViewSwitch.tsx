import { NavLink } from 'react-router-dom'

/**
 * Records or the documents behind them: the two views of Activity data (spec
 * 04.6), as a segmented control (spec 10). The open view has the selected fill.
 */
export function ViewSwitch({ organizationId }: { organizationId: string }) {
  const base = `/app/ghg/${organizationId}/activity`
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex min-h-9 items-center px-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none ${
      isActive ? 'bg-selected text-ink' : 'bg-surface text-ink-muted hover:text-ink'
    }`
  return (
    <nav
      aria-label="Activity data views"
      className="inline-flex overflow-hidden rounded-lg border border-hairline-strong"
    >
      <NavLink to={base} end className={linkClass}>
        Records
      </NavLink>
      <NavLink
        to={`${base}/documents`}
        className={(state) => `${linkClass(state)} border-l border-hairline-strong`}
      >
        Source documents
      </NavLink>
    </nav>
  )
}
