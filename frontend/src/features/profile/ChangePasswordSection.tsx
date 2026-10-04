import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '../../components/Button'
import { InputField } from '../../components/Field'
import { useToast } from '../../components/toast'
import { ApiError, fieldErrors, problemDetail } from '../../lib/api'
import { PASSWORD_RULE, meetsPasswordPolicy } from '../auth/passwordApi'
import { changePassword } from './api'

/**
 * Spec 01.9: the signed-in user changes their own password. The current one
 * proves it is the holder and not just an open session; the server ends every
 * other session of the account.
 */
export function ChangePasswordSection() {
  const toast = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [local, setLocal] = useState<Record<string, string>>({})

  const change = useMutation({
    mutationFn: () => changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      setCurrentPassword('')
      setNewPassword('')
      setConfirm('')
      toast('Password changed. Your other sessions are signed out.')
    },
  })

  const server = fieldErrors(change.error)
  const banner =
    change.error instanceof ApiError && change.error.status === 429
      ? problemDetail(change.error)
      : change.isError && !server
        ? (problemDetail(change.error) ?? 'Something went wrong. Please try again.')
        : undefined

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const errors: Record<string, string> = {}
    if (currentPassword === '') errors.currentPassword = 'Enter your current password.'
    if (!meetsPasswordPolicy(newPassword)) errors.newPassword = PASSWORD_RULE
    else if (newPassword !== confirm) errors.confirm = 'Passwords do not match.'
    setLocal(errors)
    if (Object.keys(errors).length === 0) change.mutate()
  }

  return (
    <section
      aria-labelledby="change-password-heading"
      className="mt-10 border-t border-hairline pt-8"
    >
      <h2 id="change-password-heading" className="text-lg">
        Change password
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        You stay signed in here; every other session of your account is signed out.
      </p>
      <form noValidate onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
        <InputField
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          error={local.currentPassword ?? server?.currentPassword}
          required
        />
        <InputField
          label="New password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          error={local.newPassword ?? server?.newPassword}
          hint={PASSWORD_RULE}
          required
        />
        <InputField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          error={local.confirm}
          required
        />
        {banner && (
          <p role="alert" className="text-sm font-medium text-danger">
            {banner}
          </p>
        )}
        <Button type="submit" busy={change.isPending} className="self-start">
          Change password
        </Button>
      </form>
    </section>
  )
}
