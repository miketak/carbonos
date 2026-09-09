import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { InputField, SelectField } from '../../../components/Field'
import { Modal } from '../../../components/Modal'
import { fieldErrors, problemDetail } from '../../../lib/api'
import { relationshipShortLabels } from '../format'
import { useCreateFacility, useEntitiesQuery, useUpdateFacility } from '../useGhg'
import type { Facility } from '../api'

interface FacilityFormModalProps {
  organizationId: string
  facility?: Facility
  onClose: () => void
  onSaved: (message: string) => void
}

/** Create or edit a facility: a site under one of the organization's legal entities (spec 03.1). */
export function FacilityFormModal({
  organizationId,
  facility,
  onClose,
  onSaved,
}: FacilityFormModalProps) {
  const create = useCreateFacility(organizationId)
  const update = useUpdateFacility(organizationId)
  const entitiesQuery = useEntitiesQuery(organizationId)
  const mutation = facility ? update : create

  const [name, setName] = useState(facility?.name ?? '')
  const [location, setLocation] = useState(facility?.location ?? '')
  const [country, setCountry] = useState(facility?.country ?? '')
  // '' means "not chosen yet": the reporting company once the entities load
  const [entityId, setEntityId] = useState(facility?.entityId ?? '')

  const entities = entitiesQuery.data ?? []
  const reportingCompany = entities.find((entity) => entity.reportingCompany)
  const selectedEntityId = entityId || reportingCompany?.id || ''

  const errors = fieldErrors(mutation.error)
  const generalError = mutation.isError && !errors ? problemDetail(mutation.error) : undefined

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const input = {
      name,
      location,
      ...(country.trim() !== '' ? { country: country.trim().toUpperCase() } : {}),
      entityId: selectedEntityId || undefined,
    }
    const handlers = {
      onSuccess: () => onSaved(`${name.trim()} ${facility ? 'updated' : 'added'}.`),
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
          label="Country (optional)"
          placeholder="GH"
          maxLength={2}
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          error={errors?.country}
          hint="ISO 3166-1 alpha-2 code, for the report's country breakdown."
        />
        <SelectField
          label="Legal entity"
          value={selectedEntityId}
          onChange={(event) => setEntityId(event.target.value)}
          error={errors?.entityId}
          hint="Ownership and control facts live on the entity. Add entities under Legal entities."
        >
          {entities.map((entity) => (
            <option key={entity.id} value={entity.id}>
              {entity.name} ({relationshipShortLabels[entity.relationshipType]})
            </option>
          ))}
        </SelectField>
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
