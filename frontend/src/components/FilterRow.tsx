import { useId } from 'react'
import type { ComponentPropsWithRef, ReactNode } from 'react'
import { controlClasses } from './Field'

/*
 * The search and up to four filters on one row, sharing the width (spec 10):
 * the search takes the larger share and the filters split the rest. Under
 * 1100 px the search spans the row and the filters sit two to a line; the
 * filters never stack one per line.
 */
const columns: Record<number, string> = {
  0: 'lg:grid-cols-[minmax(220px,1fr)]',
  1: 'lg:grid-cols-[minmax(220px,1.6fr)_minmax(0,1fr)]',
  2: 'lg:grid-cols-[minmax(220px,2fr)_repeat(2,minmax(0,1fr))]',
  3: 'lg:grid-cols-[minmax(220px,1.6fr)_repeat(3,minmax(0,1fr))]',
  4: 'lg:grid-cols-[minmax(220px,1.6fr)_repeat(4,minmax(0,1fr))]',
}

export function FilterRow({
  search,
  filters,
  children,
}: {
  search: ReactNode
  /** how many filters follow the search (at most four); defaults to the number of children */
  filters?: number
  children?: ReactNode
}) {
  const count = Math.min(
    4,
    filters ?? (Array.isArray(children) ? children.length : children ? 1 : 0),
  )
  return (
    <div className={`grid grid-cols-2 items-center gap-3 ${columns[count]}`}>
      <div className="col-span-2 lg:col-span-1">{search}</div>
      {children}
    </div>
  )
}

/** A search field with its icon; the label is for screen readers. */
export function SearchField({
  label,
  id,
  className = '',
  ...props
}: ComponentPropsWithRef<'input'> & { label: string }) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  return (
    <div className={`relative ${className}`}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <label htmlFor={fieldId} className="sr-only">
        {label}
      </label>
      <input id={fieldId} type="search" className={`${controlClasses} pl-10`} {...props} />
    </div>
  )
}

/** A filter select on the row; the label is for screen readers, the value says what is chosen. */
export function FilterSelect({
  label,
  id,
  className = '',
  children,
  ...props
}: ComponentPropsWithRef<'select'> & { label: string }) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  return (
    <div className={className}>
      <label htmlFor={fieldId} className="sr-only">
        {label}
      </label>
      <select id={fieldId} className={controlClasses} {...props}>
        {children}
      </select>
    </div>
  )
}
