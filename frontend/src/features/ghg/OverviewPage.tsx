import { Link, useParams } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { AnimatedCo2e } from './components/AnimatedCo2e'
import { ApproachBadge } from './components/badges'
import { ScopeBreakdown } from './components/ScopeBreakdown'
import { TopFacilities } from './components/TopFacilities'
import {
  useActivitiesQuery,
  useFacilitiesQuery,
  useInventoriesQuery,
  useOrganizationQuery,
  useRunsQuery,
} from './useGhg'
import type { Inventory } from './api'

/** Workspace landing page: a setup checklist until the first inventory, then a dashboard. */
export function OverviewPage() {
  const { organizationId = '' } = useParams()
  const organization = useOrganizationQuery(organizationId).data
  const facilitiesQuery = useFacilitiesQuery(organizationId)
  const activitiesQuery = useActivitiesQuery(organizationId)
  const inventoriesQuery = useInventoriesQuery(organizationId)

  if (facilitiesQuery.isPending || activitiesQuery.isPending || inventoriesQuery.isPending) {
    return (
      <div aria-label="Loading overview" className="flex flex-col gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  const facilities = facilitiesQuery.data ?? []
  const activities = activitiesQuery.data ?? []
  const inventories = inventoriesQuery.data ?? []
  // the headline inventory: prefer one with a designated final run, else the newest
  const headline = inventories.find((inventory) => inventory.finalRunId) ?? inventories[0]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">{organization?.name}</h1>

      <div className="animate-fade-up">
        <SetupChecklist
          facilityCount={facilities.length}
          activityCount={activities.length}
          inventories={inventories}
        />
      </div>

      {headline && (
        <div className="animate-fade-up" style={{ '--stagger': 2 } as CSSProperties}>
          <HeadlineInventory inventory={headline} />
        </div>
      )}
    </div>
  )
}

function SetupChecklist({
  facilityCount,
  activityCount,
  inventories,
}: {
  facilityCount: number
  activityCount: number
  inventories: Inventory[]
}) {
  const steps = [
    {
      title: 'Add your facilities',
      detail: 'The sites where things happen — organizational facts, shared by every view.',
      done: facilityCount > 0,
      to: 'facilities',
      cta: 'Add facilities',
    },
    {
      title: 'Record activity data',
      detail: 'What happened: fuel burned, electricity bought — no accounting treatment yet.',
      done: activityCount > 0,
      to: 'activity',
      cta: 'Record activity',
    },
    {
      title: 'Create an inventory',
      detail: 'An accounting view: reporting period, consolidation approach, boundary.',
      done: inventories.length > 0,
      to: 'inventories',
      cta: 'Create inventory',
    },
    {
      title: 'Clear pre-flight and launch a run',
      detail: 'Review the facts, classify them, pass the gates, calculate.',
      done: inventories.some((inventory) => inventory.finalRunId !== null),
      to: inventories[0] ? `inventories/${inventories[0].id}` : 'inventories',
      cta: 'Open inventory',
    },
  ]
  const nextIndex = steps.findIndex((step) => !step.done)
  if (nextIndex === -1) {
    return null
  }

  return (
    <GlassCard className="p-6">
      <h2 className="text-lg">From facts to a final inventory</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Activity data is what happened; an inventory is how it's accounted for; a run is that view
        calculated.
      </p>
      <ol className="mt-5 flex flex-col gap-4">
        {steps.map((step, index) => (
          <li key={step.title} className="flex items-start gap-4">
            <span
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                step.done ? 'bg-accent-green/25 text-dark-teal' : 'bg-teal/10 text-ink-muted'
              }`}
            >
              {step.done ? '✓' : index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{step.title}</p>
              <p className="text-sm text-ink-muted">{step.detail}</p>
            </div>
            {index === nextIndex && (
              <Link
                to={step.to}
                className="shrink-0 rounded-lg bg-teal-deep px-4 py-1.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-dark-teal"
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

/** The organization's headline numbers: the latest run of its leading inventory. */
function HeadlineInventory({ inventory }: { inventory: Inventory }) {
  const runsQuery = useRunsQuery(inventory.id)
  const runs = runsQuery.data ?? []
  const run = runs.find((candidate) => candidate.id === inventory.finalRunId) ?? runs[0]

  if (runsQuery.isPending) {
    return <Skeleton className="h-40" />
  }
  if (!run) {
    return null
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <GlassCard className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg">{inventory.name}</h2>
              <ApproachBadge approach={inventory.consolidationApproach} />
              {run.isFinal && (
                <span className="rounded-full bg-accent-green/25 px-2 py-0.5 text-xs font-bold text-dark-teal">
                  FINAL
                </span>
              )}
            </div>
            <p className="text-sm text-ink-muted">
              {run.label} · {run.periodStart} → {run.periodEnd}
            </p>
          </div>
          <Link
            to={`inventories/${inventory.id}/runs/${run.id}`}
            className="text-sm font-semibold text-link hover:text-link"
          >
            View report →
          </Link>
        </div>
        <AnimatedCo2e
          kg={run.totalKgCo2e}
          className="mt-3 block text-3xl font-bold text-dark-teal"
        />
        <div className="mt-4">
          <ScopeBreakdown run={run} />
        </div>
      </GlassCard>

      <TopFacilities runId={run.id} />
    </div>
  )
}
