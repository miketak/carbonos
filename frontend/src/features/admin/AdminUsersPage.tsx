import { useState } from 'react'
import { Button } from '../../components/Button'
import { GlassCard } from '../../components/GlassCard'
import { useToast } from '../../components/toast'
import { problemDetail } from '../../lib/api'
import { useSession } from '../auth/useSession'
import { useLogout } from '../auth/useLogout'
import { ConfirmDeleteDialog } from './components/ConfirmDeleteDialog'
import { UserFormModal } from './components/UserFormModal'
import { UserTable } from './components/UserTable'
import { useDeleteUser, useUpdateUser, useUsersQuery } from './useUsers'
import type { Role, Status } from '../auth/api'
import type { User } from './api'

type Dialog =
  { kind: 'create' } | { kind: 'edit'; user: User } | { kind: 'delete'; user: User } | null

export function AdminUsersPage() {
  const session = useSession()
  const signOut = useLogout()
  const usersQuery = useUsersQuery()
  const deleteUser = useDeleteUser()
  const updateUser = useUpdateUser()
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
    <div className="min-h-screen bg-gradient-to-br from-soft-mint via-soft-mint to-bright-teal/15">
      <header className="sticky top-0 z-40 border-b border-white/50 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <p className="bg-gradient-to-r from-teal to-accent-green bg-clip-text text-lg font-bold text-transparent">
            ECORIV <span className="text-dark-teal">CarbonOS</span>
          </p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-dark-teal/70">{session.data?.displayName}</span>
            <Button
              variant="ghost"
              className="px-3 py-1.5 text-sm"
              onClick={() => signOut.mutate()}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl">Users</h1>
            <p className="mt-1 text-sm text-dark-teal/60">
              {usersQuery.data
                ? `${usersQuery.data.length} team member${usersQuery.data.length === 1 ? '' : 's'}`
                : 'Manage who can access CarbonOS'}
            </p>
          </div>
          <Button onClick={() => setDialog({ kind: 'create' })}>Add user</Button>
        </div>

        <GlassCard>
          <UserTable
            users={usersQuery.data}
            isPending={usersQuery.isPending}
            currentUserId={currentUserId}
            onEdit={(user) => setDialog({ kind: 'edit', user })}
            onToggleStatus={(user) => toggleStatus(user)}
            onDelete={(user) => setDialog({ kind: 'delete', user })}
          />
        </GlassCard>
      </main>

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
