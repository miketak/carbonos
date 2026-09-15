import { Fragment, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { AppHeader } from '../../components/AppHeader'
import { useAdminSummaryQuery } from './useSummary'

/**
 * The administration area's sections (spec 01.5). The landing stands alone;
 * the four registers an administrator acts on group together; the
 * deployment's own policy sits apart at the end.
 */
const sections = [
  { to: '.', label: 'Dashboard', end: true, icon: 'M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5' },
  {
    to: 'access-requests',
    label: 'Access requests',
    end: false,
    icon: 'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11',
  },
  {
    to: 'users',
    label: 'Users',
    end: false,
    icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  },
  {
    to: 'organizations',
    label: 'Organizations',
    end: false,
    icon: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M9 10h1M14 10h1M9 14h1M14 14h1',
  },
  {
    to: 'factor-packs',
    label: 'Factor packs',
    end: false,
    icon: 'M2 5h7a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H2zM22 5h-7a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h7z',
  },
  {
    to: 'settings',
    label: 'Platform settings',
    end: false,
    icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  },
]

const collapseKey = 'admin.sidebar'

/* dividers group the nav: Dashboard | the registers | the deployment's own policy */
const dividerAfter = new Set([0, 4])

/* the navigation entry that carries the count of requests still waiting (spec 01.5) */
const badgedSection = 'access-requests'

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

/** Administration workspace shell: full-width, collapsible left sidebar around an outlet. */
export function AdminLayout() {
  const location = useLocation()
  const summaryQuery = useAdminSummaryQuery()
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(collapseKey) === 'collapsed'
    } catch {
      return false
    }
  })

  // the badge reads the same field the dashboard's first row does, so the two can never disagree
  const pendingRequests = summaryQuery.data?.accounts.accessRequestsPending ?? 0

  const toggleCollapsed = () =>
    setCollapsed((value) => {
      try {
        localStorage.setItem(collapseKey, value ? 'expanded' : 'collapsed')
      } catch {
        // per-viewer convenience only; losing it is fine
      }
      return !value
    })

  const sectionSlug = location.pathname.split('/')[2] ?? ''
  const activeIndex = sections.findIndex(
    (section) => (section.to === '.' ? '' : section.to) === sectionSlug,
  )

  return (
    <div className="min-h-screen">
      <AppHeader>
        <span className="rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-xs font-semibold tracking-wide text-link uppercase">
          Administration
        </span>
      </AppHeader>

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
              aria-label="Administration sections"
              className="relative flex gap-1.5 overflow-x-auto md:flex-col md:overflow-x-visible md:py-1"
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
                    {section.to === badgedSection && pendingRequests > 0 && (
                      <span
                        title={`${pendingRequests} access request${pendingRequests === 1 ? '' : 's'} waiting`}
                        className={`ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-xs font-bold text-dark-teal ${
                          collapsed ? 'md:absolute md:top-1 md:right-1 md:ml-0' : ''
                        }`}
                      >
                        {pendingRequests}
                        <span className="sr-only">
                          {' '}
                          access request{pendingRequests === 1 ? '' : 's'} waiting
                        </span>
                      </span>
                    )}
                  </NavLink>
                  {dividerAfter.has(index) && (
                    <div aria-hidden="true" className="mx-3 hidden h-px bg-teal/15 md:block" />
                  )}
                </Fragment>
              ))}
            </nav>

            <div className="hidden md:mt-auto md:block md:border-t md:border-teal/10 md:pt-3">
              {/*
                Always shown, never conditional on the administrator having an
                organization (spec 01.6). The membership list is
                `/api/ghg/organizations`, which carries a facility count, and
                spec 01.5 keeps tenant inventory data out of this panel; under
                restricted creation this is also the only route to the screen
                that creates an organization.
              */}
              <Link
                to="/app/ghg"
                title={collapsed ? 'GHG accounting' : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap text-link transition-colors duration-150 hover:bg-teal/10 hover:text-link ${
                  collapsed ? 'md:justify-center md:px-2' : ''
                }`}
              >
                <Icon d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10M2 21c0-3 1.85-5.36 4.71-6.5" />
                <span className={collapsed ? 'md:hidden' : ''}>GHG accounting</span>
              </Link>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
