import { Fragment } from 'react'
import { Link } from 'react-router-dom'

export interface Crumb {
  label: string
  to?: string
}

/** A "you are here" trail; the last crumb is the current page. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm">
      {items.map((item, index) => {
        const last = index === items.length - 1
        return (
          <Fragment key={index}>
            {item.to && !last ? (
              <Link to={item.to} className="text-ink-muted hover:text-ink hover:underline">
                {item.label}
              </Link>
            ) : (
              <span
                className={last ? 'text-ink' : 'text-ink-muted'}
                aria-current={last ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
            {!last && (
              <span aria-hidden="true" className="text-ink-faint">
                /
              </span>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
