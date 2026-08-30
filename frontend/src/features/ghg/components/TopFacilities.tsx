import { GlassCard } from '../../../components/GlassCard'
import { Skeleton } from '../../../components/Skeleton'
import { formatCo2e } from '../format'
import { useRunQuery } from '../useGhg'

/** Facilities ranked by their share of the latest run's emissions. */
export function TopFacilities({ runId }: { runId: string }) {
  const runQuery = useRunQuery(runId)

  const totals = new Map<string, number>()
  for (const line of runQuery.data?.lines ?? []) {
    totals.set(line.facilityName, (totals.get(line.facilityName) ?? 0) + line.kgCo2e)
  }
  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  const max = ranked[0]?.[1] ?? 0

  return (
    <GlassCard className="p-6">
      <h2 className="text-lg">Top facilities by emissions</h2>
      <p className="text-sm text-ink-muted">From the latest run.</p>

      {runQuery.isPending && (
        <div aria-label="Loading facility emissions" className="mt-4">
          <Skeleton className="h-16" />
        </div>
      )}
      {runQuery.data && ranked.length === 0 && (
        <p className="mt-4 text-sm text-ink-muted">No facility emissions in the latest run.</p>
      )}
      {ranked.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {ranked.map(([name, kg]) => (
            <div key={name} className="flex items-center gap-3 text-sm">
              <span className="w-32 shrink-0 truncate text-ink-muted" title={name}>
                {name}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-teal/10">
                <div
                  className="animate-bar-grow h-full rounded-full bg-teal-deep"
                  style={{ width: max > 0 ? `${Math.max((kg / max) * 100, 2)}%` : '0%' }}
                />
              </div>
              <span className="w-28 shrink-0 text-right whitespace-nowrap text-ink-muted">
                {formatCo2e(kg)}
              </span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  )
}
