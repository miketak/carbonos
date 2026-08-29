import type { ComponentPropsWithRef } from 'react'

/** Frosted-glass surface on the ambient aurora ground: the ECORIV card. */
export function GlassCard({ className = '', ...props }: ComponentPropsWithRef<'div'>) {
  return (
    <div
      className={`rounded-xl border border-white/60 bg-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_4px_24px_rgba(9,168,149,0.14)] backdrop-blur-xl backdrop-saturate-150 ${className}`}
      {...props}
    />
  )
}
