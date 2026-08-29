import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { GlassCard } from './GlassCard'

interface Toast {
  id: number
  message: string
  tone: 'success' | 'error'
}

const ToastContext = createContext<((message: string, tone?: Toast['tone']) => void) | null>(null)

export function useToast() {
  const toast = useContext(ToastContext)
  if (!toast) throw new Error('useToast must be used within ToastProvider')
  return toast
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const toast = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    const id = nextId.current++
    setToasts((current) => [...current, { id, message, tone }])
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 4000)
  }, [])

  const value = useMemo(() => toast, [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <GlassCard
            key={t.id}
            role="status"
            className={`animate-[modal-in_150ms_ease-out] bg-white/85 px-4 py-3 text-sm font-medium ${
              t.tone === 'error' ? 'text-red-700' : 'text-dark-teal'
            }`}
          >
            {t.message}
          </GlassCard>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
