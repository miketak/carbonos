import { GlassCard } from '../../../components/GlassCard'
import { formatDateTime } from '../format'
import { usePublicPlatformSettingsQuery } from '../useGhg'
import type { Organization } from '../api'

/**
 * Who from the platform team can see inside this organization, and why (spec
 * 01.3). An active grant is shown with its expiry.
 *
 * It stays on the overview because spec 01.6 requires the page a member lands
 * on to state a live grant. The history of grants assumed and ended moved to
 * the settings page with the rest of the organization's own record (spec 01.7),
 * so this card carries the grant and nothing else.
 */
export function SupportAccessCard({ organization }: { organization: Organization }) {
  const settingsQuery = usePublicPlatformSettingsQuery()
  const grants = organization.supportAccess ?? []

  if (grants.length === 0) return null

  // spec 01.5: the window the operator has set, not a number baked into the copy
  const hours = settingsQuery.data?.supportAccessWindowHours
  const windowHours =
    hours === undefined ? 'a fixed window' : `${hours} ${hours === 1 ? 'hour' : 'hours'}`

  return (
    <GlassCard className="p-6">
      <h2 className="text-xl">Support access</h2>
      <p className="text-sm text-ink-muted">
        A platform administrator can take an owner's rights here for {windowHours} to work a support
        case. Every grant is recorded, and every act under it is attributed to the administrator.
        Adopting a new factor pack edition stays your decision, whoever is here.
      </p>
      <ul className="mt-4 flex flex-col gap-2 text-sm">
        {grants.map((grant) => (
          <li key={`${grant.adminEmail}-${grant.grantedAt}`} className="font-medium text-dark-teal">
            Support access: {grant.adminEmail} since {formatDateTime(grant.grantedAt)}:{' '}
            {grant.reason}
            <span className="block text-xs font-normal text-ink-muted">
              Until {formatDateTime(grant.expiresAt)}.
            </span>
          </li>
        ))}
      </ul>
    </GlassCard>
  )
}
