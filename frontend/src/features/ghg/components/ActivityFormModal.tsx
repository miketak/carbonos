import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { InputField, SelectField } from '../../../components/Field'
import { Modal } from '../../../components/Modal'
import { fieldErrors, problemDetail } from '../../../lib/api'
import { scopeLabels } from '../format'
import { useCreateActivity, useEmissionFactorsQuery } from '../useGhg'
import type { Facility } from '../api'

interface ActivityFormModalProps {
  organizationId: string
  facilities: Facility[]
  onClose: () => void
  onSaved: (message: string) => void
}

/** Record one quantity of activity data against a facility and a factor. */
export function ActivityFormModal({
  organizationId,
  facilities,
  onClose,
  onSaved,
}: ActivityFormModalProps) {
  const factorsQuery = useEmissionFactorsQuery()
  const create = useCreateActivity(organizationId)

  const [facilityId, setFacilityId] = useState(facilities[0]?.id ?? '')
  const [factorId, setFactorId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [activityDate, setActivityDate] = useState('')
  const [note, setNote] = useState('')

  const factors = factorsQuery.data
  const selectedFactor = factors?.find((factor) => factor.id === factorId)

  const errors = fieldErrors(create.error)
  const generalError = create.isError && !errors ? problemDetail(create.error) : undefined

  const submit = (event: FormEvent) => {
    event.preventDefault()
    create.mutate(
      {
        facilityId,
        emissionFactorId: factorId,
        quantity: Number(quantity),
        activityDate,
        note: note.trim() === '' ? undefined : note.trim(),
      },
      { onSuccess: () => onSaved('Activity recorded.') },
    )
  }

  return (
    <Modal title="Record activity" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <SelectField
          label="Facility"
          value={facilityId}
          onChange={(event) => setFacilityId(event.target.value)}
          error={errors?.facilityId}
          required
        >
          {facilities.map((facility) => (
            <option key={facility.id} value={facility.id}>
              {facility.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Emission source"
          value={factorId}
          onChange={(event) => setFactorId(event.target.value)}
          error={errors?.emissionFactorId}
          required
        >
          <option value="" disabled>
            {factorsQuery.isPending ? 'Loading factor library…' : 'Choose a factor'}
          </option>
          {factors?.map((factor) => (
            <option key={factor.id} value={factor.id}>
              {scopeLabels[factor.scope]} · {factor.name} ({factor.unit})
            </option>
          ))}
        </SelectField>
        <InputField
          label={selectedFactor ? `Quantity (${selectedFactor.unit})` : 'Quantity'}
          type="number"
          min="0"
          step="any"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          error={errors?.quantity}
          hint={
            selectedFactor
              ? `${selectedFactor.kgCo2ePerUnit} kg CO₂e per ${selectedFactor.unit} — ${selectedFactor.source}`
              : undefined
          }
          required
        />
        <InputField
          label="Date"
          type="date"
          value={activityDate}
          onChange={(event) => setActivityDate(event.target.value)}
          error={errors?.activityDate}
          required
        />
        <InputField
          label="Note (optional)"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          error={errors?.note}
          placeholder="Q1 generator fuel"
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
          <Button type="submit" busy={create.isPending}>
            Record activity
          </Button>
        </div>
      </form>
    </Modal>
  )
}
