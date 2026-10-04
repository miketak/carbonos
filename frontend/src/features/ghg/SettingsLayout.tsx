import { NavLink, Outlet, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { organizationLabel } from '../../lib/organizationLabel'
import { mayManageMembership } from './roles'
import { useOrganizationQuery } from './useGhg'

/**
 * The organization's settings (spec 01.7): a tab per area, each at its own
 * address. Organization (details, members, history, deletion) stays the owner's
 * by membership; Baseline and targets is every member's, and its own page
 * decides who may change what (spec 06).
 */
export function SettingsLayout() {
  const { organizationId = '' } = useParams()
  const organization = useOrganizationQuery(organizationId).data
  const owner = organization !== undefined && mayManageMembership(organization.myRole)

  const tabs = [
    ...(owner ? [{ to: '.', label: 'Organization', end: true }] : []),
    { to: 'baseline', label: 'Baseline and targets', end: false },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ to: `/app/ghg/${organizationId}` }}
        title="Settings"
        subtitle={
          organization &&
          (owner
            ? `${organizationLabel(organization)}: its details, who works on it, what has been done to it, and the baseline its emissions are measured against. Only an owner sees the Organization tab.`
            : `${organizationLabel(organization)}: the baseline its emissions are measured against.`)
        }
      />

      {/* the kit's tab styling on NavLinks: each tab is an address of its own (spec 01.7) */}
      <nav
        aria-label="Settings sections"
        className="flex gap-1 overflow-x-auto border-b border-hairline"
      >
        {tabs.map((tab) => (
          <NavLink
            key={tab.label}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `-mb-px flex min-h-11 items-center gap-2 border-b-2 px-3 text-[15px] font-medium whitespace-nowrap transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none ${
                isActive
                  ? 'border-primary text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  )
}
