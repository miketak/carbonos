import { useState } from 'react'
import { Button } from '../../../components/Button'
import { GlassCard } from '../../../components/GlassCard'
import { Skeleton } from '../../../components/Skeleton'
import { useToast } from '../../../components/toast'
import { problemDetail } from '../../../lib/api'
import { useDeleteFacility, useFacilitiesQuery } from '../useGhg'
import { FacilityFormModal } from './FacilityFormModal'
import type { Facility } from '../api'

type Dialog = { kind: 'create' } | { kind: 'edit'; facility: Facility } | null

/** The organizational boundary: which facilities count, and how much of each. */
export function FacilitiesSection({ organizationId }: { organizationId: string }) {
  const facilitiesQuery = useFacilitiesQuery(organizationId)
  const deleteFacility = useDeleteFacility(organizationId)
  const toast = useToast()
  const [dialog, setDialog] = useState<Dialog>(null)

  const facilities = facilitiesQuery.data

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-lg">Organizational boundary</h2>
          <p className="text-sm text-dark-teal/60">
            Facilities, with the equity share and control flag consolidation uses.
          </p>
        </div>
        <Button className="px-4 py-1.5 text-sm" onClick={() => setDialog({ kind: 'create' })}>
          Add facility
        </Button>
      </div>

      <GlassCard className="overflow-x-auto">
        {facilitiesQuery.isPending && (
          <div aria-label="Loading facilities" className="flex flex-col gap-2 p-4">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        )}
        {facilities?.length === 0 && (
          <div className="p-8 text-center">
            <h3 className="font-semibold">No facilities yet</h3>
            <p className="mt-1 text-sm text-dark-teal/60">
              Add the sites this organization reports on to draw its boundary.
            </p>
          </div>
        )}
        {facilities && facilities.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-teal/10 text-xs text-dark-teal/60 uppercase">
                <th className="px-4 py-3 font-semibold">Facility</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Equity share</th>
                <th className="px-4 py-3 font-semibold">Controlled</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {facilities.map((facility) => (
                <tr key={facility.id} className="border-b border-teal/5 last:border-0">
                  <td className="px-4 py-3 font-medium">{facility.name}</td>
                  <td className="px-4 py-3 text-dark-teal/70">{facility.location}</td>
                  <td className="px-4 py-3">{facility.equitySharePercent}%</td>
                  <td className="px-4 py-3">{facility.controlled ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      className="px-2 py-1 text-xs"
                      onClick={() => setDialog({ kind: 'edit', facility })}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      className="px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      onClick={() =>
                        deleteFacility.mutate(facility.id, {
                          onSuccess: () => toast(`${facility.name} removed.`),
                          onError: (error) =>
                            toast(
                              problemDetail(error) ?? `Could not remove ${facility.name}.`,
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

      {dialog?.kind === 'create' && (
        <FacilityFormModal
          organizationId={organizationId}
          onClose={() => setDialog(null)}
          onSaved={(message) => {
            setDialog(null)
            toast(message)
          }}
        />
      )}
      {dialog?.kind === 'edit' && (
        <FacilityFormModal
          organizationId={organizationId}
          facility={dialog.facility}
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
