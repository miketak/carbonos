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
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-xl animate-[drawer-in_180ms_ease-out] flex-col border-l border-white/70 bg-white/90 shadow-[-8px_0_32px_rgba(9,168,149,0.16)] backdrop-blur-xl backdrop-saturate-150 md:top-[57px]"
    >
      <header className="flex items-start justify-between gap-3 border-b border-teal/10 px-5 py-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[11px] font-semibold tracking-widest text-ink-muted uppercase">
              {eyebrow}
            </p>
          )}
          <h2 className="truncate text-lg">{title}</h2>
          {subtitle && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
              {subtitle}
            </div>
          )}
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors duration-150 hover:bg-teal/10 hover:text-dark-teal focus-visible:ring-2 focus-visible:ring-bright-teal focus-visible:outline-none"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
            className="h-4 w-4"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </header>
      <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {children}
      </div>
      {footer && <footer className="border-t border-teal/10 px-5 py-3">{footer}</footer>}
    </aside>,
    document.body,
  )
}
