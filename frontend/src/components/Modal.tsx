import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { Panel } from './Panel'

interface ModalProps {
  title: string
  onClose: () => void
  /** `lg` for a dialog that holds a table, such as an import preview. */
  size?: 'md' | 'lg'
  children: ReactNode
}

/**
 * Centered flat dialog over a scrim. Esc or scrim click closes. Rendered
 * through a portal on the body: a `fixed` overlay inside an animated card
 * would be positioned against that card, not the viewport, and its buttons
 * could end up off-screen or under a sibling card.
 */
export function Modal({ title, onClose, size = 'md', children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // focus once on open (an inline onClose is a new function every render, and refocusing on each
  // keystroke would steal typing from any field but the first)
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    panelRef.current?.querySelector<HTMLElement>('input, select, button')?.focus()
    return () => previouslyFocused?.focus()
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--scrim)] p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <Panel
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`max-h-[calc(100vh-2rem)] w-full animate-[modal-in_150ms_ease-out] overflow-y-auto p-6 shadow-pop ${
          size === 'lg' ? 'max-w-3xl' : 'max-w-md'
        }`}
      >
        <h2 className="mb-4 text-xl">{title}</h2>
        {children}
      </Panel>
    </div>,
    document.body,
  )
}
