import type { ComponentPropsWithRef, ReactNode } from 'react'

/*
 * The data table of the workbench (spec 10): a hairline under the head and
 * under every row, two-line cells, right-aligned quantities, and a footer
 * with the count and the pager. Features compose these; the semantics stay
 * a plain table.
 */

export function Table({ className = '', ...props }: ComponentPropsWithRef<'table'>) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse text-[15px] ${className}`} {...props} />
    </div>
  )
}

export function Th({
  align = 'left',
  className = '',
  ...props
}: ComponentPropsWithRef<'th'> & { align?: 'left' | 'right' }) {
  return (
    <th
      className={`border-b border-hairline px-3 py-2.5 text-[13px] font-medium whitespace-nowrap text-ink-muted ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${className}`}
      {...props}
    />
  )
}

export function Td({
  align = 'left',
  className = '',
  ...props
}: ComponentPropsWithRef<'td'> & { align?: 'left' | 'right' }) {
  return (
    <td
      className={`border-b border-hairline px-3 py-3.5 align-middle ${
        align === 'right' ? 'text-right whitespace-nowrap' : ''
      } ${className}`}
      {...props}
    />
  )
}

/** A record's name over its meta line, or a quantity over its unit. */
export function TwoLine({
  primary,
  secondary,
  align = 'left',
}: {
  primary: ReactNode
  secondary?: ReactNode
  align?: 'left' | 'right'
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${align === 'right' ? 'items-end' : ''}`}>
      <span className="font-medium">{primary}</span>
      {secondary && <span className="text-[13px] text-ink-muted">{secondary}</span>}
    </div>
  )
}

/** The count on the left, the pager on the right. */
export function TableFooter({ children, pager }: { children: ReactNode; pager?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-3.5 text-sm text-ink-muted">
      <div>{children}</div>
      {pager && <div className="flex items-center gap-1">{pager}</div>}
    </div>
  )
}
