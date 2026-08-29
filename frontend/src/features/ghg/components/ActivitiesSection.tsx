import { useState } from 'react'
import { Button } from '../../../components/Button'
import { GlassCard } from '../../../components/GlassCard'
import { Skeleton } from '../../../components/Skeleton'
import { useToast } from '../../../components/toast'
import { problemDetail } from '../../../lib/api'
import { categoryLabel, formatCo2e } from '../format'
import { useActivitiesQuery, useDeleteActivity, useFacilitiesQuery } from '../useGhg'
import { ActivityFormModal } from './ActivityFormModal'
import { ScopeBadge } from './badges'

/** Activity data: the measured quantities the calculation runs consume. */
export function ActivitiesSection({ organizationId }: { organizationId: string }) {
  const activitiesQuery = useActivitiesQuery(organizationId)
  const facilitiesQuery = useFacilitiesQuery(organizationId)
  const deleteActivity = useDeleteActivity(organizationId)
  const toast = useToast()
  const [adding, setAdding] = useState(false)

  const activities = activitiesQuery.data
  const facilities = facilitiesQuery.data ?? []

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-lg">Activity data</h2>
          <p className="text-sm text-dark-teal/60">
            Fuel burned, electricity bought, kilometres travelled — per facility.
          </p>
        </div>
        <Button
          className="px-4 py-1.5 text-sm"
          onClick={() => setAdding(true)}
          disabled={facilities.length === 0}
          title={facilities.length === 0 ? 'Add a facility first' : undefined}
        >
          Record activity
        </Button>
      </div>

      <GlassCard className="overflow-x-auto">
        {activitiesQuery.isPending && (
          <div aria-label="Loading activities" className="flex flex-col gap-2 p-4">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        )}
        {activities?.length === 0 && (
          <div className="p-8 text-center">
            <h3 className="font-semibold">No activity data yet</h3>
            <p className="mt-1 text-sm text-dark-teal/60">
              {facilities.length === 0
                ? 'Add a facility to the boundary, then record what it consumed.'
                : 'Record the first measured quantity to give a run something to calculate.'}
            </p>
          </div>
        )}
        {activities && activities.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-teal/10 text-xs text-dark-teal/60 uppercase">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Facility</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Scope</th>
                <th className="px-4 py-3 font-semibold">Quantity</th>
                <th className="px-4 py-3 font-semibold">CO₂e (unweighted)</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.id} className="border-b border-teal/5 last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap">{activity.activityDate}</td>
                  <td className="px-4 py-3">{activity.facilityName}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{activity.factorName}</span>
                    <span className="block text-xs text-dark-teal/60">
                      {categoryLabel(activity.category)}
                      {activity.note ? ` — ${activity.note}` : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ScopeBadge scope={activity.scope} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {activity.quantity.toLocaleString()} {activity.unit}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatCo2e(activity.unweightedKgCo2e)}
                  </td>
                  <td className="px-4 py-3 text-right">
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

      {adding && (
        <ActivityFormModal
          organizationId={organizationId}
          facilities={facilities}
          onClose={() => setAdding(false)}
          onSaved={(message) => {
            setAdding(false)
            toast(message)
          }}
        />
      )}
    </section>
  )
}
