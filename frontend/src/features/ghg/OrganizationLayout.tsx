import { Fragment, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { GhgHeader } from './components/GhgHeader'
import { useOrganizationQuery, useOrganizationsQuery } from './useGhg'
import type { Organization } from './api'

const sections = [
  { to: '.', label: 'Overview', end: true, icon: 'M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5' },
  {
    to: 'facilities',
    label: 'Facilities',
    end: false,
    icon: 'M4 21h16M6 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16M14 9h4a1 1 0 0 1 1 1v11M9 8h1M9 12h1M9 16h1',
  },
  { to: 'activity', label: 'Activity data', end: false, icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
  {
    to: 'inventories',
    label: 'Inventories',
    end: false,
    icon: 'm12 2-10 5 10 5 10-5-10-5M2 17l10 5 10-5M2 12l10 5 10-5',
  },
  {
    to: 'factors',
    label: 'Emission factors',
    end: false,
    icon: 'M2 5h7a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H2zM22 5h-7a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h7z',
  },
]

const collapseKey = 'ghg.sidebar'

/* dividers group the nav: Overview | the GHG flow (Boundary → Activity → Runs) | reference */
const dividerAfter = new Set([0, 3])

/* pill position: 36px rows + 6px flex gap; each divider adds 1px + one extra gap */
function pillOffset(index: number): number {
  const dividersBefore = [...dividerAfter].filter((at) => at < index).length
  return index * 42 + dividersBefore * 7
}

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

  const sectionSlug = location.pathname.split('/')[4] ?? ''
  const activeIndex = sections.findIndex(
    (section) => (section.to === '.' ? '' : section.to) === sectionSlug,
  )

  return (
    <div className="min-h-screen">
      <GhgHeader>
        <OrgSwitcher
          organizations={organizations}
          organizationId={organizationId}
          fallbackName={organizationName}
          onSwitch={switchOrganization}
        />
      </GhgHeader>

      <div className="flex flex-col md:flex-row">
        <aside
          className={`relative shrink-0 border-b border-white/50 bg-white/45 backdrop-blur-xl backdrop-saturate-150 transition-[width] duration-200 md:sticky md:top-[57px] md:h-[calc(100vh-57px)] md:border-r md:border-b-0 ${
            collapsed ? 'md:w-16' : 'md:w-64'
          }`}
        >
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="absolute top-3 -right-3 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-teal/20 bg-white text-ink-muted shadow-sm transition-colors duration-150 hover:bg-teal-deep hover:text-white md:flex"
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
            <nav
              aria-label="Organization sections"
              className="relative flex gap-1.5 overflow-x-auto md:py-1 md:flex-col md:overflow-x-visible"
            >
              {activeIndex >= 0 && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 hidden h-9 w-full rounded-lg bg-teal-deep transition-transform duration-200 ease-out md:block"
                  style={{ transform: `translateY(${pillOffset(activeIndex)}px)` }}
                />
              )}
              {sections.map((section, index) => (
                <Fragment key={section.label}>
                  <NavLink
                    to={section.to}
                    end={section.end}
                    title={collapsed ? section.label : undefined}
                    className={({ isActive }) =>
                      `relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                        isActive
                          ? 'bg-teal-deep text-white md:bg-transparent'
                          : 'text-ink-muted hover:bg-teal/10'
                      } ${collapsed ? 'md:justify-center md:px-2' : ''}`
                    }
                  >
                    <Icon d={section.icon} />
                    <span className={collapsed ? 'md:hidden' : ''}>{section.label}</span>
                  </NavLink>
                  {dividerAfter.has(index) && (
                    <div aria-hidden="true" className="mx-3 hidden h-px bg-teal/15 md:block" />
                  )}
                </Fragment>
              ))}
            </nav>

            <div className="hidden md:mt-auto md:block md:border-t md:border-teal/10 md:pt-3">
              <Link
                to="/app/ghg"
                title={collapsed ? 'All organizations' : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap text-link transition-colors duration-150 hover:bg-teal/10 hover:text-link ${
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
              <p className="mt-1 text-sm text-ink-muted">
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

/** Header pill for switching the active organization: building icon + name + chevron. */
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
    <div className="relative min-w-0">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-link"
      >
        <path d="M4 21h16M6 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16M14 9h4a1 1 0 0 1 1 1v11M9 8h1M9 12h1M9 16h1" />
      </svg>
      <label htmlFor="org-switcher" className="sr-only">
        Organization
      </label>
      <select
        id="org-switcher"
        value={organizationId}
        onChange={(event) => onSwitch(event.target.value)}
        className="w-full max-w-56 appearance-none truncate rounded-full border border-white/60 bg-white/70 py-1.5 pr-8 pl-9 text-sm font-semibold text-dark-teal shadow-[0_1px_6px_rgba(9,168,149,0.15)] transition-colors duration-150 hover:border-teal/40 hover:bg-white/90 focus:ring-2 focus:ring-teal focus:outline-none"
      >
        {organizations ? (
          organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.name}
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
        className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  )
}
