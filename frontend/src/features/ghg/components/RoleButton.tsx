import { useId } from 'react'
import type { ComponentProps } from 'react'
import { Button } from '../../../components/Button'

/**
 * A write control that sits beside read content (spec 01.4): outside the
 * caller's role set it stays in place, disabled, and names the role it needs
 * in a tooltip and in text an assistive technology reads.
 */
export function RoleButton({
  allowed,
  tooltip,
  disabled,
  title,
  children,
  ...props
}: ComponentProps<typeof Button> & { allowed: boolean; tooltip: string }) {
  const hintId = useId()
  if (allowed) {
    return (
      <Button disabled={disabled} title={title} {...props}>
        {children}
      </Button>
    )
  }
  return (
    <>
      <Button disabled title={tooltip} aria-describedby={hintId} {...props}>
        {children}
      </Button>
      <span id={hintId} className="sr-only">
        {tooltip}
      </span>
    </>
  )
}
