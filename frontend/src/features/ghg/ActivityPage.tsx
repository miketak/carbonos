import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { useToast } from '../../components/toast'
import { formatPeriod } from './format'
import { problemDetail } from '../../lib/api'
import { ActivityFormModal } from './components/ActivityFormModal'
import { ActivityHistoryModal } from './components/ActivityHistoryModal'
import { EvidenceModal } from './components/EvidenceModal'
import { RemoveDialog } from './components/RemoveDialog'
import { useActivitiesQuery, useDeleteActivity, useFacilitiesQuery } from './useGhg'
import type { Activity } from './api'

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit'; activity: Activity }
  | { kind: 'remove'; activity: Activity }
  | { kind: 'evidence'; activity: Activity }
  | { kind: 'history'; activity: Activity }
  | null

/**
 * The organizational data layer: facts about what happened, independent of any
 * inventory. Scope, factors, and accounting treatment are decided per
 * inventory, never here (spec 02). A fact is corrected with a reason and keeps
 * its history; it is removed with a reason and stays as a tombstone (spec 04.4).
 */
export function ActivityPage() {
  const { organizationId = '' } = useParams()
  const activitiesQuery = useActivitiesQuery(organizationId)
  const facilitiesQuery = useFacilitiesQuery(organizationId)
  const deleteActivity = useDeleteActivity(organizationId)
  const toast = useToast()
  const [dialog, setDialog] = useState<Dialog>(null)

  const activities = activitiesQuery.data
  const facilities = facilitiesQuery.data ?? []

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h1 className="text-xl">Activity data</h1>
          <p className="text-sm text-ink-muted">
            What happened: the facts. Each inventory decides separately how these are accounted for.
          </p>
        </div>
        <Button
          className="px-4 py-1.5 text-sm"
          onClick={() => setDialog({ kind: 'create' })}
          disabled={facilities.length === 0}
          title={facilities.length === 0 ? 'Add a facility first' : undefined}
        >
          Record activity
        </Button>
      </div>

      <GlassCard className="animate-fade-up overflow-x-auto">
        {activitiesQuery.isPending && (
          <div aria-label="Loading activities" className="flex flex-col gap-2 p-4">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        )}
        {activities?.length === 0 && (
          <div className="p-8 text-center">
            <h2 className="font-semibold">No activity data yet</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {facilities.length === 0
                ? 'Add a facility, then record what happened there.'
                : 'Record the first fact: fuel burned, electricity bought, kilometres travelled.'}
            </p>
          </div>
        )}
        {activities && activities.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
                <th className="px-4 py-3 font-semibold">Period</th>
                <th className="px-4 py-3 font-semibold">Facility</th>
                <th className="px-4 py-3 font-semibold">Activity</th>
                <th className="px-4 py-3 font-semibold">Quantity</th>
                <th className="px-4 py-3 font-semibold">Source / evidence</th>
                <th className="px-4 py-3 font-semibold">Quality</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.id} className="border-b border-teal/5 last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatPeriod(activity.periodStart, activity.periodEnd)}
                  </td>
                  <td className="px-4 py-3">{activity.facilityName}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{activity.activityType}</span>
                    {activity.streamName && (
                      <span className="block text-xs text-ink-muted">{activity.streamName}</span>
                    )}
                    {activity.note && (
                      <span className="block text-xs text-ink-muted">{activity.note}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {activity.quantity.toLocaleString()} {activity.unit}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {activity.dataSource ?? '·'}
                    {activity.evidenceRef && (
                      <span className="block text-ink-muted">{activity.evidenceRef}</span>
                    )}
                    <button
                      type="button"
                      className="block text-link hover:underline"
                      onClick={() => setDialog({ kind: 'evidence', activity })}
                    >
                      {activity.evidenceCount === 0
                        ? 'Attach evidence'
                        : `${activity.evidenceCount} attachment${activity.evidenceCount === 1 ? '' : 's'}`}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        activity.dataQualityTier <= 2
                          ? 'bg-teal/15 text-dark-teal'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                      title={activity.dataQualityTierLabel}
                    >
                      Tier {activity.dataQualityTier} ·{' '}
                      {activity.dataQuality.charAt(0) + activity.dataQuality.slice(1).toLowerCase()}
                    </span>
                    {activity.uncertaintyPercent !== null && (
                      <span className="block text-xs text-ink-muted">
                        ±{activity.uncertaintyPercent}%
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      className="px-2 py-1 text-xs"
                      onClick={() => setDialog({ kind: 'history', activity })}
                    >
                      History{activity.revisionCount > 0 ? ` (${activity.revisionCount})` : ''}
                    </Button>
                    <Button
                      variant="ghost"
                      className="px-2 py-1 text-xs"
                      onClick={() => setDialog({ kind: 'edit', activity })}
                    >
                      Correct
                    </Button>
                    <Button
                      variant="ghost"
                      className="px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      onClick={() => setDialog({ kind: 'remove', activity })}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>

      {(dialog?.kind === 'create' || dialog?.kind === 'edit') && (
        <ActivityFormModal
          organizationId={organizationId}
          facilities={facilities}
          activity={dialog.kind === 'edit' ? dialog.activity : undefined}
          onClose={() => setDialog(null)}
          onSaved={(message) => {
            setDialog(null)
            toast(message)
          }}
        />
      )}
      {dialog?.kind === 'remove' && (
        <RemoveDialog
          title={`Remove ${dialog.activity.activityType}?`}
          description="The record stays on file as removed, with your name, the date and the reason; inventories that reviewed it exclude it on their next review. A record a run calculated cannot be removed."
          busy={deleteActivity.isPending}
          onClose={() => setDialog(null)}
          onConfirm={(reason) =>
            deleteActivity.mutate(
              { id: dialog.activity.id, reason },
              {
                onSuccess: () => {
                  setDialog(null)
                  toast('Activity removed.')
                },
                onError: (error) => {
                  setDialog(null)
                  toast(problemDetail(error) ?? 'Could not remove the activity.', 'error')
                },
              },
            )
          }
        />
      )}
      {dialog?.kind === 'evidence' && (
        <EvidenceModal
          owner={{ activityId: dialog.activity.id }}
          organizationId={organizationId}
          title={`Evidence for ${dialog.activity.activityType}`}
          editable
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'history' && (
        <ActivityHistoryModal activity={dialog.activity} onClose={() => setDialog(null)} />
      )}
    </section>
  )
}
