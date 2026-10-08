import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { InputField, SelectField, TextAreaField } from '../../components/Field'
import { PageHeader } from '../../components/PageHeader'
import { Panel } from '../../components/Panel'
import { Skeleton } from '../../components/Skeleton'
import { useToast } from '../../components/toast'
import { fieldErrors, problemDetail } from '../../lib/api'
import { streamKindLabels } from './format'
import { useFacilitiesQuery, useStreamsQuery, useUpdateStream } from './useGhg'
import type { SourceStream, StreamKind } from './api'

/**
 * The page that edits an emission source
 * (`facilities/:facilityId/sources/:streamId/edit`, specs 04.3 and 04.10):
 * the fields of the add form, prefilled. The kind and the contractor flag are
 * the source's operational-boundary decision (Corporate Standard chapter 4);
 * changing either on a source with records asks for a reason, which the
 * history row carries. Records already filed keep their scope and category
 * and the factor they were classified with; only new records take the new
 * default. A save returns to the Emission sources page, which is where a
 * source lives (spec 08, form surfaces).
 */
export function EmissionSourceFormPage() {
  const { organizationId = '', facilityId = '', streamId = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const facilitiesQuery = useFacilitiesQuery(organizationId)
  const streamsQuery = useStreamsQuery(organizationId)
  const facilitiesPath = `/app/ghg/${organizationId}/facilities`
  const sourcesPath = `${facilitiesPath}/${facilityId}/sources`

  if (facilitiesQuery.isPending || streamsQuery.isPending) {
    return (
      <div aria-label="Loading emission source" className="flex flex-col gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-96 max-w-2xl" />
      </div>
    )
  }
  const facility = facilitiesQuery.data?.find((candidate) => candidate.id === facilityId)
  const stream = streamsQuery.data?.find(
    (candidate) => candidate.id === streamId && candidate.facilityId === facilityId,
  )
  if (!facility || !stream) {
    return (
      <Panel className="p-8 text-center">
        <h1 className="text-lg font-semibold">
          {facility ? 'Emission source not found' : 'Facility not found'}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          It may have been removed.{' '}
          <Link
            to={facility ? sourcesPath : facilitiesPath}
            className="font-medium text-link hover:underline"
          >
            {facility ? 'Back to emission sources' : 'Back to facilities'}
          </Link>
        </p>
      </Panel>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        size="md"
        back={{ to: sourcesPath }}
        crumbs={[
          { label: 'Facilities', to: facilitiesPath },
          { label: facility.name },
          { label: 'Emission sources', to: sourcesPath },
          { label: 'Edit emission source' },
        ]}
        title="Edit emission source"
        subtitle={`${stream.name} at ${facility.name}. The source keeps its identity and its records; the history records what changed.`}
      />
      <EmissionSourceForm
        key={stream.id}
        organizationId={organizationId}
        stream={stream}
        onCancel={() => navigate(sourcesPath)}
        onSaved={(message) => {
          toast(message)
          navigate(sourcesPath)
        }}
      />
    </div>
  )
}

/** The shortest reason that reclassifies a source with records (the backend's rule). */
const REASON_MIN = 10

function EmissionSourceForm({
  organizationId,
  stream,
  onCancel,
  onSaved,
}: {
  organizationId: string
  stream: SourceStream
  onCancel: () => void
  onSaved: (message: string) => void
}) {
  const update = useUpdateStream(organizationId)
  const [name, setName] = useState(stream.name)
  const [kind, setKind] = useState<StreamKind>(stream.kind)
  const [fuel, setFuel] = useState(stream.fuel ?? '')
  const [meterOrSupplier, setMeterOrSupplier] = useState(stream.meterOrSupplier ?? '')
  const [contractorOperated, setContractorOperated] = useState(stream.contractorOperated)
  const [note, setNote] = useState(stream.note ?? '')
  const [reclassifyReason, setReclassifyReason] = useState('')

  const hasRecords = stream.recordCount > 0
  const records = `${stream.recordCount} ${stream.recordCount === 1 ? 'record' : 'records'}`
  const reclassifies = kind !== stream.kind || contractorOperated !== stream.contractorOperated
  const needsReason = hasRecords && reclassifies
  const fuelChanged = hasRecords && fuel.trim() !== (stream.fuel ?? '')

  const errors = fieldErrors(update.error)
  const generalError = update.isError && !errors ? problemDetail(update.error) : undefined

  const submit = (event: FormEvent) => {
    event.preventDefault()
    update.mutate(
      {
        id: stream.id,
        input: {
          name,
          kind,
          fuel: fuel.trim() === '' ? undefined : fuel,
          meterOrSupplier: meterOrSupplier.trim() === '' ? undefined : meterOrSupplier,
          contractorOperated,
          note: note.trim() === '' ? undefined : note,
          reclassifyReason: needsReason ? reclassifyReason : undefined,
        },
      },
      { onSuccess: () => onSaved(`${name.trim()} updated.`) },
    )
  }

  return (
    // noValidate: the backend's refusals print under their field instead of a native tooltip;
    // the name lets the QA driver and the tests address the form the way they address a dialog
    <form
      aria-label="Edit emission source"
      onSubmit={submit}
      className="flex max-w-[760px] flex-col gap-6"
      noValidate
    >
      <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
        <InputField
          label="Source name"
          placeholder="Standby gensets"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors?.name}
          required
        />
        <SelectField
          label="Kind"
          value={kind}
          onChange={(event) => setKind(event.target.value as StreamKind)}
          error={errors?.kind}
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
          error={errors?.fuel}
          hint={
            fuelChanged
              ? `Records already filed keep the factor they were classified with; the ${records} of this source are not reclassified.`
              : undefined
          }
        />
        <InputField
          label="Meter or supplier (optional)"
          placeholder="Bulk tank dip, ECG account 1234"
          value={meterOrSupplier}
          onChange={(event) => setMeterOrSupplier(event.target.value)}
          error={errors?.meterOrSupplier}
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
        {needsReason && (
          <div className="md:col-span-2">
            <TextAreaField
              label="Reason for the change of kind or operator"
              value={reclassifyReason}
              onChange={(event) => setReclassifyReason(event.target.value)}
              error={errors?.reclassifyReason}
              maxLength={500}
              placeholder="The unit was moved onto a trailer in March"
              hint={`${stream.name} has ${records}, ${stream.recordCount === 1 ? 'which keeps' : 'which keep'} the scope and category ${stream.recordCount === 1 ? 'it was' : 'they were'} filed under; only new records take the new default. Say why the source is reclassified, in ${REASON_MIN} to 500 characters: a verifier reads it in the history.`}
              required
            />
          </div>
        )}
        <div className="md:col-span-2">
          <TextAreaField
            label="Note (optional)"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            error={errors?.note}
            maxLength={255}
          />
        </div>
      </div>
      {generalError && (
        <p role="alert" className="text-sm font-medium text-danger">
          {generalError}
        </p>
      )}
      <div className="flex justify-end gap-3 border-t border-hairline pt-5">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" busy={update.isPending} disabled={name.trim() === ''}>
          Save
        </Button>
      </div>
    </form>
  )
}
