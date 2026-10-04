import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { PageHeader } from '../../components/PageHeader'
import { Panel } from '../../components/Panel'
import { Skeleton } from '../../components/Skeleton'
import { Stat, StatStrip } from '../../components/StatStrip'
import { Table, Td, Th, TwoLine } from '../../components/Table'
import { useToast } from '../../components/toast'
import { refusalMessage } from '../../lib/api'
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
  { kind: 'streams'; facility: Facility } | { kind: 'remove'; facility: Facility } | null

/** The organization's facilities: sites, each under a legal entity that carries the facts (spec 03.1). */
export function FacilitiesPage() {
  const { organizationId = '' } = useParams()
  const facilitiesQuery = useFacilitiesQuery(organizationId)
  const entitiesQuery = useEntitiesQuery(organizationId)
  const organizationQuery = useOrganizationQuery(organizationId)
  const deleteFacility = useDeleteFacility(organizationId)
  const toast = useToast()
  const navigate = useNavigate()
  const [dialog, setDialog] = useState<Dialog>(null)

  const facilities = facilitiesQuery.data
  const entityCount = entitiesQuery.data?.length ?? 0
  // The reporting company is stored as a subsidiary; the entity carries the flag (spec 03.1).
  const reportingCompanyIds = new Set(
    (entitiesQuery.data ?? [])
      .filter((entity) => entity.reportingCompany)
      .map((entity) => entity.id),
  )
  const myRole = organizationQuery.data?.myRole ?? null

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        back={{ to: `/app/ghg/${organizationId}` }}
        crumbs={[{ label: 'Facilities' }]}
        title="Facilities"
        subtitle="The organization's sites. Each belongs to a legal entity, whose relationship sets the accounting share every inventory starts from."
        actions={
          <RoleButton
            allowed={mayWrite(myRole)}
            tooltip={WRITE_TOOLTIP}
            onClick={() => navigate('new')}
          >
            Add facility
          </RoleButton>
        }
      />

      {facilities && facilities.length > 0 && (
        <StatStrip label="Facilities at a glance">
          <Stat label="Facilities" value={facilities.length.toLocaleString()} />
          <Stat
            label="Legal entities represented"
            value={`${new Set(facilities.map((facility) => facility.entityId)).size} of ${entityCount}`}
          />
          <Stat
            label="Under the company or a subsidiary"
            value={`${facilities.filter((facility) => facility.relationshipType === 'SUBSIDIARY').length} of ${facilities.length}`}
          />
        </StatStrip>
      )}

      {facilitiesQuery.isPending && (
        <div aria-label="Loading facilities" className="flex flex-col gap-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      )}
      {facilities?.length === 0 && (
        <Panel className="p-10 text-center">
          <h2 className="font-semibold">No facilities yet</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Add the sites this organization reports on to draw its boundary.
          </p>
        </Panel>
      )}
      {facilities && facilities.length > 0 && (
        <Table>
          <thead>
            <tr>
              <Th>Facility</Th>
              <Th>Location</Th>
              <Th>Legal entity</Th>
              <Th className="w-72">
                <span className="sr-only">Actions</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {facilities.map((facility) => (
              <tr key={facility.id}>
                <Td className="font-medium">{facility.name}</Td>
                <Td>
                  <div className="flex flex-col gap-0.5">
                    <span>{facility.location}</span>
                    {(facility.facilityType || facility.effectiveGridRegion) && (
                      <span className="text-[13px] text-ink-muted">
                        {facility.facilityType ? facilityTypeLabels[facility.facilityType] : ''}
                        {facility.facilityType && facility.effectiveGridRegion ? ' · ' : ''}
                        {facility.effectiveGridRegion ? `grid ${facility.effectiveGridRegion}` : ''}
                      </span>
                    )}
                    {facility.leaseType && (
                      <span className="text-[13px] font-medium text-warning">
                        {leaseLabels[facility.leaseType]}
                        {facility.leaseFrom ? ` from ${facility.leaseFrom}` : ''}
                        {facility.leaseTo ? ` until ${facility.leaseTo}` : ''}
                      </span>
                    )}
                  </div>
                </Td>
                <Td>
                  <TwoLine
                    primary={<span className="font-normal">{facility.entityName}</span>}
                    secondary={
                      reportingCompanyIds.has(facility.entityId)
                        ? 'Reporting company'
                        : relationshipShortLabels[facility.relationshipType]
                    }
                  />
                </Td>
                <Td align="right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDialog({ kind: 'streams', facility })}
                    >
                      Source streams
                    </Button>
                    <RoleButton
                      allowed={mayWrite(myRole)}
                      tooltip={WRITE_TOOLTIP}
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`${facility.id}/edit`)}
                    >
                      Edit
                    </RoleButton>
                    <RoleButton
                      allowed={mayWrite(myRole)}
                      tooltip={WRITE_TOOLTIP}
                      variant="ghost"
                      size="sm"
                      className="text-danger"
                      onClick={() => setDialog({ kind: 'remove', facility })}
                    >
                      Remove
                    </RoleButton>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
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
    </section>
  )
}
