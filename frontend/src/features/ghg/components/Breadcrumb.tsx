import { Fragment } from 'react'
import { Link } from 'react-router-dom'

export interface Crumb {
  label: string
  to?: string
}

/** A "you are here" trail for deep workspace screens (DR-05). The last crumb is the current page. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-1 flex flex-wrap items-center gap-1.5 text-sm">
      {items.map((item, index) => {
        const last = index === items.length - 1
        return (
          <Fragment key={index}>
            {item.to && !last ? (
              <Link to={item.to} className="text-link hover:underline">
                {item.label}
              </Link>
            ) : (
              <span
                className={last ? 'font-medium text-dark-teal' : 'text-ink-muted'}
                aria-current={last ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
            {!last && (
              <span aria-hidden="true" className="text-ink-muted">
                ›
              </span>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
