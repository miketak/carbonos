import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { InputField } from '../../../components/Field'
import { Modal } from '../../../components/Modal'
import { fieldErrors, problemDetail } from '../../../lib/api'
import { useCreateOrganization, useUpdateOrganization } from '../useGhg'
import type { Organization } from '../api'

interface OrganizationFormModalProps {
  organization?: Organization
  onClose: () => void
  onSaved: (message: string) => void
}

/** Create or edit a reporting organization. Accounting choices live on its inventories. */
export function OrganizationFormModal({
  organization,
  onClose,
  onSaved,
}: OrganizationFormModalProps) {
  const create = useCreateOrganization()
  const update = useUpdateOrganization()
  const mutation = organization ? update : create

  const [name, setName] = useState(organization?.name ?? '')
  const [address, setAddress] = useState(organization?.address ?? '')
  const [contact, setContact] = useState(organization?.contact ?? '')

  const errors = fieldErrors(mutation.error)
  const generalError = mutation.isError && !errors ? problemDetail(mutation.error) : undefined

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const input = {
      name,
      ...(address.trim() !== '' ? { address } : {}),
      ...(contact.trim() !== '' ? { contact } : {}),
    }
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
        <InputField
          label="Address (optional)"
          placeholder="12 Liberation Road, Accra"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          error={errors?.address}
          hint="Printed in the report header as the reporting entity's address."
        />
        <InputField
          label="Contact (optional)"
          placeholder="sustainability@example.com"
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          error={errors?.contact}
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
            {organization ? 'Save changes' : 'Create organization'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
