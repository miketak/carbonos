import type { ComponentPropsWithRef } from 'react'

/** Frosted-glass surface on the soft-mint ground: the ECORIV card. */
export function GlassCard({ className = '', ...props }: ComponentPropsWithRef<'div'>) {
  return (
    <div
      className={`rounded-xl border border-white/50 bg-white/60 shadow-[0_4px_24px_rgba(9,168,149,0.12)] backdrop-blur-xl ${className}`}
      {...props}
    />
  )
}
