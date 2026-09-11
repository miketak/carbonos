import { GlassCard } from '../../../components/GlassCard'
import { ProgressBar } from '../../../components/ProgressBar'
import type { ActivityCounts } from '../api'

/**
 * How far the records that match the current view are from review (spec
 * 04.6): completeness, never assurance. "Resolve n items" is the Needs
 * attention tab.
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
  const allReady = counts.needsAttention === 0
  return (
    <GlassCard className="mb-3 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
            allReady ? 'bg-accent-green/40 text-dark-teal' : 'bg-teal/15 text-teal-deep'
          }`}
        >
          {allReady ? '✓' : '◐'}
        </span>
        <div>
          <p className="text-sm font-semibold">
            {counts.ready.toLocaleString()} of {counts.total.toLocaleString()} records ready
            {counts.readyWithDocument > 0 && (
              <span className="font-normal text-ink-muted">
                , {counts.readyWithDocument.toLocaleString()} with a document on file
              </span>
            )}
          </p>
          <p className="text-xs text-ink-muted">Complete records make review easier.</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span>Record completeness</span>
          <ProgressBar label="Record completeness" percent={percent} />
        </div>
        {!allReady && (
          <button
            type="button"
            onClick={onResolve}
            className="text-sm font-semibold text-link hover:underline"
          >
            Resolve {counts.needsAttention.toLocaleString()}{' '}
            {counts.needsAttention === 1 ? 'item' : 'items'} →
          </button>
        )}
      </div>
    </GlassCard>
  )
}
