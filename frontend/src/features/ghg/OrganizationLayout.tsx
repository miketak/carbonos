import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Panel } from '../../components/Panel'
import { RailLink, Sidebar, railIcons } from '../../components/Sidebar'
import type { RailSection } from '../../components/Sidebar'
import { Skeleton } from '../../components/Skeleton'
import { organizationLabel } from '../../lib/organizationLabel'
import { roleShortLabels } from './format'
import { useSession } from '../auth/useSession'
import { ReadOnlyBanner } from './components/ReadOnlyBanner'
import { SupportAccessBanner } from './components/SupportAccessBanner'
import { useFactorPackNoticesQuery, useOrganizationQuery, useOrganizationsQuery } from './useGhg'
import type { Organization } from './api'

/*
 * The rail's sections (spec 10): Overview, then the steps of the inventory
 * workflow with their numbers, then the reference sections below a rule.
 * Settings sits apart at the foot of the navigation (spec 01.7).
 */
const sections: RailSection[] = [
  { to: '.', label: 'Overview', end: true, num: '—' },
  { to: 'entities', label: 'Legal entities', num: '01', ruleBefore: true },
  { to: 'facilities', label: 'Facilities', num: '02' },
  { to: 'activity', label: 'Activity data', num: '03' },
  { to: 'inventories', label: 'Inventories', num: '04' },
  { to: 'factors', label: 'Emission factors', ruleBefore: true },
  // spec 02.7: new editions of the packs the organization holds, and the decision on each
  { to: 'factor-updates', label: 'Updates' },
  { to: 'units', label: 'Units' },
]

const settings: RailSection = { to: 'settings', label: 'Settings', ruleBefore: true }

/** Organization workspace shell: the rail on the left around an outlet. */
export function OrganizationLayout() {
  const { organizationId = '' } = useParams()
  const session = useSession()
  const isPlatformAdmin = session.data?.role === 'ADMIN'
  const organizationQuery = useOrganizationQuery(organizationId)
  const organizationsQuery = useOrganizationsQuery()
  const noticesQuery = useFactorPackNoticesQuery(organizationId)
  const navigate = useNavigate()
  const location = useLocation()

  const organizations = organizationsQuery.data
  // spec 01.8: the name and the account number together, so two of one name read apart
  const organizationName = organizationQuery.data ? organizationLabel(organizationQuery.data) : ''
  // spec 02.7: the navigation entry carries a count of the notices still waiting on a decision
  const openNotices = (noticesQuery.data ?? []).filter((notice) => notice.status === 'OPEN').length

  // stay on the same section when switching orgs; run details belong to one org, so fall back to the runs list
  const switchOrganization = (id: string) => {
    const section = location.pathname.split('/')[4] ?? ''
    void navigate(`/app/ghg/${id}${section ? `/${section}` : ''}`)
  }

  // spec 01.4: the reader's own role, said on every page; a support grant is named as one
  const myRole = organizationQuery.data?.myRole ?? null
  const roleLine =
    myRole === null
      ? null
      : myRole === 'ADMIN'
        ? 'Support access'
        : `Your role: ${roleShortLabels[myRole]}`

  const withBadge = sections.map((section) =>
    section.to === 'factor-updates'
      ? {
          ...section,
          badge: {
            count: openNotices,
            title: `${openNotices} factor pack update${openNotices === 1 ? '' : 's'} waiting`,
            srLabel: `factor pack update${openNotices === 1 ? '' : 's'} waiting`,
          },
        }
      : section,
  )

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar
        navLabel="Organization sections"
        sections={withBadge}
        tail={[settings]}
        workspaceLabel="Workspace"
        workspace={
          <OrgSwitcher
            organizations={organizations}
            organizationId={organizationId}
            fallbackName={organizationName}
            onSwitch={switchOrganization}
          />
        }
        foot={
          <>
            <RailLink to="/help" external icon={railIcons.help}>
              Help
            </RailLink>
            <RailLink to="/app/ghg" icon={railIcons.organizations}>
              All organizations
            </RailLink>
          </>
        }
        roleLine={roleLine}
      />

      <main className="min-w-0 flex-1 px-6 py-6 md:px-10">
        {organizationQuery.isPending && (
          <div aria-label="Loading organization" className="flex flex-col gap-4">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-40" />
          </div>
        )}
        {organizationQuery.isError && (
          <Panel className="p-8 text-center">
            <h1 className="text-lg">Organization not found</h1>
            {/* spec 01.6: a grant that expired mid-session reads as the expiry
                it is, not as a deleted organization */}
            <p className="mt-1 text-sm text-ink-muted">
              {isPlatformAdmin
                ? 'You are not inside this organization. Support access ends on its own when its window expires, and a platform administrator holds no standing access without a grant.'
                : 'It may have been deleted. Head back to the list to pick another.'}
            </p>
          </Panel>
        )}
        {organizationQuery.data && (
          <>
            <SupportAccessBanner organization={organizationQuery.data} />
            <ReadOnlyBanner myRole={organizationQuery.data.myRole} />
            <Outlet />
          </>
        )}
      </main>
    </div>
  )
}

/** The rail's workspace block: the organization, with its account number, as a select of the member's organizations. */
function OrgSwitcher({
  organizations,
  organizationId,
  fallbackName,
  onSwitch,
}: {
  organizations: Organization[] | undefined
  organizationId: string
  fallbackName: string
  onSwitch: (id: string) => void
}) {
  return (
    <div className="relative">
      <label htmlFor="org-switcher" className="sr-only">
        Organization
      </label>
      <select
        id="org-switcher"
        value={organizationId}
        onChange={(event) => onSwitch(event.target.value)}
        className="w-full min-h-12 appearance-none truncate rounded-lg border border-sidebar-field-border bg-sidebar-field py-0 pr-9 pl-3 text-[15px] font-medium text-sidebar-ink transition-colors duration-150 hover:border-sidebar-accent focus:ring-2 focus:ring-focus focus:outline-none"
      >
        {organizations ? (
          organizations.map((organization) => (
            <option key={organization.id} value={organization.id} className="text-ink">
              {organizationLabel(organization)}
            </option>
          ))
        ) : (
          <option value={organizationId}>{fallbackName || '…'}</option>
        )}
      </select>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-sidebar-muted"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  )
}
