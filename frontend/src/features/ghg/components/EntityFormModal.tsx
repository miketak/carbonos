import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { InputField, SelectField } from '../../../components/Field'
import { Modal } from '../../../components/Modal'
import { fieldErrors, problemDetail } from '../../../lib/api'
import { relationshipLabels } from '../format'
import { useCreateEntity, useUpdateEntity } from '../useGhg'
import type { Entity, RelationshipType } from '../api'

interface EntityFormModalProps {
  organizationId: string
  entity?: Entity
  onClose: () => void
  onSaved: (message: string) => void
}

/**
 * Create or edit a legal entity: its Table 1 relationship type and economic
 * interest (spec 03.1). The reporting company is wholly owned by definition,
 * so its form only renames.
 */
export function EntityFormModal({
  organizationId,
  entity,
  onClose,
  onSaved,
}: EntityFormModalProps) {
  const create = useCreateEntity(organizationId)
  const update = useUpdateEntity(organizationId)
  const mutation = entity ? update : create
  const reportingCompany = entity?.reportingCompany ?? false

  const [name, setName] = useState(entity?.name ?? '')
  const [relationshipType, setRelationshipType] = useState<RelationshipType>(
    entity?.relationshipType ?? 'WHOLLY_OWNED',
  )
  const [economicInterest, setEconomicInterest] = useState(
    entity ? String(entity.economicInterestPercent) : '100',
  )
  const [legalOwnership, setLegalOwnership] = useState(
    entity?.legalOwnershipPercent === null || entity?.legalOwnershipPercent === undefined
      ? ''
      : String(entity.legalOwnershipPercent),
  )
  const [operatedByCompany, setOperatedByCompany] = useState(entity?.operatedByCompany ?? true)

  const errors = fieldErrors(mutation.error)
  const generalError = mutation.isError && !errors ? problemDetail(mutation.error) : undefined

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const input = {
      name,
      relationshipType,
      economicInterestPercent: Number(economicInterest),
      legalOwnershipPercent: legalOwnership.trim() === '' ? undefined : Number(legalOwnership),
      operatedByCompany,
    }
    const handlers = {
      onSuccess: () => onSaved(`${name.trim()} ${entity ? 'updated' : 'added'}.`),
    }
    if (entity) update.mutate({ id: entity.id, input }, handlers)
    else create.mutate(input, handlers)
  }

  return (
    <Modal title={entity ? 'Edit legal entity' : 'Add legal entity'} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <InputField
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors?.name}
          placeholder="Tarkwa Gold JV Ltd"
          required
        />
        {reportingCompany ? (
          <p className="text-xs text-ink-muted">
            The reporting company is a wholly owned operation by definition: 100% economic interest,
            operated by the company. Record other structures as separate entities.
          </p>
        ) : (
          <>
            <SelectField
              label="Relationship"
              value={relationshipType}
              onChange={(event) => setRelationshipType(event.target.value as RelationshipType)}
              error={errors?.relationshipType}
              hint="Table 1 of the GHG Protocol: the relationship and the approach together set the accounting share."
            >
              {Object.entries(relationshipLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectField>
            <InputField
              label="Economic interest (%)"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={economicInterest}
              onChange={(event) => setEconomicInterest(event.target.value)}
              error={errors?.economicInterestPercent}
              hint="The share of risks and rewards; what equity share accounts for."
              required
            />
            <InputField
              label="Legal ownership (%)"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={legalOwnership}
              onChange={(event) => setLegalOwnership(event.target.value)}
              error={errors?.legalOwnershipPercent}
              hint="For disclosure; equity share follows economic interest, where substance overrides form."
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={operatedByCompany}
                onChange={(event) => setOperatedByCompany(event.target.checked)}
                className="size-4 accent-teal"
              />
              Operated by the company
            </label>
          </>
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
          <Button type="submit" busy={mutation.isPending}>
            {entity ? 'Save changes' : 'Add entity'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
