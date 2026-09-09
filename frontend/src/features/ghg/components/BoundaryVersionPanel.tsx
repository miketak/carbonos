import { Skeleton } from '../../../components/Skeleton'
import { approachLabels, describeFreeze, exclusionLabels } from '../format'
import { useBoundaryVersionQuery } from '../useGhg'
import { BoundaryVersionEntries } from './BoundaryVersionEntries'

/** One boundary version in full, loaded on demand: who froze it, when, and every entity it held. */
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
  const { version, entries, exclusions } = query.data
  return (
    <div className="mt-2 rounded-xl border border-teal/10 bg-white/40 p-3">
      <p className="text-xs text-ink-muted">
        Version {version.versionNo} · {approachLabels[version.consolidationApproach]} ·{' '}
        {describeFreeze(version)} · {version.entityCount}{' '}
        {version.entityCount === 1 ? 'entity' : 'entities'}, {version.facilityCount}{' '}
        {version.facilityCount === 1 ? 'facility' : 'facilities'}
      </p>
      <BoundaryVersionEntries entries={entries} />
      {exclusions.length > 0 && (
        <ul className="mt-2 flex flex-col gap-0.5 text-xs text-ink-muted">
          {exclusions.map((exclusion) => (
            <li key={`${exclusion.entityId}:${exclusion.facilityId ?? 'entity'}`}>
              Left out: {exclusion.facilityName ?? `${exclusion.entityName} (whole entity)`} ·{' '}
              {exclusionLabels[exclusion.reason]}
              {exclusion.detail ? ` · ${exclusion.detail}` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
