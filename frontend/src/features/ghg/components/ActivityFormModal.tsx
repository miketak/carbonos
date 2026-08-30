import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { InputField, SelectField } from '../../../components/Field'
import { Modal } from '../../../components/Modal'
import { fieldErrors, problemDetail } from '../../../lib/api'
import { useCreateActivity, useUpdateActivity } from '../useGhg'
import type { Activity, DataQuality, Facility } from '../api'

const qualityLabels: Record<DataQuality, string> = {
  MEASURED: 'Measured',
  ESTIMATED: 'Estimated',
  CALCULATED: 'Calculated',
}

/** Records or corrects an organizational fact — what happened, where, and the evidence. */
export function ActivityFormModal({
  organizationId,
  facilities,
  activity,
  onClose,
  onSaved,
}: {
  organizationId: string
  facilities: Facility[]
  activity?: Activity
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const create = useCreateActivity(organizationId)
  const update = useUpdateActivity(organizationId)
  const mutation = activity ? update : create
  const [facilityId, setFacilityId] = useState(activity?.facilityId ?? facilities[0]?.id ?? '')
  const [activityType, setActivityType] = useState(activity?.activityType ?? '')
  const [quantity, setQuantity] = useState(activity ? String(activity.quantity) : '')
  const [unit, setUnit] = useState(activity?.unit ?? '')
  const [activityDate, setActivityDate] = useState(activity?.activityDate ?? '')
  const [dataSource, setDataSource] = useState(activity?.dataSource ?? '')
  const [evidenceRef, setEvidenceRef] = useState(activity?.evidenceRef ?? '')
  const [dataQuality, setDataQuality] = useState<DataQuality>(activity?.dataQuality ?? 'MEASURED')
  const [note, setNote] = useState(activity?.note ?? '')

  const errors = fieldErrors(mutation.error)
  const generalError = mutation.isError && !errors ? problemDetail(mutation.error) : undefined

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const input = {
      facilityId,
      activityType,
      quantity: Number(quantity),
      unit,
      activityDate,
      dataSource: dataSource.trim() === '' ? undefined : dataSource,
      evidenceRef: evidenceRef.trim() === '' ? undefined : evidenceRef,
      dataQuality,
      note: note.trim() === '' ? undefined : note,
    }
    if (activity) {
      update.mutate(
        { id: activity.id, input },
        { onSuccess: () => onSaved('Record corrected. Past runs are unaffected.') },
      )
    } else {
      create.mutate(input, { onSuccess: () => onSaved('Activity recorded.') })
    }
  }

  return (
    <Modal title={activity ? 'Correct record' : 'Record activity'} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <SelectField
          label="Facility"
          value={facilityId}
          onChange={(event) => setFacilityId(event.target.value)}
          error={errors?.facilityId}
        >
          {facilities.map((facility) => (
            <option key={facility.id} value={facility.id}>
              {facility.name}
            </option>
          ))}
        </SelectField>
        <InputField
          label="Activity"
          placeholder="e.g. Diesel consumption"
          value={activityType}
          onChange={(event) => setActivityType(event.target.value)}
          error={errors?.activityType}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="Quantity"
            type="number"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            error={errors?.quantity}
            required
          />
          <InputField
            label="Unit"
            placeholder="litre, kWh, km…"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            error={errors?.unit}
            required
          />
        </div>
        <InputField
          label="Date"
          type="date"
          max={new Date().toISOString().slice(0, 10)}
          value={activityDate}
          onChange={(event) => setActivityDate(event.target.value)}
          error={errors?.activityDate}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="Data source (optional)"
            placeholder="Fuel invoice"
            value={dataSource}
            onChange={(event) => setDataSource(event.target.value)}
            error={errors?.dataSource}
          />
          <InputField
            label="Evidence ref (optional)"
            placeholder="Invoice #2938"
            value={evidenceRef}
            onChange={(event) => setEvidenceRef(event.target.value)}
            error={errors?.evidenceRef}
          />
        </div>
        <SelectField
          label="Data quality"
          value={dataQuality}
          onChange={(event) => setDataQuality(event.target.value as DataQuality)}
          error={errors?.dataQuality}
        >
          {Object.entries(qualityLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <InputField
          label="Note (optional)"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          error={errors?.note}
        />
        {generalError && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {generalError}
          </p>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" busy={mutation.isPending}>
            {activity ? 'Save correction' : 'Record'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
