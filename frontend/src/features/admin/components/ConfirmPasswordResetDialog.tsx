import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import type { User } from '../api'

interface ConfirmPasswordResetDialogProps {
  user: User
  busy: boolean
  onConfirm: () => void
  onClose: () => void
}

/** Spec 01.9: the administrator sends a link; no password passes through their hands. */
export function ConfirmPasswordResetDialog({
  user,
  busy,
  onConfirm,
  onClose,
}: ConfirmPasswordResetDialogProps) {
  return (
    <Modal title={`Reset the password of ${user.displayName}?`} onClose={onClose}>
      <p className="text-sm text-ink-muted">
        CarbonOS emails <strong>{user.email}</strong> a link to choose a new password. The link is
        valid for 1 hour and works once. The current password keeps working until the link is used.
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button busy={busy} onClick={onConfirm}>
          Send reset link
        </Button>
      </div>
    </Modal>
  )
}
