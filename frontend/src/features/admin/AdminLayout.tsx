import { Outlet } from 'react-router-dom'
import { RailLink, Sidebar, railIcons } from '../../components/Sidebar'
import type { RailSection } from '../../components/Sidebar'
import { useAdminSummaryQuery } from './useSummary'

/**
 * The administration area's sections (specs 01.5, 09, 10). The landing stands
 * alone with a dash; the registers an administrator acts on are numbered in
 * order; the deployment's own policy sits apart at the end.
 */
const sections: RailSection[] = [
  { to: '.', label: 'Dashboard', end: true, num: '—' },
  { to: 'access-requests', label: 'Access requests', num: '01', ruleBefore: true },
  { to: 'users', label: 'Users', num: '02' },
  { to: 'organizations', label: 'Organizations', num: '03' },
  { to: 'factor-packs', label: 'Factor packs', num: '04' },
  { to: 'help', label: 'Help metrics', num: '05' },
  { to: 'settings', label: 'Platform settings', num: '06', ruleBefore: true },
]

/** Administration workspace shell: the rail on the left around an outlet. */
export function AdminLayout() {
  const summaryQuery = useAdminSummaryQuery()

  // the badge reads the same field the dashboard's first row does, so the two can never disagree
  const pendingRequests = summaryQuery.data?.accounts.accessRequestsPending ?? 0
  const withBadge = sections.map((section) =>
    section.to === 'access-requests'
      ? {
          ...section,
          badge: {
            count: pendingRequests,
            title: `${pendingRequests} access request${pendingRequests === 1 ? '' : 's'} waiting`,
            srLabel: `access request${pendingRequests === 1 ? '' : 's'} waiting`,
          },
        }
      : section,
  )

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar
        navLabel="Administration sections"
        sections={withBadge}
        workspaceLabel="Area"
        workspace={
          <div className="flex min-h-12 items-center justify-between gap-2 rounded-lg border border-sidebar-field-border bg-sidebar-field px-3">
            <span className="text-[15px] font-medium">Administration</span>
            <span className="text-xs font-semibold tracking-[0.08em] text-sidebar-muted uppercase">
              Admin
            </span>
          </div>
        }
        foot={
          <>
            {/*
              Always shown, never conditional on the administrator having an
              organization (spec 01.6). The membership list is
              `/api/ghg/organizations`, which carries a facility count, and
              spec 01.5 keeps tenant inventory data out of this panel; under
              restricted creation this is also the only route to the screen
              that creates an organization.
            */}
            <RailLink to="/app/ghg" icon={railIcons.ghg}>
              GHG accounting
            </RailLink>
            <RailLink to="/help" external icon={railIcons.help}>
              Help
            </RailLink>
          </>
        }
      />

      <main className="min-w-0 flex-1 px-6 py-6 md:px-10">
        <Outlet />
      </main>
    </div>
  )
}
