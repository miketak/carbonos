import type { ComponentPropsWithRef, ReactNode } from 'react'

/** The flat card of the workbench (spec 10): one surface, one hairline, one radius. */
export function Panel({ className = '', ...props }: ComponentPropsWithRef<'div'>) {
  return <div className={`rounded-lg border border-hairline bg-surface ${className}`} {...props} />
}

/** A panel's head: a title, an optional line under it, and whatever acts on the panel. */
export function PanelHead({
  title,
  description,
  children,
  className = '',
}: {
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 border-b border-hairline px-5 py-4 ${className}`}
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-ink-muted">{description}</p>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  )
}

export function PanelBody({ className = '', ...props }: ComponentPropsWithRef<'div'>) {
  return <div className={`p-5 ${className}`} {...props} />
}
