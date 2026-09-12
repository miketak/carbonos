import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { useToast } from '../../components/toast'
import { refusalMessage } from '../../lib/api'
import { FacilityFormModal } from './components/FacilityFormModal'
import { RemoveDialog } from './components/RemoveDialog'
import { RoleButton } from './components/RoleButton'
import { StreamsModal } from './components/StreamsModal'
import { facilityTypeLabels, leaseLabels, relationshipShortLabels } from './format'
import { mayWrite, WRITE_TOOLTIP } from './roles'
import {
  useDeleteFacility,
  useEntitiesQuery,
  useFacilitiesQuery,
  useOrganizationQuery,
} from './useGhg'
import type { Facility } from './api'

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit'; facility: Facility }
  | { kind: 'streams'; facility: Facility }
  | { kind: 'remove'; facility: Facility }
  | null

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <GlassCard className="p-4">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-dark-teal">{value}</p>
    </GlassCard>
  )
}

/** The organization's facilities: sites, each under a legal entity that carries the facts (spec 03.1). */
export function FacilitiesPage() {
  const { organizationId = '' } = useParams()
  const facilitiesQuery = useFacilitiesQuery(organizationId)
  const entitiesQuery = useEntitiesQuery(organizationId)
  const organizationQuery = useOrganizationQuery(organizationId)
  const deleteFacility = useDeleteFacility(organizationId)
  const toast = useToast()
  const [dialog, setDialog] = useState<Dialog>(null)

  const facilities = facilitiesQuery.data
  const entityCount = entitiesQuery.data?.length ?? 0
  const myRole = organizationQuery.data?.myRole ?? null

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h1 className="text-xl">Facilities</h1>
          <p className="text-sm text-ink-muted">
            The organization's sites. Each belongs to a legal entity, whose relationship sets the
            accounting share every inventory starts from.
          </p>
        </div>
        <RoleButton
          allowed={mayWrite(myRole)}
          tooltip={WRITE_TOOLTIP}
          className="px-4 py-1.5 text-sm"
          onClick={() => setDialog({ kind: 'create' })}
        >
          Add facility
        </RoleButton>
      </div>

      {facilities && facilities.length > 0 && (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <StatChip label="Facilities" value={facilities.length.toLocaleString()} />
          <StatChip
            label="Legal entities represented"
            value={`${new Set(facilities.map((facility) => facility.entityId)).size} of ${entityCount}`}
          />
          <StatChip
            label="Under subsidiaries"
            value={`${facilities.filter((facility) => facility.relationshipType === 'SUBSIDIARY').length} of ${facilities.length}`}
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
                <th className="px-4 py-3 font-semibold">Legal entity</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {facilities.map((facility) => (
                <tr key={facility.id} className="border-b border-teal/5 last:border-0">
                  <td className="px-4 py-3 font-medium">{facility.name}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {facility.location}
                    {(facility.facilityType || facility.effectiveGridRegion) && (
                      <span className="block text-xs">
                        {facility.facilityType ? facilityTypeLabels[facility.facilityType] : ''}
                        {facility.facilityType && facility.effectiveGridRegion ? ' · ' : ''}
                        {facility.effectiveGridRegion ? `grid ${facility.effectiveGridRegion}` : ''}
                      </span>
                    )}
                    {facility.leaseType && (
                      <span className="block text-xs text-amber-700">
                        {leaseLabels[facility.leaseType]}
                        {facility.leaseFrom ? ` from ${facility.leaseFrom}` : ''}
                        {facility.leaseTo ? ` until ${facility.leaseTo}` : ''}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {facility.entityName}
                    <span className="block text-xs text-ink-muted">
                      {relationshipShortLabels[facility.relationshipType]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      className="px-2 py-1 text-xs"
                      onClick={() => setDialog({ kind: 'streams', facility })}
                    >
                      Source streams
                    </Button>
                    <RoleButton
                      allowed={mayWrite(myRole)}
                      tooltip={WRITE_TOOLTIP}
                      variant="ghost"
                      className="px-2 py-1 text-xs"
                      onClick={() => setDialog({ kind: 'edit', facility })}
                    >
                      Edit
                    </RoleButton>
                    <RoleButton
                      allowed={mayWrite(myRole)}
                      tooltip={WRITE_TOOLTIP}
                      variant="ghost"
                      className="px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      onClick={() => setDialog({ kind: 'remove', facility })}
                    >
                      Remove
                    </RoleButton>
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
      {dialog?.kind === 'remove' && (
        <RemoveDialog
          title={`Remove ${dialog.facility.name}?`}
          description="The facility stays on file as removed, with your name, the date and the reason. A facility with activity records, or one an unpublished inventory still holds in its boundary, cannot be removed."
          busy={deleteFacility.isPending}
          onClose={() => setDialog(null)}
          onConfirm={(reason) =>
            deleteFacility.mutate(
              { id: dialog.facility.id, reason },
              {
                onSuccess: () => {
                  setDialog(null)
                  toast(`${dialog.facility.name} removed.`)
                },
                onError: (error) => {
                  setDialog(null)
                  toast(refusalMessage(error, myRole), 'error')
                },
              },
            )
          }
        />
      )}
      {dialog?.kind === 'streams' && (
        <StreamsModal
          organizationId={organizationId}
          facility={dialog.facility}
          onClose={() => setDialog(null)}
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
