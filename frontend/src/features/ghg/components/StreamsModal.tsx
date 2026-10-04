import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { InputField, SelectField } from '../../../components/Field'
import { Modal } from '../../../components/Modal'
import { useToast } from '../../../components/toast'
import { refusalMessage } from '../../../lib/api'
import { categoryLabel, scopeLabels, streamKindLabels } from '../format'
import { mayWrite, WRITE_TOOLTIP } from '../roles'
import { useCreateStream, useDeleteStream, useOrganizationQuery, useStreamsQuery } from '../useGhg'
import { RoleButton } from './RoleButton'
import type { Facility, StreamKind } from '../api'

/**
 * The register of source streams of one facility (spec 04.3): what it burns,
 * buys, discards or moves, by which meter or supplier, and whether the company
 * or a contractor operates it. The stream drives the default classification of
 * its records and is what completeness is checked against.
 */
export function StreamsModal({
  organizationId,
  facility,
  onClose,
}: {
  organizationId: string
  facility: Facility
  onClose: () => void
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
          setName('')
          setFuel('')
          setMeterOrSupplier('')
          toast(`${stream.name} added to ${facility.name}.`)
        },
      },
    )
  }

  return (
    <Modal title={`Source streams: ${facility.name}`} onClose={onClose}>
      <p className="text-sm text-ink-muted">
        Every source of emissions at the site. A record names its stream; the stream's kind fixes
        the categories it can be classified into, and whether a contractor operates it fixes the
        default scope (a contractor's source is scope 3, Corporate Standard chapter 4).
      </p>
      {streams.length > 0 && (
        <ul className="mt-3 flex flex-col text-sm">
          {streams.map((stream) => (
            <li
              key={stream.id}
              className="flex items-start justify-between gap-3 border-b border-hairline py-3 last:border-b-0"
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
                </span>
              </div>
              <RoleButton
                allowed={mayWrite(myRole)}
                tooltip={WRITE_TOOLTIP}
                variant="ghost"
                size="sm"
                className="text-danger"
                aria-label={`Remove stream ${stream.name}`}
                onClick={() =>
                  remove.mutate(stream.id, {
                    onError: (error) => toast(refusalMessage(error, myRole), 'error'),
                  })
                }
              >
                Remove
              </RoleButton>
            </li>
          ))}
        </ul>
      )}
      {streams.length === 0 && streamsQuery.data && (
        <p className="mt-3 text-sm text-ink-muted">No streams registered yet.</p>
      )}
      {mayWrite(myRole) && (
        <form onSubmit={submit} className="mt-5 grid gap-x-6 gap-y-5 md:grid-cols-2" noValidate>
          <InputField
            label="Stream name"
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
          <div className="flex justify-end gap-3 border-t border-hairline pt-5 md:col-span-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button type="submit" busy={create.isPending} disabled={name.trim() === ''}>
              Add stream
            </Button>
          </div>
        </form>
      )}
      {!mayWrite(myRole) && (
        <div className="mt-6 flex justify-end border-t border-hairline pt-5">
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </Modal>
  )
}
