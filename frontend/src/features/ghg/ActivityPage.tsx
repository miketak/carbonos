import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { useToast } from '../../components/toast'
import { problemDetail } from '../../lib/api'
import { ActivityFormModal } from './components/ActivityFormModal'
import { useActivitiesQuery, useDeleteActivity, useFacilitiesQuery } from './useGhg'
import type { Activity } from './api'

/**
 * The organizational data layer: facts about what happened, independent of any
 * inventory. Scope, factors, and accounting treatment are decided per
 * inventory — never here (spec 003).
 */
export function ActivityPage() {
  const { organizationId = '' } = useParams()
  const activitiesQuery = useActivitiesQuery(organizationId)
  const facilitiesQuery = useFacilitiesQuery(organizationId)
  const deleteActivity = useDeleteActivity(organizationId)
  const toast = useToast()
  const [dialog, setDialog] = useState<
    { kind: 'create' } | { kind: 'edit'; activity: Activity } | null
  >(null)

  const activities = activitiesQuery.data
  const facilities = facilitiesQuery.data ?? []

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h1 className="text-xl">Activity data</h1>
          <p className="text-sm text-ink-muted">
            What happened — the facts. Each inventory decides separately how these are accounted
            for.
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
                : 'Record the first fact — fuel burned, electricity bought, kilometres travelled.'}
            </p>
          </div>
        )}
        {activities && activities.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
                <th className="px-4 py-3 font-semibold">Date</th>
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
                  <td className="px-4 py-3 whitespace-nowrap">{activity.activityDate}</td>
                  <td className="px-4 py-3">{activity.facilityName}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{activity.activityType}</span>
                    {activity.note && (
                      <span className="block text-xs text-ink-muted">{activity.note}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {activity.quantity.toLocaleString()} {activity.unit}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {activity.dataSource ?? '—'}
                    {activity.evidenceRef && (
                      <span className="block text-ink-muted">{activity.evidenceRef}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        activity.dataQuality === 'MEASURED'
                          ? 'bg-teal/15 text-dark-teal'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {activity.dataQuality.charAt(0) + activity.dataQuality.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
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
                      onClick={() =>
                        deleteActivity.mutate(activity.id, {
                          onSuccess: () => toast('Activity removed.'),
                          onError: (error) =>
                            toast(
                              problemDetail(error) ?? 'Could not remove the activity.',
                              'error',
                            ),
                        })
                      }
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

      {dialog && (
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
    </section>
  )
}
