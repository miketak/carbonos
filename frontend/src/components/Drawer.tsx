import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

interface DrawerProps {
  /** Small caps line above the title, for example "EDIT ACTIVITY". */
  eyebrow?: string
  title: string
  /** A line under the title: an identifier, a status pill. */
  subtitle?: ReactNode
  footer?: ReactNode
  onClose: () => void
  children: ReactNode
}

/**
 * A panel docked to the right edge, beside the page rather than over it: no
 * scrim and no `aria-modal`, so the list it edits from stays usable and its
 * keyboard shortcuts keep working. Esc closes it (unless a modal is open on
 * top); focus lands on the first control and returns to where it was.
 * Portalled like the Modal, so a transformed ancestor cannot mis-position it.
 */
export function Drawer({ eyebrow, title, subtitle, footer, onClose, children }: DrawerProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  // the first control of the content, not the Close button in the header
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    contentRef.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus()
    return () => previouslyFocused?.focus()
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      // a modal above the drawer owns Esc
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return
      onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return createPortal(
    <aside
      role="dialog"
      aria-label={title}
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-xl animate-[drawer-in_180ms_ease-out] flex-col border-l border-hairline bg-surface shadow-pop"
    >
      <header className="flex items-start justify-between gap-3 border-b border-hairline px-6 py-5">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
              {eyebrow}
            </p>
          )}
          <h2 className="mt-1 truncate text-2xl tracking-[-0.01em]">{title}</h2>
          {subtitle && (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
              {subtitle}
            </div>
          )}
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors duration-150 hover:bg-surface-sunken hover:text-ink focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
            className="size-[18px]"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </header>
      <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {children}
      </div>
      {footer && <footer className="border-t border-hairline px-6 py-3.5">{footer}</footer>}
    </aside>,
    document.body,
  )
}
