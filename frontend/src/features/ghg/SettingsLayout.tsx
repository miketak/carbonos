import { NavLink, Outlet, useParams } from 'react-router-dom'
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
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <h1 className="text-2xl">Settings</h1>
        {organization && (
          <p className="mt-1 text-sm text-ink-muted">
            {owner
              ? `${organizationLabel(organization)}: its details, who works on it, what has been done to it, and the baseline its emissions are measured against. Only an owner sees the Organization tab.`
              : `${organizationLabel(organization)}: the baseline its emissions are measured against.`}
          </p>
        )}
      </div>

      <nav
        aria-label="Settings sections"
        className="mb-6 flex gap-1 overflow-x-auto border-b border-teal/10"
      >
        {tabs.map((tab) => (
          <NavLink
            key={tab.label}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `-mb-px flex items-center border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-bright-teal focus-visible:outline-none ${
                isActive
                  ? 'border-teal-deep text-dark-teal'
                  : 'border-transparent text-ink-muted hover:border-teal/30 hover:text-dark-teal'
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
