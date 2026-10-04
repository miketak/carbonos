import type { ReactNode } from 'react'

/*
 * One record beside the register it came from (spec 10): the register as a
 * summary list on the left, the record's detail on the right. The page
 * shows the full table until a record is opened; the feature decides which.
 */
export function SplitView({
  list,
  detail,
  listLabel,
  detailLabel,
}: {
  list: ReactNode
  detail: ReactNode
  listLabel: string
  detailLabel: string
}) {
  return (
    <div className="grid grid-cols-1 border-t border-hairline pt-5 lg:grid-cols-[minmax(300px,400px)_minmax(0,1fr)]">
      <section
        aria-label={listLabel}
        className="flex min-w-0 flex-col gap-3 border-b border-hairline pb-5 lg:border-r lg:border-b-0 lg:pr-7 lg:pb-0"
      >
        {list}
      </section>
      <section
        aria-label={detailLabel}
        className="flex min-w-0 flex-col gap-5 pt-5 lg:pt-0 lg:pl-9"
      >
        {detail}
      </section>
    </div>
  )
}

/** One compact row of the summary list: the name, a meta line, the quantity on the right. */
export function SummaryRow({
  title,
  meta,
  issue,
  value,
  selected,
  attention = false,
  onClick,
}: {
  title: ReactNode
  meta?: ReactNode
  /** the first issue, in the warning tone, for a record needing attention */
  issue?: ReactNode
  value?: ReactNode
  selected: boolean
  attention?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-current={selected ? 'true' : undefined}
      onClick={onClick}
      className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-0.5 border-b border-hairline py-3.5 pr-3 pl-3.5 text-left transition-colors duration-150 hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none ${
        selected ? 'bg-selected shadow-[inset_3px_0_0_var(--primary)]' : ''
      }`}
    >
      <span className="flex items-center gap-2 text-base font-medium">
        {title}
        {attention && <span aria-hidden="true" className="size-2 rounded-full bg-warning-dot" />}
      </span>
      {value !== undefined && (
        <span className="row-span-3 self-center text-right text-[15px] whitespace-nowrap">
          {value}
        </span>
      )}
      {meta && <span className="col-start-1 text-[13px] text-ink-muted">{meta}</span>}
      {issue && <span className="col-start-1 text-[13px] font-medium text-warning">{issue}</span>}
    </button>
  )
}

/** The head of the detail: an eyebrow, the record's name as a title, a meta line, and the controls. */
export function DetailHeader({
  eyebrow,
  title,
  meta,
  controls,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  meta?: ReactNode
  controls?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
            {eyebrow}
          </div>
        )}
        <h2 className="mt-1.5 text-[40px] leading-[1.1] font-semibold tracking-[-0.02em]">
          {title}
        </h2>
        {meta && <div className="mt-2 text-[15px] text-ink-muted">{meta}</div>}
      </div>
      {controls && <div className="flex shrink-0 gap-1">{controls}</div>}
    </div>
  )
}
