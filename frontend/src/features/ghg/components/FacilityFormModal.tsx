import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { InputField } from '../../../components/Field'
import { Modal } from '../../../components/Modal'
import { fieldErrors, problemDetail } from '../../../lib/api'
import { useCreateFacility, useUpdateFacility } from '../useGhg'
import type { Facility } from '../api'

interface FacilityFormModalProps {
  organizationId: string
  facility?: Facility
  onClose: () => void
  onSaved: (message: string) => void
}

/** Create or edit a facility inside the organizational boundary. */
export function FacilityFormModal({
  organizationId,
  facility,
  onClose,
  onSaved,
}: FacilityFormModalProps) {
  const create = useCreateFacility(organizationId)
  const update = useUpdateFacility(organizationId)
  const mutation = facility ? update : create

  const [name, setName] = useState(facility?.name ?? '')
  const [location, setLocation] = useState(facility?.location ?? '')
  const [equityShare, setEquityShare] = useState(
    facility ? String(facility.equitySharePercent) : '100',
  )
  const [controlled, setControlled] = useState(facility?.controlled ?? true)

  const errors = fieldErrors(mutation.error)
  const generalError = mutation.isError && !errors ? problemDetail(mutation.error) : undefined

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const input = {
      name,
      location,
      equitySharePercent: Number(equityShare),
      controlled,
    }
    const handlers = {
      onSuccess: () => onSaved(`${name.trim()} ${facility ? 'updated' : 'added to the boundary'}.`),
    }
    if (facility) update.mutate({ id: facility.id, input }, handlers)
    else create.mutate(input, handlers)
  }

  return (
    <Modal title={facility ? 'Edit facility' : 'Add facility'} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <InputField
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors?.name}
          placeholder="Accra HQ"
          required
        />
        <InputField
          label="Location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          error={errors?.location}
          placeholder="Accra, Ghana"
          required
        />
        <InputField
          label="Equity share (%)"
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={equityShare}
          onChange={(event) => setEquityShare(event.target.value)}
          error={errors?.equitySharePercent}
          hint="Ownership percentage; used when the approach is equity share."
          required
        />
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={controlled}
            onChange={(event) => setControlled(event.target.checked)}
            className="size-4 accent-teal"
          />
          Under the organization's control
        </label>
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
            {facility ? 'Save changes' : 'Add facility'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
