import { accountLabel } from '../lib/organizationLabel'

/**
 * An organization's name with its account number beside it (spec 01.8). Two
 * organizations may share a name, so wherever one is named in a card, a table
 * or a heading, the number goes with it. Pickers, toasts and labels that need
 * plain text use organizationLabel() instead.
 */
export function OrganizationName({
  name,
  accountNo,
  className,
}: {
  name: string
  accountNo: number | null
  className?: string
}) {
  return (
    <span className={className}>
      {name}
      {accountNo !== null && (
        <span className="ml-2 font-mono text-xs font-medium tracking-wide text-ink-muted">
          {accountLabel(accountNo)}
        </span>
      )}
    </span>
  )
}
