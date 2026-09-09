import { useState } from 'react'
import { Button } from '../../../components/Button'
import { InputField } from '../../../components/Field'
import { Modal } from '../../../components/Modal'

/**
 * Confirms a removal and collects the reason it is recorded with (spec 04.4):
 * facts, facilities and entities are never deleted outright; they stay as
 * tombstones with who removed them, when and why.
 */
export function RemoveDialog({
  title,
  description,
  busy,
  onConfirm,
  onClose,
}: {
  title: string
  description: string
  busy: boolean
  onConfirm: (reason: string) => void
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const valid = reason.trim().length >= 5
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-ink-muted">{description}</p>
      <div className="mt-4">
        <InputField
          label="Reason"
          placeholder="Why it is removed, for the audit trail"
          value={reason}
          minLength={5}
          maxLength={500}
          required
          onChange={(event) => setReason(event.target.value)}
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          className="bg-red-600 hover:bg-red-700"
          disabled={!valid}
          busy={busy}
          onClick={() => onConfirm(reason.trim())}
        >
          Remove
        </Button>
      </div>
    </Modal>
  )
}
