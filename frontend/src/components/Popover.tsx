import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

/**
 * A panel anchored under its trigger (spec 10): the pre-flight checks, a row
 * menu. Not a modal: the page stays in reach; Esc, a click outside, or the
 * trigger closes it, and focus goes back to the trigger.
 */
export function Popover({
  open,
  onClose,
  label,
  trigger,
  align = 'right',
  width = 'w-[min(480px,92vw)]',
  children,
}: {
  open: boolean
  onClose: () => void
  label: string
  trigger: ReactNode
  align?: 'left' | 'right'
  width?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      onClose()
      ref.current?.querySelector<HTMLElement>('[aria-expanded]')?.focus()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <div ref={ref} className="relative">
      {trigger}
      {open && (
        <div
          role="dialog"
          aria-label={label}
          className={`absolute top-[calc(100%+8px)] z-50 ${align === 'right' ? 'right-0' : 'left-0'} ${width} rounded-lg border border-hairline bg-surface-raised shadow-pop`}
        >
          {children}
        </div>
      )}
    </div>
  )
}
