import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { GhgHeader } from './components/GhgHeader'
import { useOrganizationQuery, useOrganizationsQuery } from './useGhg'

const sections = [
  { to: '.', label: 'Overview', end: true, icon: 'M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5' },
  {
    to: 'boundary',
    label: 'Boundary',
    end: false,
    icon: 'M4 21h16M6 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16M14 9h4a1 1 0 0 1 1 1v11M9 8h1M9 12h1M9 16h1',
  },
  { to: 'activity', label: 'Activity data', end: false, icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
  { to: 'runs', label: 'Runs', end: false, icon: 'M3 21h18M7 21v-8M12 21V7M17 21v-5' },
  {
    to: 'factors',
    label: 'Emission factors',
    end: false,
    icon: 'M2 5h7a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H2zM22 5h-7a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h7z',
  },
]

const collapseKey = 'ghg.sidebar'

function Icon({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
    >
      <path d={d} />
    </svg>
  )
}

/** Organization workspace shell: full-width, collapsible left sidebar around an outlet. */
export function OrganizationLayout() {
  const { organizationId = '' } = useParams()
  const organizationQuery = useOrganizationQuery(organizationId)
  const organizationsQuery = useOrganizationsQuery()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(collapseKey) === 'collapsed'
    } catch {
      return false
    }
  })

  const organizations = organizationsQuery.data
  const organizationName = organizationQuery.data?.name ?? ''
  const initials = organizationName
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')

  const toggleCollapsed = () =>
    setCollapsed((value) => {
      try {
        localStorage.setItem(collapseKey, value ? 'expanded' : 'collapsed')
      } catch {
        // per-viewer convenience only; losing it is fine
      }
      return !value
    })

  // stay on the same section when switching orgs; run details belong to one org, so fall back to the runs list
  const switchOrganization = (id: string) => {
    const section = location.pathname.split('/')[4] ?? ''
    void navigate(`/app/ghg/${id}${section ? `/${section}` : ''}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-mint via-soft-mint to-bright-teal/15">
      <GhgHeader />

      <div className="flex flex-col md:flex-row">
        <aside
          className={`relative shrink-0 border-b border-white/50 bg-white/45 backdrop-blur-xl transition-[width] duration-200 md:sticky md:top-[57px] md:h-[calc(100vh-57px)] md:border-r md:border-b-0 ${
            collapsed ? 'md:w-16' : 'md:w-64'
          }`}
        >
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="absolute top-3 -right-3 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-teal/20 bg-white text-dark-teal/70 shadow-sm transition-colors duration-150 hover:bg-teal hover:text-white md:flex"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="h-3.5 w-3.5"
            >
              <path d={collapsed ? 'm9 18 6-6-6-6' : 'm15 18-6-6 6-6'} />
            </svg>
          </button>
          <div className="flex items-center gap-2 p-3 md:h-full md:flex-col md:items-stretch md:overflow-y-auto">
            {collapsed ? (
              <button
                type="button"
                onClick={toggleCollapsed}
                title={`${organizationName} — expand sidebar`}
                className="mx-auto hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal text-xs font-bold text-white transition-colors duration-150 hover:bg-bright-teal md:flex"
              >
                {initials || '…'}
              </button>
            ) : null}
            <div className={`min-w-40 flex-none md:min-w-0 ${collapsed ? 'md:hidden' : ''}`}>
              <label htmlFor="org-switcher" className="sr-only">
                Organization
              </label>
              <select
                id="org-switcher"
                value={organizationId}
                onChange={(event) => switchOrganization(event.target.value)}
                className="w-full rounded-lg border border-teal/20 bg-white/70 px-3 py-2 text-sm font-semibold text-dark-teal focus:ring-2 focus:ring-teal focus:outline-none"
              >
                {organizations ? (
                  organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))
                ) : (
                  <option value={organizationId}>{organizationName || '…'}</option>
                )}
              </select>
            </div>

            <nav
              aria-label="Organization sections"
              className="flex gap-1 overflow-x-auto md:mt-3 md:flex-col md:overflow-x-visible"
            >
              {sections.map((section) => (
                <NavLink
                  key={section.label}
                  to={section.to}
                  end={section.end}
                  title={collapsed ? section.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                      isActive ? 'bg-teal text-white' : 'text-dark-teal/80 hover:bg-teal/10'
                    } ${collapsed ? 'md:justify-center md:px-2' : ''}`
                  }
                >
                  <Icon d={section.icon} />
                  <span className={collapsed ? 'md:hidden' : ''}>{section.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="hidden md:mt-auto md:block md:border-t md:border-teal/10 md:pt-3">
              <Link
                to="/app/ghg"
                title={collapsed ? 'All organizations' : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap text-teal transition-colors duration-150 hover:bg-teal/10 hover:text-bright-teal ${
                  collapsed ? 'md:justify-center md:px-2' : ''
                }`}
              >
                <Icon d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
                <span className={collapsed ? 'md:hidden' : ''}>All organizations</span>
              </Link>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-6 py-8">
          {organizationQuery.isPending && (
            <div aria-label="Loading organization" className="flex flex-col gap-4">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-40" />
            </div>
          )}
          {organizationQuery.isError && (
            <GlassCard className="p-8 text-center">
              <h1 className="text-lg">Organization not found</h1>
              <p className="mt-1 text-sm text-dark-teal/60">
                It may have been deleted. Head back to the list to pick another.
              </p>
            </GlassCard>
          )}
          {organizationQuery.data && <Outlet />}
        </main>
      </div>
    </div>
  )
}
