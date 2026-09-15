import { useSession } from '../../auth/useSession'
import { formatDateTime } from '../format'
import type { Organization } from '../api'

/**
 * Spec 01.6: an administrator working under support access is told so on every
 * page of the organization, not only on the overview. Spec 01.5 put a one-click
 * route from the administration panel into the product, so a session can now be
 * spent deep in a client's register; standing and expiry have to travel with it
 * (spec 01.3), the way spec 01.4's read-only banner travels with a verifier.
 */
export function SupportAccessBanner({ organization }: { organization: Organization }) {
  const session = useSession()
  if (organization.myRole !== 'ADMIN') return null

  const email = session.data?.email
  const grants = organization.supportAccess ?? []
  const grant = grants.find((held) => held.adminEmail === email) ?? grants[0]

  return (
    <p
      role="status"
      className="mb-6 rounded-lg border border-amber-300/60 bg-amber-50/80 px-4 py-2.5 text-sm font-medium text-dark-teal"
    >
      You are in {organization.name} under support access
      {grant ? ` until ${formatDateTime(grant.expiresAt)}` : ''}. Every act is recorded in this
      organization&rsquo;s history.
    </p>
  )
}
