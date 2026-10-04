import { Banner } from '../../../components/Banner'
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
    <Banner
      role="alert"
      tone="warning"
      title={detail ?? 'An organization with this name already exists.'}
    >
      <ul className="mt-1 list-disc pl-5 text-ink">
        {duplicates.map((duplicate) => (
          <li key={duplicate.id}>{organizationLabel(duplicate)}</li>
        ))}
      </ul>
      <p className="mt-2">
        Two organizations may share a name; the account number tells them apart. Click{' '}
        <strong>{proceed}</strong> to proceed with this name, or change it.
      </p>
    </Banner>
  )
}
