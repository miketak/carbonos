import { Skeleton } from '../../../components/Skeleton'
import { approachLabels, describeFreeze } from '../format'
import { useBoundaryVersionQuery } from '../useGhg'
import { BoundaryVersionEntries } from './BoundaryVersionEntries'

/** One boundary version in full, loaded on demand: who froze it, when, and every facility it held. */
export function BoundaryVersionPanel({ versionId }: { versionId: string }) {
  const query = useBoundaryVersionQuery(versionId)

  if (query.isPending) {
    return (
      <div aria-label="Loading boundary version" className="mt-2">
        <Skeleton className="h-16" />
      </div>
    )
  }
  if (query.isError) {
    return <p className="mt-2 text-sm text-red-600">Could not load this boundary version.</p>
  }
  const { version, entries } = query.data
  return (
    <div className="mt-2 rounded-xl border border-teal/10 bg-white/40 p-3">
      <p className="text-xs text-ink-muted">
        Version {version.versionNo} · {approachLabels[version.consolidationApproach]} ·{' '}
        {describeFreeze(version)}
      </p>
      <BoundaryVersionEntries entries={entries} />
    </div>
  )
}
