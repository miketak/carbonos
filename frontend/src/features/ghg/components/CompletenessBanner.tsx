import { ProgressBar } from '../../../components/ProgressBar'
import { Stat, StatStrip } from '../../../components/StatStrip'
import type { ActivityCounts } from '../api'

/**
 * How far the records that match the current view are from review (spec
 * 04.6): completeness, never assurance. A stat strip (spec 10); "Resolve n
 * items" is the Needs attention tab.
 */
export function CompletenessBanner({
  counts,
  onResolve,
}: {
  counts: ActivityCounts
  onResolve: () => void
}) {
  if (counts.total === 0) return null
  const percent = (counts.ready / counts.total) * 100
  return (
    <StatStrip label="Record completeness">
      <Stat
        label="Records ready"
        value={counts.ready.toLocaleString()}
        unit={`of ${counts.total.toLocaleString()}`}
        note={
          <span className="flex flex-col gap-1.5">
            <span className="flex items-center gap-2">
              <span>Record completeness</span>
              <ProgressBar label="Record completeness" percent={percent} />
            </span>
            <span>
              Complete records make review easier. Ready means the figures, an emission source, a
              data source and evidence are present; nothing here has been verified.
            </span>
          </span>
        }
      />
      <Stat
        label="With a document on file"
        value={counts.readyWithDocument.toLocaleString()}
        note="Files print on the run's lines and in the calculation file."
      />
      <Stat
        label="Needs attention"
        value={counts.needsAttention.toLocaleString()}
        note={
          counts.needsAttention > 0 ? (
            <button
              type="button"
              onClick={onResolve}
              className="font-medium text-link hover:underline"
            >
              Resolve {counts.needsAttention.toLocaleString()}{' '}
              {counts.needsAttention === 1 ? 'item' : 'items'} →
            </button>
          ) : undefined
        }
      />
    </StatStrip>
  )
}
