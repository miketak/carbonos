import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'

const variants: Record<Variant, string> = {
  primary: 'bg-teal-deep text-white hover:bg-dark-teal',
  ghost: 'bg-transparent text-dark-teal hover:bg-teal/10',
  danger: 'bg-red-600 text-white hover:bg-red-500',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  busy?: boolean
}

export function Button({
  variant = 'primary',
  busy = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || busy}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-bright-teal focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`}
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
