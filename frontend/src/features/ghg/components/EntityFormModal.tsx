import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { InputField, SelectField } from '../../../components/Field'
import { Modal } from '../../../components/Modal'
import { fieldErrors, problemDetail } from '../../../lib/api'
import { relationshipLabels } from '../format'
import { useCreateEntity, useEntitiesQuery, useUpdateEntity } from '../useGhg'
import type { Entity, RelationshipType } from '../api'

interface EntityFormModalProps {
  organizationId: string
  entity?: Entity
  onClose: () => void
  onSaved: (message: string) => void
}

/**
 * Create or edit a legal entity: its Table 1 relationship type, economic
 * interest, the control fact for a franchise, and the parent the company
 * holds it through (spec 03.1, 03.3). The reporting company is the group's
 * own wholly owned operation by definition, so its form only renames.
 */
export function EntityFormModal({
  organizationId,
  entity,
  onClose,
  onSaved,
}: EntityFormModalProps) {
  const create = useCreateEntity(organizationId)
  const update = useUpdateEntity(organizationId)
  const entitiesQuery = useEntitiesQuery(organizationId)
  const mutation = entity ? update : create
  const reportingCompany = entity?.reportingCompany ?? false
  // a parent is any other entity of the organization; the reporting company holds everything directly
  const parents = (entitiesQuery.data ?? []).filter((candidate) => candidate.id !== entity?.id)

  const [name, setName] = useState(entity?.name ?? '')
  const [relationshipType, setRelationshipType] = useState<RelationshipType>(
    entity?.relationshipType ?? 'SUBSIDIARY',
  )
  const [controlledByCompany, setControlledByCompany] = useState(
    entity?.controlledByCompany ?? false,
  )
  const [parentEntityId, setParentEntityId] = useState(entity?.parentEntityId ?? '')
  const [economicInterest, setEconomicInterest] = useState(
    entity ? String(entity.economicInterestPercent) : '100',
  )
  const [legalOwnership, setLegalOwnership] = useState(
    entity?.legalOwnershipPercent === null || entity?.legalOwnershipPercent === undefined
      ? ''
      : String(entity.legalOwnershipPercent),
  )
  const [operatedByCompany, setOperatedByCompany] = useState(entity?.operatedByCompany ?? true)
  const [effectiveFrom, setEffectiveFrom] = useState(entity?.effectiveFrom ?? '')
  const [effectiveTo, setEffectiveTo] = useState(entity?.effectiveTo ?? '')
  const [jurisdiction, setJurisdiction] = useState(entity?.jurisdiction ?? '')
  const [controlDecision, setControlDecision] = useState<'' | 'true' | 'false'>(
    entity?.financialControlOverride === null || entity?.financialControlOverride === undefined
      ? ''
      : entity.financialControlOverride
        ? 'true'
        : 'false',
  )
  const [controlNote, setControlNote] = useState(entity?.controlNote ?? '')

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
      controlledByCompany: relationshipType === 'FRANCHISE' ? controlledByCompany : undefined,
      parentEntityId: parentEntityId === '' ? undefined : parentEntityId,
      effectiveFrom: effectiveFrom === '' ? undefined : effectiveFrom,
      effectiveTo: effectiveTo === '' ? undefined : effectiveTo,
      jurisdiction: jurisdiction.trim() === '' ? undefined : jurisdiction.trim().toUpperCase(),
      financialControlOverride:
        reportingCompany || controlDecision === '' ? undefined : controlDecision === 'true',
      controlNote: controlNote.trim() === '' ? undefined : controlNote.trim(),
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
            The reporting company is the group's own wholly owned operation by definition: 100%
            economic interest, operated by the company. Record other structures as separate
            entities.
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
            {relationshipType === 'FRANCHISE' && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={controlledByCompany}
                  onChange={(event) => setControlledByCompany(event.target.checked)}
                  className="size-4 accent-teal"
                />
                Financially controlled by the company
              </label>
            )}
            <SelectField
              label="Financial control"
              value={controlDecision}
              onChange={(event) => setControlDecision(event.target.value as '' | 'true' | 'false')}
              error={errors?.financialControlOverride}
              hint="Chapter 3: control is the ability to direct policies, not a percentage. A decision here overrides the Table 1 row under the financial-control approach."
            >
              <option value="">Follows the Table 1 row</option>
              <option value="true">
                Consolidated under financial control (IFRS 10), whatever the holding
              </option>
              <option value="false">Not financially controlled, whatever the holding</option>
            </SelectField>
            {controlDecision !== '' && (
              <InputField
                label="Basis of the decision"
                placeholder="Board control under the shareholders' agreement of 2023"
                value={controlNote}
                onChange={(event) => setControlNote(event.target.value)}
                error={errors?.controlNote}
                maxLength={500}
              />
            )}
            <SelectField
              label="Held through"
              value={parentEntityId}
              onChange={(event) => setParentEntityId(event.target.value)}
              error={errors?.parentEntityId}
              hint="The parent the company holds this entity through. Chapter 3 applies the consolidation policy at every level: the share is this row times the parent's."
            >
              <option value="">Held directly by the reporting company</option>
              {parents.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </SelectField>
          </>
        )}
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="Acquired on (optional)"
            type="date"
            value={effectiveFrom}
            onChange={(event) => setEffectiveFrom(event.target.value)}
            error={errors?.effectiveFrom}
            hint="Every inventory's membership window starts here."
          />
          <InputField
            label="Disposed of on (optional)"
            type="date"
            min={effectiveFrom || undefined}
            value={effectiveTo}
            onChange={(event) => setEffectiveTo(event.target.value)}
            error={errors?.effectiveTo}
          />
        </div>
        <InputField
          label="Jurisdiction (optional)"
          placeholder="GH"
          maxLength={2}
          value={jurisdiction}
          onChange={(event) => setJurisdiction(event.target.value)}
          error={errors?.jurisdiction}
          hint="ISO 3166-1 alpha-2 code of the country of incorporation."
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
            {entity ? 'Save changes' : 'Add entity'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
