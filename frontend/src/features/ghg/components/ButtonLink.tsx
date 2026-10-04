import { Link } from 'react-router-dom'
import type { ComponentProps } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'sm'

/*
 * The kit's Button renders a <button>; a row's Open or a header's way into a
 * page is a route, so this is the same look on a Link. Built here because the
 * kit has no link-styled button yet (spec 10, rollout step 5); it mirrors
 * Button's classes and goes when the kit grows one.
 */
const variants: Record<Variant, string> = {
  primary:
    'border-primary bg-primary text-primary-ink hover:border-primary-hover hover:bg-primary-hover',
  secondary: 'border-hairline-strong bg-surface text-ink hover:border-ink-muted',
  ghost: 'border-transparent bg-transparent text-ink hover:bg-surface-sunken',
}

const sizes: Record<Size, string> = {
  md: 'min-h-11 px-4 text-[15px]',
  sm: 'min-h-9 px-3 text-sm',
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return (
    <Link
      className={`inline-flex items-center justify-center gap-2 rounded-lg border font-medium whitespace-nowrap transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  )
}
