import { Link, useParams } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { AnimatedCo2e } from './components/AnimatedCo2e'
import { ApproachBadge } from './components/badges'
import { RunLinesTable } from './components/RunLinesTable'
import { ScopeBreakdown } from './components/ScopeBreakdown'
import { useOrganizationQuery, useRunQuery } from './useGhg'

/** One run read as the inventory report: period, totals by scope, snapshot lines. */
export function RunDetailPage() {
  const { organizationId = '', runId = '' } = useParams()
  const organization = useOrganizationQuery(organizationId).data
  const runQuery = useRunQuery(runId)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to={`/app/ghg/${organizationId}/runs`}
          className="text-sm font-medium text-teal hover:text-bright-teal"
        >
          ← All runs
        </Link>

        {runQuery.isPending && (
          <div aria-label="Loading report" className="mt-3 flex flex-col gap-4">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-40" />
          </div>
        )}
        {runQuery.isError && (
          <GlassCard className="mt-4 p-8 text-center">
            <h1 className="text-lg">Report not found</h1>
            <p className="mt-1 text-sm text-dark-teal/60">
              This run may have been deleted. Head back to the list to pick another.
            </p>
          </GlassCard>
        )}
        {runQuery.data && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl">{runQuery.data.run.label}</h1>
            <ApproachBadge approach={runQuery.data.run.consolidationApproach} />
          </div>
        )}
        {runQuery.data && (
          <p className="mt-1 text-sm text-dark-teal/60">
            {organization?.name} · {runQuery.data.run.periodStart} → {runQuery.data.run.periodEnd} ·{' '}
            {runQuery.data.run.activityCount} activit
            {runQuery.data.run.activityCount === 1 ? 'y' : 'ies'}
          </p>
        )}
      </div>

      {runQuery.data && (
        <>
          <GlassCard className="animate-fade-up p-6">
            <p className="text-sm text-dark-teal/60">Total emissions</p>
            <AnimatedCo2e
              kg={runQuery.data.run.totalKgCo2e}
              className="mt-1 block text-3xl font-bold text-dark-teal"
            />
            <div className="mt-5">
              <ScopeBreakdown run={runQuery.data.run} />
            </div>
          </GlassCard>

          <GlassCard className="animate-fade-up p-6" style={{ '--stagger': 2 } as CSSProperties}>
            <h2 className="mb-4 text-lg">Snapshot lines</h2>
            <RunLinesTable lines={runQuery.data.lines} />
          </GlassCard>
        </>
      )}
    </div>
  )
}
