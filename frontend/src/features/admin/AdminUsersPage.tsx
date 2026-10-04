import { useState } from 'react'
import { Button } from '../../components/Button'
import { PageHeader } from '../../components/PageHeader'
import { Panel } from '../../components/Panel'
import { useToast } from '../../components/toast'
import { problemDetail } from '../../lib/api'
import { useSession } from '../auth/useSession'
import { ConfirmDeleteDialog } from './components/ConfirmDeleteDialog'
import { ConfirmPasswordResetDialog } from './components/ConfirmPasswordResetDialog'
import { UserFormModal } from './components/UserFormModal'
import { UserTable } from './components/UserTable'
import { useDeleteUser, useSendPasswordReset, useUpdateUser, useUsersQuery } from './useUsers'
import type { Role, Status } from '../auth/api'
import type { User } from './api'

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit'; user: User }
  | { kind: 'delete'; user: User }
  | { kind: 'reset'; user: User }
  | null

const crumbs = [{ label: 'Administration' }, { label: 'Users' }]

export function AdminUsersPage() {
  const session = useSession()
  const usersQuery = useUsersQuery()
  const deleteUser = useDeleteUser()
  const updateUser = useUpdateUser()
  const sendReset = useSendPasswordReset()
  const toast = useToast()
  const [dialog, setDialog] = useState<Dialog>(null)

  const currentUserId = session.data?.id ?? ''

  const toggleStatus = (user: User) => {
    const nextStatus: Status = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    const role: Role = user.role
    updateUser.mutate(
      { id: user.id, input: { displayName: user.displayName, role, status: nextStatus } },
      {
        onSuccess: () =>
          toast(`${user.displayName} ${nextStatus === 'ACTIVE' ? 'enabled' : 'disabled'}.`),
        onError: (error) =>
          toast(problemDetail(error) ?? `Could not update ${user.displayName}.`, 'error'),
      },
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        crumbs={crumbs}
        title="Users"
        subtitle={
          usersQuery.data
            ? `${usersQuery.data.length} team member${usersQuery.data.length === 1 ? '' : 's'}`
            : 'Manage who can access CarbonOS'
        }
        actions={<Button onClick={() => setDialog({ kind: 'create' })}>Add user</Button>}
      />

      <Panel>
        <UserTable
          users={usersQuery.data}
          isPending={usersQuery.isPending}
          currentUserId={currentUserId}
          onEdit={(user) => setDialog({ kind: 'edit', user })}
          onToggleStatus={(user) => toggleStatus(user)}
          onResetPassword={(user) => setDialog({ kind: 'reset', user })}
          onDelete={(user) => setDialog({ kind: 'delete', user })}
        />
      </Panel>

      {dialog?.kind === 'create' && (
        <UserFormModal
          onClose={() => setDialog(null)}
          onSaved={(message) => {
            setDialog(null)
            toast(message)
          }}
        />
      )}
      {dialog?.kind === 'edit' && (
        <UserFormModal
          user={dialog.user}
          onClose={() => setDialog(null)}
          onSaved={(message) => {
            setDialog(null)
            toast(message)
          }}
        />
      )}
      {dialog?.kind === 'reset' && (
        <ConfirmPasswordResetDialog
          user={dialog.user}
          busy={sendReset.isPending}
          onClose={() => setDialog(null)}
          onConfirm={() => {
            const { user } = dialog
            sendReset.mutate(user.id, {
              onSuccess: () => {
                setDialog(null)
                toast(`Reset link sent to ${user.email}.`)
              },
              onError: (error) => {
                setDialog(null)
                toast(
                  problemDetail(error) ?? `Could not send a reset link to ${user.displayName}.`,
                  'error',
                )
              },
            })
          }}
        />
      )}
      {dialog?.kind === 'delete' && (
        <ConfirmDeleteDialog
          user={dialog.user}
          onClose={() => setDialog(null)}
          onConfirm={() => {
            const { user } = dialog
            setDialog(null)
            deleteUser.mutate(user.id, {
              onSuccess: () => toast(`${user.displayName} deleted.`),
              onError: (error) =>
                toast(problemDetail(error) ?? `Could not delete ${user.displayName}.`, 'error'),
            })
          }}
        />
      )}
    </div>
  )
}
