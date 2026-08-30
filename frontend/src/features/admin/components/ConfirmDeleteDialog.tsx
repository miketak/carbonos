import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import type { User } from '../api'

interface ConfirmDeleteDialogProps {
  user: User
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDeleteDialog({ user, onConfirm, onClose }: ConfirmDeleteDialogProps) {
  return (
    <Modal title={`Delete ${user.displayName}?`} onClose={onClose}>
      <p className="text-sm text-ink-muted">
        This permanently removes <strong>{user.email}</strong>. If you only want to block access,
        disable the account instead.
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Delete user
        </Button>
      </div>
    </Modal>
  )
}
