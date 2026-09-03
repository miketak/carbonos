import { useParams } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { AnimatedCo2e } from './components/AnimatedCo2e'
import { ApproachBadge } from './components/badges'
import { BoundaryVersionPanel } from './components/BoundaryVersionPanel'
import { Breadcrumb } from './components/Breadcrumb'
import { RunLinesTable } from './components/RunLinesTable'
import { ScopeBreakdown } from './components/ScopeBreakdown'
import { useInventoryQuery, useRunQuery } from './useGhg'

/** One run read as the inventory report: period, totals by scope, snapshot lines. */
export function RunDetailPage() {
  const { organizationId = '', inventoryId = '', runId = '' } = useParams()
  const inventory = useInventoryQuery(inventoryId).data
  const runQuery = useRunQuery(runId)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Breadcrumb
          items={[
            { label: 'Inventories', to: `/app/ghg/${organizationId}/inventories` },
            {
              label: inventory?.name ?? 'Inventory',
              to: `/app/ghg/${organizationId}/inventories/${inventoryId}`,
            },
            { label: runQuery.data?.run.label ?? 'Run' },
          ]}
        />

        {runQuery.isPending && (
          <div aria-label="Loading report" className="mt-3 flex flex-col gap-4">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-40" />
          </div>
        )}
        {runQuery.isError && (
          <GlassCard className="mt-4 p-8 text-center">
            <h1 className="text-lg">Report not found</h1>
            <p className="mt-1 text-sm text-ink-muted">
              This run may have been deleted. Head back to the inventory to pick another.
            </p>
          </GlassCard>
        )}
        {runQuery.data && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl">{runQuery.data.run.label}</h1>
            <ApproachBadge approach={runQuery.data.run.consolidationApproach} />
            {runQuery.data.run.isFinal && (
              <span className="rounded-full bg-accent-green/25 px-2.5 py-0.5 text-xs font-bold text-dark-teal">
                FINAL
              </span>
            )}
          </div>
        )}
        {runQuery.data && (
          <p className="mt-1 text-sm text-ink-muted">
            {inventory?.name} · {runQuery.data.run.periodStart} → {runQuery.data.run.periodEnd} ·{' '}
            {runQuery.data.run.activityCount} line
            {runQuery.data.run.activityCount === 1 ? '' : 's'}
          </p>
        )}
      </div>

      {runQuery.data && (
        <>
          <GlassCard className="animate-fade-up p-6">
            <p className="text-sm text-ink-muted">Total emissions</p>
            <AnimatedCo2e
              kg={runQuery.data.run.totalKgCo2e}
              className="mt-1 block text-3xl font-bold text-dark-teal"
            />
            <div className="mt-5">
              <ScopeBreakdown run={runQuery.data.run} />
            </div>
          </GlassCard>

          <GlassCard className="animate-fade-up p-6" style={{ '--stagger': 2 } as CSSProperties}>
            {runQuery.data.run.boundaryVersionId ? (
              <>
                <h2 className="text-lg">Boundary version {runQuery.data.run.boundaryVersionNo}</h2>
                <p className="text-sm text-ink-muted">
                  The organizational boundary this run computed its accounting shares from, exactly
                  as it stood when frozen (spec 03).
                </p>
                <BoundaryVersionPanel versionId={runQuery.data.run.boundaryVersionId} />
              </>
            ) : (
              <>
                <h2 className="text-lg">Boundary version</h2>
                <p className="text-sm text-ink-muted">
                  This run predates boundary versioning and cites no boundary version. Each of its
                  lines still records the accounting share it used.
                </p>
              </>
            )}
          </GlassCard>

          <GlassCard className="animate-fade-up p-6" style={{ '--stagger': 3 } as CSSProperties}>
            <h2 className="mb-4 text-lg">Snapshot lines</h2>
            <RunLinesTable lines={runQuery.data.lines} />
          </GlassCard>
        </>
      )}
    </div>
  )
}
