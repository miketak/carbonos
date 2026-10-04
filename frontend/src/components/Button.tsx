import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'sm'

/*
 * Spec 10: one filled button per view (primary), an outlined one beside it
 * (secondary), text-only for the quiet acts (ghost), and the destructive
 * one (danger). 44 px tall by default; `sm` for a row's actions.
 */
const variants: Record<Variant, string> = {
  primary:
    'border-primary bg-primary text-primary-ink hover:border-primary-hover hover:bg-primary-hover',
  secondary: 'border-hairline-strong bg-surface text-ink hover:border-ink-muted',
  ghost: 'border-transparent bg-transparent text-ink hover:bg-surface-sunken',
  danger: 'border-danger bg-danger text-white hover:opacity-90',
}

const sizes: Record<Size, string> = {
  md: 'min-h-11 px-4 text-[15px]',
  sm: 'min-h-9 px-3 text-sm',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  busy?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  busy = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || busy}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border font-medium whitespace-nowrap transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {busy && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  )
}
