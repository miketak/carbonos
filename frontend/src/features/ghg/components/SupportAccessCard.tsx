import { GlassCard } from '../../../components/GlassCard'
import { actionLabels, formatDateTime } from '../format'
import { useOrganizationEventsQuery } from '../useGhg'
import type { Organization } from '../api'

/**
 * Who from the platform team can see inside this organization, and why (spec
 * 01.3). An active grant is shown with its expiry; past grants stay listed.
 */
export function SupportAccessCard({ organization }: { organization: Organization }) {
  const eventsQuery = useOrganizationEventsQuery(organization.id)
  const grants = organization.supportAccess ?? []
  const events = eventsQuery.data ?? []

  if (grants.length === 0 && events.length === 0) return null

  return (
    <GlassCard className="p-6">
      <h2 className="text-xl">Support access</h2>
      <p className="text-sm text-ink-muted">
        A platform administrator can take an owner's rights here for 24 hours to work a support
        case. Every grant is recorded, and every act under it is attributed to the administrator.
      </p>
      {grants.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          {grants.map((grant) => (
            <li
              key={`${grant.adminEmail}-${grant.grantedAt}`}
              className="font-medium text-dark-teal"
            >
              Support access: {grant.adminEmail} since {formatDateTime(grant.grantedAt)}:{' '}
              {grant.reason}
              <span className="block text-xs font-normal text-ink-muted">
                Until {formatDateTime(grant.expiresAt)}.
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm font-medium text-dark-teal">
          Nobody holds support access to this organization.
        </p>
      )}
      {events.length > 0 && (
        <ul className="mt-4 flex flex-col gap-1 border-t border-teal/10 pt-4 text-sm text-ink-muted">
          {events.map((event) => (
            <li key={event.id}>
              {formatDateTime(event.at)} · {actionLabels[event.action]} · {event.actor}:{' '}
              {event.reason}
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  )
}
