import { Link } from 'react-router-dom'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { OrganizationName } from '../../components/OrganizationName'
import { StatTile } from './components/StatTile'
import { usePlatformSettingsQuery } from './useSettings'
import { useAdminSummaryQuery } from './useSummary'
import type { SummaryActivity, SummaryGrant } from './api'

/** "2 hours", "1 hour": the same phrasing the backend writes into an organization's history. */
function hours(count: number): string {
  return `${count} ${count === 1 ? 'hour' : 'hours'}`
}

function when(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

/**
 * How long a grant ran, from the grant itself. A privileged-access register
 * wants the times that were recorded, not a countdown that reads differently
 * every time the page is opened.
 */
function ranFor(grant: SummaryGrant): string {
  const whole = Math.round(
    (new Date(grant.expiresAt).getTime() - new Date(grant.grantedAt).getTime()) / 3_600_000,
  )
  return hours(whole)
}

/** One line of the work queue: a count, a sentence, and the page that clears it. */
function QueueRow({ to, headline, detail }: { to: string; headline: string; detail: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 border-b border-teal/10 px-5 py-4 transition-colors duration-150 last:border-0 hover:bg-teal/5"
    >
      <span
        aria-hidden="true"
        className="mt-0.5 inline-flex h-2 w-2 shrink-0 rounded-full bg-amber-400"
      />
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{headline}</span>
        <span className="block text-sm text-ink-muted">{detail}</span>
      </span>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-4 w-4 shrink-0 text-ink-muted"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </Link>
  )
}

function ActivityLine({ activity }: { activity: SummaryActivity }) {
  const said: Record<string, string> = {
    PUBLISHED: 'published',
    WITHDRAWN: 'withdrew',
    SUPERSEDED: 'was superseded:',
    EVIDENCE_ATTACHED: 'attached the source document for',
  }
  return (
    <li className="flex flex-wrap items-baseline gap-x-2 border-b border-teal/5 py-2 text-sm last:border-0">
      <span className="text-ink-muted">{when(activity.at)}</span>
      <span className="font-medium">{activity.actor}</span>
      <span className="text-ink-muted">
        {said[activity.action] ?? activity.action.toLowerCase()}
      </span>
      <span className="font-medium">{activity.subject}</span>
    </li>
  )
}

function GrantLine({ grant }: { grant: SummaryGrant }) {
  const closed = grant.endedAt !== null
  return (
    <li className="border-b border-teal/5 py-2 text-sm last:border-0">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-medium">{grant.adminEmail}</span>
        <span className="text-ink-muted">
          {closed ? 'held support access to' : 'holds support access to'}
        </span>
        <span className="font-medium">
          <OrganizationName name={grant.organizationName} accountNo={grant.organizationAccountNo} />
        </span>
        <span className="text-ink-muted">
          {when(grant.grantedAt)}, {closed ? 'until' : 'expiring'}{' '}
          {when(grant.endedAt ?? grant.expiresAt)} ({ranFor(grant)})
        </span>
      </div>
      <p className="text-xs text-ink-muted">{grant.reason}</p>
    </li>
  )
}

/**
 * Where an administrator lands (spec 01.5): what needs a decision, then what
 * the platform holds, then what has happened.
 *
 * Nothing here carries tenant inventory data. Open adoption notices are a
 * bare total, never a list naming which organization has an undecided
 * methodology change: a notice states a movement computed from that
 * organization's own activity data, and an administrator is an outsider to
 * an organization until they assume logged support access (spec 01.3).
 */
export function AdminDashboardPage() {
  const summaryQuery = useAdminSummaryQuery()
  const settingsQuery = usePlatformSettingsQuery()

  if (summaryQuery.isPending) {
    return (
      <div aria-label="Loading the platform summary" className="flex flex-col gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40" />
        <Skeleton className="h-28" />
      </div>
    )
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return (
      <GlassCard className="p-10 text-center">
        <h1 className="text-lg">The platform summary could not be loaded</h1>
        <p className="mt-1 text-sm text-ink-muted">
          The pages in the sidebar still work. Reload to try the summary again.
        </p>
      </GlassCard>
    )
  }

  const { accounts, platform } = summaryQuery.data
  const approvable = platform.draftEditions.filter((draft) => draft.mayApprove).length
  const myGrants = platform.grants.filter((grant) => grant.mine && grant.endedAt === null)
  const liveGrants = platform.grants.filter((grant) => grant.endedAt === null)
  const settings = settingsQuery.data

  const queue = [
    accounts.accessRequestsPending > 0 && (
      <QueueRow
        key="requests"
        to="/admin/access-requests"
        headline={`${accounts.accessRequestsPending} access request${accounts.accessRequestsPending === 1 ? '' : 's'} waiting`}
        detail="Approve one and the account is created at once; the person sets their own password."
      />
    ),
    platform.draftEditionCount > 0 && (
      <QueueRow
        key="drafts"
        to="/admin/factor-packs"
        headline={`${platform.draftEditionCount} draft factor pack edition${platform.draftEditionCount === 1 ? '' : 's'} unpublished`}
        detail={
          approvable === 0
            ? 'You curated every one of them, so somebody else has to check and publish them.'
            : `You may approve ${approvable} of them; the rest you curated yourself.`
        }
      />
    ),
    myGrants.length > 0 && (
      <QueueRow
        key="grants"
        to="/admin/organizations"
        headline={`You hold support access to ${myGrants.length} organization${myGrants.length === 1 ? '' : 's'}`}
        detail={`The next expires ${when(myGrants[0].expiresAt)}. End it when the case is closed.`}
      />
    ),
    accounts.administrators === 1 && (
      <QueueRow
        key="lone-admin"
        to="/admin/users"
        headline="You are the only active administrator"
        detail="Nobody can publish a factor pack edition you curated, and nobody can cover for you."
      />
    ),
  ].filter(Boolean)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl">Platform overview</h1>
        <p className="mt-1 text-sm text-ink-muted">
          The accounts, organizations and factor packs this deployment holds. Client inventory data
          stays inside each organization.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg">Needs your attention</h2>
        <GlassCard>
          {queue.length > 0 ? (
            queue
          ) : (
            <p className="p-10 text-center text-sm text-ink-muted">Nothing is waiting on you.</p>
          )}
        </GlassCard>
      </section>

      <section>
        <h2 className="mb-3 text-lg">The platform</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Users"
            value={accounts.usersTotal}
            detail={`${accounts.usersActive} active, ${accounts.usersPending} pending`}
            to="/admin/users"
          />
          <StatTile
            label="Organizations"
            value={platform.organizations}
            detail={`${liveGrants.length} with support access`}
            to="/admin/organizations"
          />
          <StatTile
            label="Factor pack editions"
            value={platform.publishedEditions}
            detail={`published; ${platform.draftEditionCount} draft, ${platform.withdrawnEditions} withdrawn`}
            to="/admin/factor-packs"
          />
          <StatTile
            label="Open adoption notices"
            value={platform.openNotices}
            detail="each organization decides its own"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg">Support access</h2>
        <GlassCard className="px-5 py-2">
          {platform.grants.length > 0 ? (
            <ul>
              {platform.grants.map((grant) => (
                <GrantLine key={`${grant.organizationId}-${grant.grantedAt}`} grant={grant} />
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-ink-muted">
              No support access has been taken in the last 30 days.
            </p>
          )}
        </GlassCard>
      </section>

      <section>
        <h2 className="mb-3 text-lg">Recent platform activity</h2>
        <GlassCard className="px-5 py-2">
          {platform.recentActivity.length > 0 ? (
            <ul>
              {platform.recentActivity.map((activity) => (
                <ActivityLine key={`${activity.at}-${activity.subject}`} activity={activity} />
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-ink-muted">Nothing has happened yet.</p>
          )}
        </GlassCard>
      </section>

      {settings && (
        <p className="text-sm text-ink-muted">
          Support access lasts{' '}
          <strong className="font-semibold">{hours(settings.supportAccessWindowHours)}</strong>, and{' '}
          <strong className="font-semibold">
            {settings.organizationCreation === 'ADMINISTRATORS'
              ? 'only administrators'
              : 'everyone signed in'}
          </strong>{' '}
          may create an organization.{' '}
          <Link to="/admin/settings" className="font-semibold text-link">
            Platform settings
          </Link>
        </p>
      )}
    </div>
  )
}
