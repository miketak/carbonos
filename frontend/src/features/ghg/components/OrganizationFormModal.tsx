import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { InputField, SelectField } from '../../../components/Field'
import { Modal } from '../../../components/Modal'
import { fieldErrors, problemDetail } from '../../../lib/api'
import { approachLabels } from '../format'
import { useCreateOrganization, useUpdateOrganization } from '../useGhg'
import type { ConsolidationApproach, Organization } from '../api'

interface OrganizationFormModalProps {
  organization?: Organization
  onClose: () => void
  onSaved: (message: string) => void
}

/** Create or edit a reporting organization. */
export function OrganizationFormModal({
  organization,
  onClose,
  onSaved,
}: OrganizationFormModalProps) {
  const create = useCreateOrganization()
  const update = useUpdateOrganization()
  const mutation = organization ? update : create

  const [name, setName] = useState(organization?.name ?? '')
  const [approach, setApproach] = useState<ConsolidationApproach>(
    organization?.consolidationApproach ?? 'OPERATIONAL_CONTROL',
  )

  const errors = fieldErrors(mutation.error)
  const generalError = mutation.isError && !errors ? problemDetail(mutation.error) : undefined

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const input = { name, consolidationApproach: approach }
    const handlers = {
      onSuccess: () => onSaved(`${name.trim()} ${organization ? 'updated' : 'created'}.`),
    }
    if (organization) update.mutate({ id: organization.id, input }, handlers)
    else create.mutate(input, handlers)
  }

  return (
    <Modal title={organization ? 'Edit organization' : 'New organization'} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <InputField
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors?.name}
          placeholder="Ecoriv Holdings"
          required
        />
        <SelectField
          label="Consolidation approach"
          value={approach}
          onChange={(event) => setApproach(event.target.value as ConsolidationApproach)}
          error={errors?.consolidationApproach}
          hint="How facility emissions roll up: by equity share, or all-or-nothing under control."
        >
          {Object.entries(approachLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
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
            {organization ? 'Save changes' : 'Create organization'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
