import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { InputField, TextAreaField } from '../../../components/Field'
import { Modal } from '../../../components/Modal'
import { refusalMessage } from '../../../lib/api'
import { useDeleteOrganization, useInventoriesQuery } from '../useGhg'
import type { Inventory, Organization } from '../api'

/** Why an inventory keeps the organization on file (spec 01.3). */
function blockingLabel(inventory: Inventory): string {
  if (inventory.status === 'PUBLISHED') return 'Published'
  if (inventory.status === 'FINAL') return 'Final'
  return 'Final run designated'
}

function blocks(inventory: Inventory): boolean {
  return (
    inventory.status === 'PUBLISHED' ||
    inventory.status === 'FINAL' ||
    inventory.finalRunId !== null
  )
}

/**
 * Removing an organization (spec 01.3). A published or final record keeps it
 * on file and the dialog says so; otherwise the owner types the name exactly
 * and gives a reason, and the organization is removed with a tombstone.
 */
export function DeleteOrganizationDialog({
  organization,
  onClose,
  onDeleted,
}: {
  organization: Organization
  onClose: () => void
  onDeleted: (message: string) => void
}) {
  const inventoriesQuery = useInventoriesQuery(organization.id)
  const remove = useDeleteOrganization()
  const [typedName, setTypedName] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const blockers = (inventoriesQuery.data ?? []).filter(blocks)
  const nameMatches = typedName.trim() === organization.name
  const reasonGiven = reason.trim().length >= 10
  const ready = blockers.length === 0 && nameMatches && reasonGiven

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!ready) return
    setError(null)
    remove.mutate(
      { id: organization.id, input: { name: typedName.trim(), reason: reason.trim() } },
      {
        onSuccess: () => onDeleted(`${organization.name} deleted.`),
        onError: (failure) => setError(refusalMessage(failure, organization.myRole)),
      },
    )
  }

  return (
    <Modal title="Delete organization" onClose={onClose}>
      <form onSubmit={submit} noValidate>
        {blockers.length > 0 ? (
          <>
            <p className="text-sm text-ink-muted">
              <strong>{organization.name}</strong> has records the company has issued:
            </p>
            <ul className="mt-2 flex flex-col gap-1 text-sm font-medium text-dark-teal">
              {blockers.map((inventory) => (
                <li key={inventory.id}>
                  {inventory.name}: {blockingLabel(inventory)}
                </li>
              ))}
            </ul>
            <p role="alert" className="mt-3 text-sm font-medium text-red-600">
              Publish records are kept: withdraw the final designation or supersede the published
              inventory first.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-ink-muted">
              <strong>{organization.name}</strong> is removed from every list and every URL under it
              returns not found. The record of who removed it, when and why is kept, and its
              facilities, activity data and runs stay in the database.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <InputField
                label={`Type ${organization.name} to confirm`}
                value={typedName}
                onChange={(event) => setTypedName(event.target.value)}
                autoComplete="off"
              />
              <TextAreaField
                label="Reason"
                hint="At least 10 characters; it is kept with the organization."
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </div>
          </>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-600">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" disabled={!ready} busy={remove.isPending}>
            Delete
          </Button>
        </div>
      </form>
    </Modal>
  )
}
