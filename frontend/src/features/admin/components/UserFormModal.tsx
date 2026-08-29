import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { InputField, SelectField } from '../../../components/Field'
import { Modal } from '../../../components/Modal'
import { fieldErrors, problemDetail } from '../../../lib/api'
import { useCreateUser, useUpdateUser } from '../useUsers'
import type { Role, Status } from '../../auth/api'
import type { User } from '../api'

interface UserFormModalProps {
  /** Absent → create mode; present → edit mode. */
  user?: User
  onClose: () => void
  onSaved: (message: string) => void
}

export function UserFormModal({ user, onClose, onSaved }: UserFormModalProps) {
  const isEdit = user !== undefined
  const [email, setEmail] = useState(user?.email ?? '')
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [role, setRole] = useState<Role>(user?.role ?? 'MEMBER')
  const [status, setStatus] = useState<Status>(user?.status ?? 'ACTIVE')
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const create = useCreateUser()
  const update = useUpdateUser()
  const mutation = isEdit ? update : create

  const serverErrors = fieldErrors(mutation.error) ?? {}
  const conflictMessage =
    mutation.error && !mutation.isPending ? problemDetail(mutation.error) : undefined

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (isEdit) {
      update.mutate(
        { id: user.id, input: { displayName, role, status } },
        { onSuccess: () => onSaved(`${displayName} updated.`) },
      )
    } else {
      create.mutate(
        { email, displayName, role, temporaryPassword },
        { onSuccess: () => onSaved(`${displayName} added.`) },
      )
    }
  }

  return (
    <Modal title={isEdit ? `Edit ${user.displayName}` : 'Add user'} onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <InputField
          label="Email"
          type="email"
          name="email"
          required
          disabled={isEdit}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={serverErrors.email}
          hint={isEdit ? 'Email cannot be changed.' : undefined}
        />
        <InputField
          label="Display name"
          name="displayName"
          required
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          error={serverErrors.displayName}
        />
        <SelectField
          label="Role"
          name="role"
          value={role}
          onChange={(event) => setRole(event.target.value as Role)}
          error={serverErrors.role}
        >
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </SelectField>
        {isEdit && (
          <SelectField
            label="Status"
            name="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as Status)}
            error={serverErrors.status}
          >
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
          </SelectField>
        )}
        {!isEdit && (
          <div className="relative">
            <InputField
              label="Temporary password"
              type={showPassword ? 'text' : 'password'}
              name="temporaryPassword"
              required
              minLength={8}
              value={temporaryPassword}
              onChange={(event) => setTemporaryPassword(event.target.value)}
              error={serverErrors.temporaryPassword}
              hint="Share it with the user out of band; they should change it later."
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-0 right-0 text-xs font-medium text-teal hover:text-bright-teal"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        )}
        {conflictMessage && Object.keys(serverErrors).length === 0 && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {conflictMessage}
          </p>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" busy={mutation.isPending}>
            {isEdit ? 'Save changes' : 'Add user'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
