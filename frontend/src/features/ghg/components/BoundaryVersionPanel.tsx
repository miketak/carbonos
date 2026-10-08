import { formatDateTime } from '../../../lib/dates'
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
    return <p className="mt-2 text-sm text-danger">Could not load this boundary version.</p>
  }
  const { version, entries, exclusions } = query.data
  return (
    <div className="mt-3 rounded-lg border border-hairline p-4">
      <p className="text-[13px] text-ink-muted">
        Boundary version {version.versionNo} · {approachLabels[version.consolidationApproach]} ·{' '}
        {describeFreeze(version)} · {version.entityCount}{' '}
        {version.entityCount === 1 ? 'entity' : 'entities'}, {version.facilityCount}{' '}
        {version.facilityCount === 1 ? 'facility' : 'facilities'}
        {version.reopenedAt &&
          ` · reopened ${formatDateTime(version.reopenedAt)} by ${version.reopenedBy ?? 'unknown'}: ${version.reopenReason ?? ''}`}
      </p>
      <BoundaryVersionEntries entries={entries} />
      {exclusions.length > 0 && (
        <ul className="mt-3 flex flex-col gap-0.5 text-[13px] text-ink-muted">
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
