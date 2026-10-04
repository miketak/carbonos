import type { ReactNode } from 'react'

/** A row of figures separated by hairlines (spec 10); each child is a Stat. */
export function StatStrip({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <dl aria-label={label} className="flex flex-wrap border-y border-hairline">
      {children}
    </dl>
  )
}

export function Stat({
  label,
  value,
  unit,
  note,
}: {
  label: ReactNode
  value: ReactNode
  unit?: ReactNode
  note?: ReactNode
}) {
  return (
    <div className="flex-1 basis-48 border-r border-hairline px-3 py-4 last:border-r-0">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="mt-1 flex items-baseline gap-2 text-3xl leading-tight font-medium tracking-tight">
        {value}
        {unit && <span className="text-sm font-normal text-ink-muted">{unit}</span>}
      </dd>
      {note && <dd className="mt-1 text-[13px] text-ink-muted">{note}</dd>}
    </div>
  )
}
