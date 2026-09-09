import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { InputField, SelectField } from '../../../components/Field'
import { Modal } from '../../../components/Modal'
import { fieldErrors, problemDetail } from '../../../lib/api'
import { checkNumber, collectErrors } from '../../../lib/validate'
import { useCreateActivity, useUnitsQuery, useUpdateActivity } from '../useGhg'
import type { Activity, DataQuality, Facility, Unit } from '../api'
import { tierLabels } from '../format'
import { findUnit, groupUnits } from '../units'

const CUSTOM_UNIT = '__custom__'

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
  const unitsQuery = useUnitsQuery(organizationId)
  const [facilityId, setFacilityId] = useState(activity?.facilityId ?? facilities[0]?.id ?? '')
  const [activityType, setActivityType] = useState(activity?.activityType ?? '')
  const [quantity, setQuantity] = useState(activity ? String(activity.quantity) : '')
  const [unit, setUnit] = useState(activity?.unit ?? '')
  const [periodStart, setPeriodStart] = useState(activity?.periodStart ?? '')
  const [periodEnd, setPeriodEnd] = useState(activity?.periodEnd ?? '')
  const [dataSource, setDataSource] = useState(activity?.dataSource ?? '')
  const [evidenceRef, setEvidenceRef] = useState(activity?.evidenceRef ?? '')
  const [dataQuality, setDataQuality] = useState<DataQuality>(activity?.dataQuality ?? 'MEASURED')
  const [tier, setTier] = useState(activity ? String(activity.dataQualityTier) : '')
  const [uncertainty, setUncertainty] = useState(
    activity?.uncertaintyPercent === null || activity?.uncertaintyPercent === undefined
      ? ''
      : String(activity.uncertaintyPercent),
  )
  const [reason, setReason] = useState('')
  const [note, setNote] = useState(activity?.note ?? '')

  const [clientErrors, setClientErrors] = useState<Record<string, string> | undefined>()

  const errors = clientErrors ?? fieldErrors(mutation.error)
  const generalError = mutation.isError && !errors ? problemDetail(mutation.error) : undefined

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const invalid = collectErrors({
      quantity: checkNumber(quantity, { label: 'Quantity', positive: true, required: true }),
      uncertaintyPercent: checkNumber(uncertainty, { label: 'Uncertainty', min: 0, max: 100 }),
    })
    setClientErrors(invalid)
    if (invalid) return
    const input = {
      facilityId,
      activityType,
      quantity: Number(quantity),
      unit,
      periodStart,
      periodEnd: periodEnd === '' ? periodStart : periodEnd,
      dataSource: dataSource.trim() === '' ? undefined : dataSource,
      evidenceRef: evidenceRef.trim() === '' ? undefined : evidenceRef,
      dataQuality,
      note: note.trim() === '' ? undefined : note,
      dataQualityTier: tier === '' ? undefined : Number(tier),
      uncertaintyPercent: uncertainty.trim() === '' ? undefined : Number(uncertainty),
    }
    if (activity) {
      update.mutate(
        { id: activity.id, input: { ...input, reason: reason.trim() } },
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
          <UnitField
            value={unit}
            onChange={setUnit}
            error={errors?.unit}
            units={unitsQuery.data ?? []}
            loading={unitsQuery.isPending}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="Period start"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            value={periodStart}
            onChange={(event) => setPeriodStart(event.target.value)}
            error={errors?.periodStart}
            hint="The period the quantity covers, not the invoice date."
            required
          />
          <InputField
            label="Period end"
            type="date"
            min={periodStart || undefined}
            max={new Date().toISOString().slice(0, 10)}
            value={periodEnd}
            onChange={(event) => setPeriodEnd(event.target.value)}
            error={errors?.periodEnd}
            hint="Same as the start for a single reading."
          />
        </div>
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
        <div className="grid grid-cols-2 gap-3">
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
          <SelectField
            label="Quality tier"
            value={tier}
            onChange={(event) => setTier(event.target.value)}
            error={errors?.dataQualityTier}
            hint="1 is metered primary data, 5 an assumption. Blank follows the method."
          >
            <option value="">Follow the method</option>
            {Object.entries(tierLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {value}: {label}
              </option>
            ))}
          </SelectField>
        </div>
        <InputField
          label="Uncertainty, ± % (optional)"
          type="number"
          min="0"
          step="0.1"
          value={uncertainty}
          onChange={(event) => setUncertainty(event.target.value)}
          error={errors?.uncertaintyPercent}
          hint="The report weights it by emissions into the uncertainty statement."
        />
        <InputField
          label="Note (optional)"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          error={errors?.note}
        />
        {activity && (
          <InputField
            label="Reason for the correction"
            placeholder="Dispensing log reconciled with the supplier invoice"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            error={errors?.reason}
            hint="Recorded with the old and new values in the record's history."
            minLength={5}
            maxLength={500}
            required
          />
        )}
        {generalError && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {generalError}
          </p>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            busy={mutation.isPending}
            disabled={activity !== undefined && reason.trim().length < 5}
          >
            {activity ? 'Save correction' : 'Record'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

/**
 * Records the fact in its native unit: a dimension-grouped picker of convertible
 * units, with a "Custom unit…" escape hatch for anything the registry doesn't
 * cover (custom units only match a factor of the identical string and never
 * auto-convert). Falls back to a plain input while the registry loads.
 */
function UnitField({
  value,
  onChange,
  error,
  units,
  loading,
}: {
  value: string
  onChange: (unit: string) => void
  error?: string
  units: Unit[]
  loading: boolean
}) {
  // 'auto' defers to the value: an existing unit the registry doesn't recognize
  // is treated as custom until the user explicitly picks a mode.
  const [mode, setMode] = useState<'auto' | 'list' | 'custom'>('auto')

  if (loading) {
    return (
      <InputField
        label="Unit"
        placeholder="litre, kWh, km…"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        error={error}
        required
      />
    )
  }

  const isCustom = mode === 'custom' || (mode === 'auto' && value !== '' && !findUnit(units, value))

  if (isCustom) {
    return (
      <div className="flex flex-col gap-1">
        <InputField
          label="Unit"
          placeholder="custom unit"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          error={error}
          hint="An unregistered unit only matches a factor in the identical unit. Define it under Units as a multiple of a registered unit and it converts."
          required
        />
        <button
          type="button"
          className="self-start text-xs text-link hover:underline"
          onClick={() => {
            setMode('list')
            onChange('')
          }}
        >
          Choose from the list instead
        </button>
      </div>
    )
  }

  return (
    <SelectField
      label="Unit"
      value={value}
      error={error}
      required
      onChange={(event) => {
        const next = event.target.value
        if (next === CUSTOM_UNIT) {
          setMode('custom')
          onChange('')
        } else {
          setMode('list')
          onChange(next)
        }
      }}
    >
      <option value="">Select unit…</option>
      {groupUnits(units).map((group) => (
        <optgroup key={group.dimension} label={group.label}>
          {group.units.map((unit) => (
            <option key={unit.code} value={unit.code}>
              {unit.label} ({unit.code}){unit.definition ? `, ${unit.definition}` : ''}
            </option>
          ))}
        </optgroup>
      ))}
      <option value={CUSTOM_UNIT}>Unregistered unit…</option>
    </SelectField>
  )
}
