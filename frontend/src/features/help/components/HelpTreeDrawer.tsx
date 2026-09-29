import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * The tree on a phone: a panel docked to the left under the help header,
 * opened by Browse. Esc closes it and focus returns to the button; Tab stays
 * inside while it is open, since it covers the page at this width.
 */
export function HelpTreeDrawer({
  onClose,
  children,
}: {
  onClose: () => void
  children: ReactNode
}) {
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const bodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.querySelector<HTMLElement>('a, button')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab' || !panel.current) return
      const focusable = [...panel.current.querySelectorAll<HTMLElement>('a, button')].filter(
        (el) => !el.hidden,
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = bodyOverflow
      opener?.focus()
    }
  }, [onClose])

  return createPortal(
    <div className="help-drawer-scrim" onClick={onClose}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Help topics"
        className="help-drawer"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="help-drawer-head">
          <span className="help-drawer-title">Help topics</span>
          <button type="button" className="help-drawer-close" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="help-drawer-body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
