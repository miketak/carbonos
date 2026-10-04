import { Button } from '../../../components/Button'
import { Skeleton } from '../../../components/Skeleton'
import { Table, Td, Th, TwoLine } from '../../../components/Table'
import { RoleBadge, StatusBadge } from './badges'
import type { User } from '../api'

interface UserTableProps {
  users: User[] | undefined
  isPending: boolean
  currentUserId: string
  onEdit: (user: User) => void
  onToggleStatus: (user: User) => void
  /** Spec 01.9: offered on active accounts only; the server refuses the others. */
  onResetPassword?: (user: User) => void
  onDelete: (user: User) => void
}

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

export function UserTable({
  users,
  isPending,
  currentUserId,
  onEdit,
  onToggleStatus,
  onResetPassword,
  onDelete,
}: UserTableProps) {
  if (isPending) {
    return (
      <div aria-label="Loading users" className="flex flex-col gap-3 p-6">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex h-12 items-center gap-4">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (!users || users.length === 0) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-lg">No users yet</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Add your first team member with the button above.
        </p>
      </div>
    )
  }

  return (
    <Table className="[&_tbody_tr:last-child>td]:border-b-0">
      <thead>
        <tr>
          <Th>Name</Th>
          <Th>Role</Th>
          <Th>Status</Th>
          <Th>Added</Th>
          <Th align="right">
            <span className="sr-only">Actions</span>
          </Th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id} className="transition-colors duration-150 hover:bg-surface-sunken">
            <Td>
              <TwoLine
                primary={
                  <>
                    {user.displayName}
                    {user.id === currentUserId && (
                      <span className="ml-2 text-[13px] font-normal text-ink-muted">(you)</span>
                    )}
                  </>
                }
                secondary={user.email}
              />
            </Td>
            <Td>
              <RoleBadge role={user.role} />
            </Td>
            <Td>
              <StatusBadge status={user.status} />
            </Td>
            <Td className="whitespace-nowrap text-ink-muted">
              {dateFormat.format(new Date(user.createdAt))}
            </Td>
            <Td align="right">
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="ghost" onClick={() => onEdit(user)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onToggleStatus(user)}>
                  {user.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                </Button>
                {onResetPassword && user.status === 'ACTIVE' && (
                  <Button size="sm" variant="ghost" onClick={() => onResetPassword(user)}>
                    Reset password
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => onDelete(user)}>
                  Delete
                </Button>
              </div>
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
