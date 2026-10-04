import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { OrganizationName } from '../../components/OrganizationName'
import { PageHeader } from '../../components/PageHeader'
import { Panel, PanelBody, PanelHead } from '../../components/Panel'
import { Skeleton } from '../../components/Skeleton'
import { Stat, StatStrip } from '../../components/StatStrip'
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

type QueueTone = 'warning' | 'info'

const queueDots: Record<QueueTone, string> = {
  warning: 'bg-warning-dot',
  info: 'bg-info',
}

/**
 * One line of the work queue (spec 10): a dot, a headline over its detail, and
 * a chevron; the whole row is the link to the page that clears it.
 */
function QueueRow({
  to,
  tone,
  headline,
  detail,
}: {
  to: string
  tone: QueueTone
  headline: string
  detail: string
}) {
  return (
    <li>
      <Link
        to={to}
        className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-x-1 border-b border-hairline px-3 py-3.5 transition-colors duration-150 hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
      >
        <span className="flex justify-center">
          <span aria-hidden="true" className={`size-2 rounded-full ${queueDots[tone]}`} />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="font-medium">{headline}</span>
          <span className="text-[13px] text-ink-muted">{detail}</span>
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="size-4 shrink-0 text-ink-muted"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </Link>
    </li>
  )
}

/** One help figure against its target, linking to the metrics page (spec 09). */
function HelpFigure({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Link
      to="/admin/help"
      className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-hairline py-3 last:border-b-0 hover:text-link"
    >
      <span className="text-ink-muted">{label}</span>
      <span className="flex items-baseline gap-2">
        <span className="font-medium">{value}</span>
        <span className="text-[13px] text-ink-muted">({note})</span>
      </span>
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
    <li className="flex flex-wrap items-baseline gap-x-2 border-b border-hairline py-2.5 text-sm last:border-b-0">
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
    <li className="border-b border-hairline py-2.5 text-sm last:border-b-0">
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
      <p className="text-[13px] text-ink-muted">{grant.reason}</p>
    </li>
  )
}

/** A stat's label, linking to the register behind the figure where there is one. */
function statLabel(label: string, to?: string): ReactNode {
  return to ? (
    <Link to={to} className="hover:text-link hover:underline">
      {label}
    </Link>
  ) : (
    label
  )
}

const crumbs = [{ label: 'Administration' }, { label: 'Dashboard' }]

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
      <Panel className="p-10 text-center">
        <h1 className="text-lg">The platform summary could not be loaded</h1>
        <p className="mt-1 text-sm text-ink-muted">
          The pages in the sidebar still work. Reload to try the summary again.
        </p>
      </Panel>
    )
  }

  const { accounts, platform, help } = summaryQuery.data
  const approvable = platform.draftEditions.filter((draft) => draft.mayApprove).length
  const myGrants = platform.grants.filter((grant) => grant.mine && grant.endedAt === null)
  const liveGrants = platform.grants.filter((grant) => grant.endedAt === null)
  const settings = settingsQuery.data

  const queue = [
    accounts.accessRequestsPending > 0 && (
      <QueueRow
        key="requests"
        to="/admin/access-requests"
        tone="warning"
        headline={`${accounts.accessRequestsPending} access request${accounts.accessRequestsPending === 1 ? '' : 's'} waiting`}
        detail="Approve one and the account is created at once; the person sets their own password."
      />
    ),
    platform.draftEditionCount > 0 && (
      <QueueRow
        key="drafts"
        to="/admin/factor-packs"
        tone="info"
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
        tone="info"
        headline={`You hold support access to ${myGrants.length} organization${myGrants.length === 1 ? '' : 's'}`}
        detail={`The next expires ${when(myGrants[0].expiresAt)}. End it when the case is closed.`}
      />
    ),
    help.pagesBelowTarget.length > 0 && (
      <QueueRow
        key="help-pages"
        to="/admin/help"
        tone="warning"
        headline={`${help.pagesBelowTarget.length} help page${help.pagesBelowTarget.length === 1 ? '' : 's'} under the 80% helpful target`}
        detail="Each has at least five votes. The comments say what readers were missing."
      />
    ),
    accounts.administrators === 1 && (
      <QueueRow
        key="lone-admin"
        to="/admin/users"
        tone="warning"
        headline="You are the only active administrator"
        detail="Nobody can publish a factor pack edition you curated, and nobody can cover for you."
      />
    ),
  ].filter(Boolean)

  const helpfulRate =
    help.feedback.helpfulRate30d === null ? 0 : Math.round(help.feedback.helpfulRate30d * 100)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        crumbs={crumbs}
        title="Platform overview"
        subtitle="The accounts, organizations and factor packs this deployment holds. Client inventory data stays inside each organization."
      />

      <Panel>
        <PanelHead title="Needs your attention" />
        {queue.length > 0 ? (
          <ul className="[&>li:last-child>a]:border-b-0">{queue}</ul>
        ) : (
          <p className="p-10 text-center text-sm text-ink-muted">Nothing is waiting on you.</p>
        )}
      </Panel>

      <StatStrip label="The platform">
        <Stat
          label={statLabel('Users', '/admin/users')}
          value={accounts.usersTotal.toLocaleString()}
          note={`${accounts.usersActive} active, ${accounts.usersPending} pending`}
        />
        <Stat
          label={statLabel('Organizations', '/admin/organizations')}
          value={platform.organizations.toLocaleString()}
          note={`${liveGrants.length} with support access`}
        />
        <Stat
          label={statLabel('Factor pack editions', '/admin/factor-packs')}
          value={platform.publishedEditions.toLocaleString()}
          note={`published; ${platform.draftEditionCount} draft, ${platform.withdrawnEditions} withdrawn`}
        />
        <Stat
          label="Open adoption notices"
          value={platform.openNotices.toLocaleString()}
          note="each organization decides its own"
        />
      </StatStrip>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHead title="The help" />
          <PanelBody className="py-2 text-sm">
            <HelpFigure
              label="Helpful votes, 30 days"
              value={`${helpfulRate}%`}
              note={
                help.feedback.helpfulRate30d === null
                  ? 'no votes yet; target 80%'
                  : `${help.feedback.votes30d} vote${help.feedback.votes30d === 1 ? '' : 's'}; target 80%`
              }
            />
            <HelpFigure
              label="Searches with no result, 30 days"
              value={help.search.misses30d.toLocaleString()}
              note={
                help.search.missRate30d === null
                  ? 'no searches yet; target under 5%'
                  : `${Math.round(help.search.missRate30d * 100)}% of ${help.search.searches30d} search${help.search.searches30d === 1 ? '' : 'es'}; target under 5%`
              }
            />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="Support access" />
          <PanelBody className="py-2">
            {platform.grants.length > 0 ? (
              <ul>
                {platform.grants.map((grant) => (
                  <GrantLine key={`${grant.organizationId}-${grant.grantedAt}`} grant={grant} />
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-ink-muted">
                No support access has been taken in the last 30 days.
              </p>
            )}
          </PanelBody>
        </Panel>
      </div>

      <Panel>
        <PanelHead title="Recent platform activity" />
        <PanelBody className="py-2">
          {platform.recentActivity.length > 0 ? (
            <ul>
              {platform.recentActivity.map((activity) => (
                <ActivityLine key={`${activity.at}-${activity.subject}`} activity={activity} />
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-ink-muted">Nothing has happened yet.</p>
          )}
        </PanelBody>
      </Panel>

      {settings && (
        <p className="text-[13px] text-ink-muted">
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
