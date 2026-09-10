import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { GlassCard } from './GlassCard'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

/**
 * Centered glass dialog over a blurred dark-teal scrim. Esc or scrim click closes.
 * Rendered through a portal on the body: a `fixed` overlay inside an animated or
 * backdrop-filtered card would be positioned against that card, not the viewport,
 * and its buttons could end up off-screen or under a sibling card.
 */
export function Modal({ title, onClose, children }: ModalProps) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-dark-teal/30 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <GlassCard
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[calc(100vh-2rem)] w-full max-w-md animate-[modal-in_150ms_ease-out] overflow-y-auto bg-white/80 p-6"
      >
        <h2 className="mb-4 text-lg">{title}</h2>
        {children}
      </GlassCard>
    </div>,
    document.body,
  )
}
