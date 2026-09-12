import { NavLink } from 'react-router-dom'

/** Records or the documents behind them: the two views of Activity data (spec 04.6). */
export function ViewSwitch({ organizationId }: { organizationId: string }) {
  const base = `/app/ghg/${organizationId}/activity`
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-150 ${
      isActive ? 'bg-teal-deep text-white' : 'text-ink-muted hover:bg-teal/10 hover:text-dark-teal'
    }`
  return (
    <nav aria-label="Activity data views" className="flex gap-1 rounded-full bg-white/60 p-1">
      <NavLink to={base} end className={linkClass}>
        Records
      </NavLink>
      <NavLink to={`${base}/documents`} className={linkClass}>
        Source documents
      </NavLink>
    </nav>
  )
}
