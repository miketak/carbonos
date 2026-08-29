import { Link, useParams } from 'react-router-dom'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { ApproachBadge } from './components/badges'
import { ScopeBreakdown } from './components/ScopeBreakdown'
import { formatCo2e } from './format'
import {
  useActivitiesQuery,
  useFacilitiesQuery,
  useOrganizationQuery,
  useRunsQuery,
} from './useGhg'
import type { Run } from './api'

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
        <SetupChecklist facilityCount={facilities.length} activityCount={activities.length} />
      ) : (
        <Dashboard
          facilityCount={facilities.length}
          activityCount={activities.length}
          runs={runs}
        />
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
  facilityCount,
  activityCount,
  runs,
}: {
  facilityCount: number
  activityCount: number
  runs: Run[]
}) {
  const latest = [...runs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Latest inventory" value={formatCo2e(latest.totalKgCo2e)} />
        <StatTile
          label="Facilities in boundary"
          value={facilityCount.toLocaleString()}
          to="boundary"
        />
        <StatTile label="Activity records" value={activityCount.toLocaleString()} to="activity" />
      </div>

      <GlassCard className="p-6">
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
    </>
  )
}

function StatTile({ label, value, to }: { label: string; value: string; to?: string }) {
  const body = (
    <>
      <p className="text-sm text-dark-teal/60">{label}</p>
      <p className="mt-1 text-xl font-bold text-dark-teal">{value}</p>
    </>
  )
  return to ? (
    <Link to={to}>
      <GlassCard className="p-5 transition-colors duration-150 hover:bg-white/80">{body}</GlassCard>
    </Link>
  ) : (
    <GlassCard className="p-5">{body}</GlassCard>
  )
}
