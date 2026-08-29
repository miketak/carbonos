import { Link, useParams } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { AnimatedCo2e } from './components/AnimatedCo2e'
import { ApproachBadge, ScopeBadge } from './components/badges'
import { CoverageMatrix } from './components/CoverageMatrix'
import { ScopeBreakdown } from './components/ScopeBreakdown'
import { TopFacilities } from './components/TopFacilities'
import {
  useActivitiesQuery,
  useFacilitiesQuery,
  useOrganizationQuery,
  useRunsQuery,
} from './useGhg'
import type { Activity, Facility, Run } from './api'

/** Workspace landing page: a setup checklist until the first run, then a dashboard. */
export function OverviewPage() {
  const { organizationId = '' } = useParams()
  const organization = useOrganizationQuery(organizationId).data
  const facilitiesQuery = useFacilitiesQuery(organizationId)
  const activitiesQuery = useActivitiesQuery(organizationId)
  const runsQuery = useRunsQuery(organizationId)

  if (facilitiesQuery.isPending || activitiesQuery.isPending || runsQuery.isPending) {
    return (
      <div aria-label="Loading overview" className="flex flex-col gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  const facilities = facilitiesQuery.data ?? []
  const activities = activitiesQuery.data ?? []
  const runs = runsQuery.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl">{organization?.name}</h1>
        {organization && <ApproachBadge approach={organization.consolidationApproach} />}
      </div>

      {runs.length === 0 ? (
        <>
          <div className="animate-fade-up">
            <SetupChecklist facilityCount={facilities.length} activityCount={activities.length} />
          </div>
          <div className="animate-fade-up" style={{ '--stagger': 2 } as CSSProperties}>
            <CoverageMatrix facilities={facilities} activities={activities} />
          </div>
        </>
      ) : (
        <Dashboard facilities={facilities} activities={activities} runs={runs} />
      )}
    </div>
  )
}

function SetupChecklist({
  facilityCount,
  activityCount,
}: {
  facilityCount: number
  activityCount: number
}) {
  const steps = [
    {
      title: 'Define your boundary',
      detail: 'Add the facilities this organization reports on.',
      done: facilityCount > 0,
      to: 'boundary',
      cta: 'Add facilities',
    },
    {
      title: 'Record activity data',
      detail: 'Fuel burned, electricity bought, kilometres travelled — per facility.',
      done: activityCount > 0,
      to: 'activity',
      cta: 'Record activity',
    },
    {
      title: 'Run the inventory',
      detail: 'Roll the activity data up to CO₂e by scope over a reporting period.',
      done: false,
      to: 'runs',
      cta: 'Run inventory',
    },
  ]
  const nextIndex = steps.findIndex((step) => !step.done)

  return (
    <GlassCard className="p-6">
      <h2 className="text-lg">Get to your first inventory</h2>
      <p className="mt-1 text-sm text-dark-teal/60">
        Three steps from an empty organization to a calculated GHG inventory.
      </p>
      <ol className="mt-5 flex flex-col gap-4">
        {steps.map((step, index) => (
          <li key={step.title} className="flex items-start gap-4">
            <span
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                step.done ? 'bg-accent-green/25 text-dark-teal' : 'bg-teal/10 text-dark-teal/70'
              }`}
            >
              {step.done ? '✓' : index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{step.title}</p>
              <p className="text-sm text-dark-teal/60">{step.detail}</p>
            </div>
            {index === nextIndex && (
              <Link
                to={step.to}
                className="shrink-0 rounded-lg bg-teal px-4 py-1.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-bright-teal"
              >
                {step.cta}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </GlassCard>
  )
}

function Dashboard({
  facilities,
  activities,
  runs,
}: {
  facilities: Facility[]
  activities: Activity[]
  runs: Run[]
}) {
  const latest = [...runs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  const kpis = [
    { label: 'Total emissions', kg: latest.totalKgCo2e, accent: 'border-l-bright-teal' },
    { label: 'Scope 1 — Direct', kg: latest.scope1KgCo2e, accent: 'border-l-dark-teal' },
    { label: 'Scope 2 — Energy', kg: latest.scope2KgCo2e, accent: 'border-l-teal' },
    { label: 'Scope 3 — Indirect', kg: latest.scope3KgCo2e, accent: 'border-l-accent-green' },
  ]

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, index) => (
          <GlassCard
            key={kpi.label}
            className={`animate-fade-up border-l-4 p-5 ${kpi.accent}`}
            style={{ '--stagger': index } as CSSProperties}
          >
            <p className="text-sm text-dark-teal/60">{kpi.label}</p>
            <AnimatedCo2e kg={kpi.kg} className="mt-1 block text-xl font-bold text-dark-teal" />
          </GlassCard>
        ))}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <GlassCard className="animate-fade-up p-6" style={{ '--stagger': 4 } as CSSProperties}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg">{latest.label}</h2>
              <p className="text-sm text-dark-teal/60">
                {latest.periodStart} → {latest.periodEnd} · {latest.activityCount} activit
                {latest.activityCount === 1 ? 'y' : 'ies'}
              </p>
            </div>
            <Link
              to={`runs/${latest.id}`}
              className="text-sm font-semibold text-teal hover:text-bright-teal"
            >
              View report →
            </Link>
          </div>
          <div className="mt-4">
            <ScopeBreakdown run={latest} />
          </div>
        </GlassCard>

        <div className="animate-fade-up" style={{ '--stagger': 5 } as CSSProperties}>
          <TopFacilities runId={latest.id} />
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <div className="animate-fade-up" style={{ '--stagger': 6 } as CSSProperties}>
          <CoverageMatrix facilities={facilities} activities={activities} />
        </div>
        <div className="animate-fade-up" style={{ '--stagger': 7 } as CSSProperties}>
          <RecentActivity activities={activities} />
        </div>
      </div>
    </>
  )
}

function RecentActivity({ activities }: { activities: Activity[] }) {
  const recent = [...activities]
    .sort((a, b) => b.activityDate.localeCompare(a.activityDate))
    .slice(0, 5)

  return (
    <GlassCard className="p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg">Recent activity data</h2>
        <Link to="activity" className="text-sm font-semibold text-teal hover:text-bright-teal">
          View all →
        </Link>
      </div>
      {recent.length === 0 && (
        <p className="text-sm text-dark-teal/60">No activity recorded yet.</p>
      )}
      <ul className="flex flex-col gap-3">
        {recent.map((activity) => (
          <li key={activity.id} className="flex items-center justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium">{activity.factorName}</p>
              <p className="truncate text-xs text-dark-teal/60">
                {activity.facilityName} · {activity.quantity.toLocaleString()} {activity.unit}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <ScopeBadge scope={activity.scope} />
              <span className="text-xs whitespace-nowrap text-dark-teal/60">
                {activity.activityDate}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </GlassCard>
  )
}
