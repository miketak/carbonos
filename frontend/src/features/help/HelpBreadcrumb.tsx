import { Link } from 'react-router-dom'
import type { Crumb } from './manifest'

export function HelpBreadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="help-breadcrumb">
      <ol>
        {crumbs.map((crumb, i) => (
          <li key={crumb.to}>
            {i < crumbs.length - 1 ? (
              <Link to={crumb.to}>{crumb.label}</Link>
            ) : (
              <span aria-current="page">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
