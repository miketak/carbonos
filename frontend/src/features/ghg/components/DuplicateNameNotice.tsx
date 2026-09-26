import { organizationLabel } from '../../../lib/organizationLabel'
import type { DuplicateOrganization } from '../duplicateName'

/**
 * The warn-then-allow notice of spec 01.8: another organization already
 * carries the name the form asked for. It names each one with its account
 * number, so the reader can tell whether theirs is a different organization,
 * and says which button proceeds anyway.
 */
export function DuplicateNameNotice({
  detail,
  duplicates,
  proceed,
}: {
  detail: string | undefined
  duplicates: DuplicateOrganization[]
  proceed: string
}) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-300/60 bg-amber-50/80 px-4 py-3 text-sm text-dark-teal"
    >
      <p className="font-medium">{detail ?? 'An organization with this name already exists.'}</p>
      <ul className="mt-2 list-disc pl-5">
        {duplicates.map((duplicate) => (
          <li key={duplicate.id}>{organizationLabel(duplicate)}</li>
        ))}
      </ul>
      <p className="mt-2 text-ink-muted">
        Two organizations may share a name; the account number tells them apart. Click{' '}
        <strong>{proceed}</strong> to proceed with this name, or change it.
      </p>
    </div>
  )
}
