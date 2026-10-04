import { Panel, PanelBody, PanelHead } from '../../../components/Panel'
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
    <Panel>
      <PanelHead title="Top facilities by emissions" description="From the latest run." />
      <PanelBody className="flex flex-col gap-2.5">
        {runQuery.isPending && (
          <div aria-label="Loading facility emissions">
            <Skeleton className="h-16" />
          </div>
        )}
        {runQuery.data && ranked.length === 0 && (
          <p className="text-sm text-ink-muted">No facility emissions in the latest run.</p>
        )}
        {ranked.map(([name, kg]) => (
          <div
            key={name}
            className="grid grid-cols-[110px_minmax(0,1fr)_120px] items-center gap-3 text-sm"
          >
            <span className="truncate" title={name}>
              {name}
            </span>
            <div className="h-2 overflow-hidden rounded-sm bg-surface-sunken">
              <div
                className="animate-bar-grow h-full bg-primary"
                style={{ width: max > 0 ? `${Math.max((kg / max) * 100, 2)}%` : '0%' }}
              />
            </div>
            <span className="text-right whitespace-nowrap">{formatCo2e(kg)}</span>
          </div>
        ))}
      </PanelBody>
    </Panel>
  )
}
