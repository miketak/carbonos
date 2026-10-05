import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { InputField, SelectField } from '../../components/Field'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { Panel } from '../../components/Panel'
import { Skeleton } from '../../components/Skeleton'
import { useToast } from '../../components/toast'
import { refusalMessage } from '../../lib/api'
import { RoleButton } from './components/RoleButton'
import { categoryLabel, scopeLabels, streamKindLabels } from './format'
import { mayWrite, WRITE_TOOLTIP } from './roles'
import {
  useCreateStream,
  useDeleteStream,
  useFacilitiesQuery,
  useOrganizationQuery,
  useStreamsQuery,
} from './useGhg'
import type { Facility, SourceStream, StreamKind } from './api'

/**
 * The register of emission sources of one facility (specs 04.3, 04.10), at
 * `facilities/:facilityId/sources`: what it burns, buys, discards or moves,
 * by which meter or supplier, and whether the company or a contractor
 * operates it. A page, under the form-surfaces rule of spec 08, with the add
 * form on it so several sources go in one after another; a source can also be
 * created on the activity form while a record is entered.
 */
export function EmissionSourcesPage() {
  const { organizationId = '', facilityId = '' } = useParams()
  const facilitiesQuery = useFacilitiesQuery(organizationId)
  const listPath = `/app/ghg/${organizationId}/facilities`

  if (facilitiesQuery.isPending) {
    return (
      <div aria-label="Loading emission sources" className="flex flex-col gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-96 max-w-3xl" />
      </div>
    )
  }
  const facility = facilitiesQuery.data?.find((candidate) => candidate.id === facilityId)
  if (!facility) {
    return (
      <Panel className="p-8 text-center">
        <h1 className="text-lg font-semibold">Facility not found</h1>
        <p className="mt-1 text-sm text-ink-muted">
          It may have been removed.{' '}
          <Link to={listPath} className="font-medium text-link hover:underline">
            Back to facilities
          </Link>
        </p>
      </Panel>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        size="md"
        back={{ to: listPath }}
        crumbs={[
          { label: 'Facilities', to: listPath },
          { label: facility.name },
          { label: 'Emission sources' },
        ]}
        title="Emission sources"
        subtitle={`Every source of emissions at ${facility.name}. A record names its source; the kind fixes the categories it can be classified into, and a contractor-operated source defaults to scope 3 (Corporate Standard chapter 4). The emission factor is chosen in each inventory's review.`}
      />
      <SourceRegister organizationId={organizationId} facility={facility} />
    </div>
  )
}

function SourceRegister({
  organizationId,
  facility,
}: {
  organizationId: string
  facility: Facility
}) {
  const streamsQuery = useStreamsQuery(organizationId)
  const organizationQuery = useOrganizationQuery(organizationId)
  const create = useCreateStream(organizationId)
  const remove = useDeleteStream(organizationId)
  const toast = useToast()
  const streams = (streamsQuery.data ?? []).filter((stream) => stream.facilityId === facility.id)
  const myRole = organizationQuery.data?.myRole ?? null
  const [name, setName] = useState('')
  const [kind, setKind] = useState<StreamKind>('STATIONARY_COMBUSTION')
  const [fuel, setFuel] = useState('')
  const [meterOrSupplier, setMeterOrSupplier] = useState('')
  const [contractorOperated, setContractorOperated] = useState(false)
  const [removing, setRemoving] = useState<SourceStream | null>(null)
  const generalError = create.isError ? refusalMessage(create.error, myRole) : undefined

  const submit = (event: FormEvent) => {
    event.preventDefault()
    create.mutate(
      {
        facilityId: facility.id,
        input: {
          name,
          kind,
          fuel: fuel.trim() === '' ? undefined : fuel,
          meterOrSupplier: meterOrSupplier.trim() === '' ? undefined : meterOrSupplier,
          contractorOperated,
        },
      },
      {
        onSuccess: (stream) => {
          // the kind and the contractor flag stay: the next source is usually a sibling
          setName('')
          setFuel('')
          setMeterOrSupplier('')
          toast(`${stream.name} added to ${facility.name}.`)
        },
      },
    )
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Panel className="p-6">
        {streamsQuery.isPending && (
          <div aria-label="Loading emission sources" className="flex flex-col gap-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        )}
        {streams.length > 0 && (
          <ul aria-label="Emission sources" className="flex flex-col text-sm">
            {streams.map((stream) => (
              <li
                key={stream.id}
                className="flex items-start justify-between gap-3 border-b border-hairline py-3 first:pt-0 last:border-b-0 last:pb-0"
              >
                <div>
                  <span className="font-medium">{stream.name}</span>
                  <span className="block text-[13px] text-ink-muted">
                    {streamKindLabels[stream.kind]}
                    {stream.fuel ? ` · ${stream.fuel}` : ''}
                    {stream.meterOrSupplier ? ` · ${stream.meterOrSupplier}` : ''} ·{' '}
                    {stream.contractorOperated ? 'contractor-operated' : 'owned or controlled'} ·
                    defaults to {scopeLabels[stream.defaultScope]},{' '}
                    {categoryLabel(stream.defaultCategory)}
                    {stream.origin === 'INLINE'
                      ? ' · added during data entry'
                      : stream.origin === 'IMPORT'
                        ? ' · added during import'
                        : ''}
                  </span>
                </div>
                <RoleButton
                  allowed={mayWrite(myRole)}
                  tooltip={WRITE_TOOLTIP}
                  variant="ghost"
                  size="sm"
                  className="text-danger"
                  aria-label={`Remove emission source ${stream.name}`}
                  onClick={() => setRemoving(stream)}
                >
                  Remove
                </RoleButton>
              </li>
            ))}
          </ul>
        )}
        {streams.length === 0 && streamsQuery.data && (
          <p className="text-sm text-ink-muted">No emission sources registered yet.</p>
        )}
      </Panel>

      {mayWrite(myRole) && (
        <Panel className="p-6">
          <form
            aria-label="Add emission source"
            onSubmit={submit}
            className="grid gap-x-6 gap-y-5 md:grid-cols-2"
            noValidate
          >
            <h2 className="text-base font-semibold md:col-span-2">Add emission source</h2>
            <InputField
              label="Source name"
              placeholder="Standby gensets"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            <SelectField
              label="Kind"
              value={kind}
              onChange={(event) => setKind(event.target.value as StreamKind)}
            >
              {Object.entries(streamKindLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectField>
            <InputField
              label="Fuel or material (optional)"
              placeholder="Diesel"
              value={fuel}
              onChange={(event) => setFuel(event.target.value)}
            />
            <InputField
              label="Meter or supplier (optional)"
              placeholder="Bulk tank dip, ECG account 1234"
              value={meterOrSupplier}
              onChange={(event) => setMeterOrSupplier(event.target.value)}
            />
            <label className="flex min-h-11 items-center gap-2.5 text-[15px] md:col-span-2">
              <input
                type="checkbox"
                checked={contractorOperated}
                onChange={(event) => setContractorOperated(event.target.checked)}
                className="size-[18px] accent-primary"
              />
              Operated by a contractor (its emissions default to scope 3)
            </label>
            {generalError && (
              <p role="alert" className="text-sm font-medium text-danger md:col-span-2">
                {generalError}
              </p>
            )}
            <div className="flex justify-end border-t border-hairline pt-5 md:col-span-2">
              <Button type="submit" busy={create.isPending} disabled={name.trim() === ''}>
                Add emission source
              </Button>
            </div>
          </form>
        </Panel>
      )}

      {removing && (
        <Modal title="Remove emission source?" onClose={() => setRemoving(null)}>
          <p className="text-sm text-ink-muted">
            {removing.name} is removed from {facility.name}. A source that records name cannot be
            removed: move them to another source first.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setRemoving(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              busy={remove.isPending}
              onClick={() =>
                remove.mutate(removing.id, {
                  onSuccess: () => {
                    setRemoving(null)
                    toast(`${removing.name} removed from ${facility.name}.`)
                  },
                  onError: (error) => {
                    setRemoving(null)
                    toast(refusalMessage(error, myRole), 'error')
                  },
                })
              }
            >
              Remove
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
