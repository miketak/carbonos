import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { GlassCard } from './GlassCard'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

/** Centered glass dialog over a blurred dark-teal scrim. Esc or scrim click closes. */
export function Modal({ title, onClose, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    panelRef.current?.querySelector<HTMLElement>('input, select, button')?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus()
    }
  }, [onClose])

  return (
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
        className="w-full max-w-md animate-[modal-in_150ms_ease-out] bg-white/80 p-6"
      >
        <h2 className="mb-4 text-lg">{title}</h2>
        {children}
      </GlassCard>
    </div>
  )
}
