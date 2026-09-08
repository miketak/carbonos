import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { useToast } from '../../components/toast'
import { problemDetail } from '../../lib/api'
import { FacilityFormModal } from './components/FacilityFormModal'
import { useDeleteFacility, useFacilitiesQuery } from './useGhg'
import type { Facility } from './api'

type Dialog = { kind: 'create' } | { kind: 'edit'; facility: Facility } | null

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <GlassCard className="p-4">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-dark-teal">{value}</p>
    </GlassCard>
  )
}

/** The organization's facilities: org-level facts with default ownership/control. */
export function FacilitiesPage() {
  const { organizationId = '' } = useParams()
  const facilitiesQuery = useFacilitiesQuery(organizationId)
  const deleteFacility = useDeleteFacility(organizationId)
  const toast = useToast()
  const [dialog, setDialog] = useState<Dialog>(null)

  const facilities = facilitiesQuery.data

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h1 className="text-xl">Facilities</h1>
          <p className="text-sm text-ink-muted">
            The organization's sites. Ownership and control here are facts: each inventory's
            boundary starts from them and may override them.
          </p>
        </div>
        <Button className="px-4 py-1.5 text-sm" onClick={() => setDialog({ kind: 'create' })}>
          Add facility
        </Button>
      </div>

      {facilities && facilities.length > 0 && (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <StatChip label="Facilities" value={facilities.length.toLocaleString()} />
          <StatChip
            label="Operationally controlled"
            value={`${facilities.filter((facility) => facility.operationalControl).length} of ${facilities.length}`}
          />
          <StatChip
            label="Avg ownership"
            value={`${Math.round(
              facilities.reduce((sum, facility) => sum + facility.equitySharePercent, 0) /
                facilities.length,
            )}%`}
          />
        </div>
      )}

      <GlassCard className="animate-fade-up overflow-x-auto">
        {facilitiesQuery.isPending && (
          <div aria-label="Loading facilities" className="flex flex-col gap-2 p-4">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        )}
        {facilities?.length === 0 && (
          <div className="p-8 text-center">
            <h2 className="font-semibold">No facilities yet</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Add the sites this organization reports on to draw its boundary.
            </p>
          </div>
        )}
        {facilities && facilities.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
                <th className="px-4 py-3 font-semibold">Facility</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Equity share</th>
                <th className="px-4 py-3 font-semibold">Financial ctrl</th>
                <th className="px-4 py-3 font-semibold">Operational ctrl</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {facilities.map((facility) => (
                <tr key={facility.id} className="border-b border-teal/5 last:border-0">
                  <td className="px-4 py-3 font-medium">{facility.name}</td>
                  <td className="px-4 py-3 text-ink-muted">{facility.location}</td>
                  <td className="px-4 py-3">{facility.equitySharePercent}%</td>
                  <td className="px-4 py-3">{facility.financialControl ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">{facility.operationalControl ? 'Yes' : 'No'}</td>
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
