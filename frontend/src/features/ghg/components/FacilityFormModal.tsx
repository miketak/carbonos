import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { InputField, SelectField } from '../../../components/Field'
import { Modal } from '../../../components/Modal'
import { fieldErrors, problemDetail } from '../../../lib/api'
import { facilityTypeLabels, leaseLabels, relationshipShortLabels } from '../format'
import { useCreateFacility, useEntitiesQuery, useUpdateFacility } from '../useGhg'
import type { Facility, FacilityType, LeaseType } from '../api'

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
  const [gridRegion, setGridRegion] = useState(facility?.gridRegion ?? '')
  const [facilityType, setFacilityType] = useState<FacilityType | ''>(facility?.facilityType ?? '')
  const [leaseType, setLeaseType] = useState<LeaseType | ''>(facility?.leaseType ?? '')
  const [leaseFrom, setLeaseFrom] = useState(facility?.leaseFrom ?? '')
  const [leaseTo, setLeaseTo] = useState(facility?.leaseTo ?? '')
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
      gridRegion: gridRegion.trim() === '' ? undefined : gridRegion.trim().toUpperCase(),
      facilityType: facilityType === '' ? undefined : facilityType,
      leaseType: leaseType === '' ? undefined : leaseType,
      leaseFrom: leaseType === '' || leaseFrom === '' ? undefined : leaseFrom,
      leaseTo: leaseType === '' || leaseTo === '' ? undefined : leaseTo,
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
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="Grid region (optional)"
            placeholder="GHA or US-CAMX"
            maxLength={40}
            value={gridRegion}
            onChange={(event) => setGridRegion(event.target.value)}
            error={errors?.gridRegion}
            hint="The grid the site draws from; its location-based factor is suggested. Blank follows the country."
          />
          <SelectField
            label="Facility type (optional)"
            value={facilityType}
            onChange={(event) => setFacilityType(event.target.value as FacilityType | '')}
            error={errors?.facilityType}
          >
            <option value="">Not stated</option>
            {Object.entries(facilityTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
        </div>
        <SelectField
          label="Lease (optional)"
          value={leaseType}
          onChange={(event) => setLeaseType(event.target.value as LeaseType | '')}
          error={errors?.leaseType}
          hint="Records at a leased site inherit the lease; Appendix F sets their scope under each approach."
        >
          <option value="">Owned, not leased</option>
          {Object.entries(leaseLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        {leaseType !== '' && (
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Lease from (optional)"
              type="date"
              value={leaseFrom}
              onChange={(event) => setLeaseFrom(event.target.value)}
              error={errors?.leaseFrom}
            />
            <InputField
              label="Lease until (optional)"
              type="date"
              min={leaseFrom || undefined}
              value={leaseTo}
              onChange={(event) => setLeaseTo(event.target.value)}
              error={errors?.leaseTo}
            />
          </div>
        )}
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
