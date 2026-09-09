import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import { Skeleton } from '../../../components/Skeleton'
import { useActivityRevisionsQuery } from '../useGhg'
import type { Activity } from '../api'

const fieldLabels: Record<string, string> = {
  facility: 'Facility',
  stream: 'Stream',
  activityType: 'Activity',
  quantity: 'Quantity',
  unit: 'Unit',
  periodStart: 'Period start',
  periodEnd: 'Period end',
  dataSource: 'Data source',
  evidenceRef: 'Evidence ref',
  dataQuality: 'Data quality',
  dataQualityTier: 'Quality tier',
  uncertaintyPercent: 'Uncertainty %',
  note: 'Note',
}

/** A record's value history (spec 04.4): each correction with who, when, why, old and new. */
export function ActivityHistoryModal({
  activity,
  onClose,
}: {
  activity: Activity
  onClose: () => void
}) {
  const revisionsQuery = useActivityRevisionsQuery(activity.id)
  return (
    <Modal title={`History of ${activity.activityType}`} onClose={onClose}>
      {revisionsQuery.isPending && <Skeleton className="h-16" />}
      {revisionsQuery.data && revisionsQuery.data.length === 0 && (
        <p className="text-sm text-ink-muted">
          Never corrected: the record reads as first entered.
        </p>
      )}
      {revisionsQuery.data && revisionsQuery.data.length > 0 && (
        <ul className="flex flex-col gap-3 text-sm">
          {revisionsQuery.data.map((revision) => (
            <li key={revision.id} className="border-b border-teal/10 pb-3 last:border-0">
              <p>
                <span className="font-semibold">
                  {revision.kind === 'REMOVED' ? 'Removed' : 'Corrected'}
                </span>
                <span className="text-ink-muted">
                  {' '}
                  by {revision.changedBy}, {new Date(revision.changedAt).toLocaleString()}
                </span>
              </p>
              <p className="text-ink-muted">{revision.reason}</p>
              {revision.changes.length > 0 && (
                <ul className="mt-1 flex flex-col gap-0.5 text-xs">
                  {revision.changes.map((change) => (
                    <li key={change.field}>
                      <span className="font-medium">
                        {fieldLabels[change.field] ?? change.field}:
                      </span>{' '}
                      <span className="text-ink-muted line-through">
                        {change.before ?? 'empty'}
                      </span>{' '}
                      → {change.after ?? 'empty'}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex justify-end">
        <Button type="button" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  )
}
