import { Button } from '../../../components/Button'
import { Skeleton } from '../../../components/Skeleton'
import { RoleBadge, StatusBadge } from './badges'
import type { User } from '../api'

interface UserTableProps {
  users: User[] | undefined
  isPending: boolean
  currentUserId: string
  onEdit: (user: User) => void
  onToggleStatus: (user: User) => void
  onDelete: (user: User) => void
}

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

export function UserTable({
  users,
  isPending,
  currentUserId,
  onEdit,
  onToggleStatus,
  onDelete,
}: UserTableProps) {
  if (isPending) {
    return (
      <div aria-label="Loading users" className="flex flex-col gap-3 p-6">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex h-12 items-center gap-4">
            <Skeleton className="size-9 rounded-full" />
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
        <p className="mt-1 text-sm text-dark-teal/60">
          Add your first team member with the button above.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-teal/10 text-xs text-dark-teal/60 uppercase">
            <th className="px-6 py-3 font-medium">Name</th>
            <th className="px-6 py-3 font-medium">Role</th>
            <th className="px-6 py-3 font-medium">Status</th>
            <th className="px-6 py-3 font-medium">Added</th>
            <th className="px-6 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="h-16 border-b border-teal/5 transition-colors duration-150 last:border-b-0 hover:bg-soft-mint/60"
            >
              <td className="px-6 py-3">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="flex size-9 items-center justify-center rounded-full bg-teal/10 font-semibold text-teal"
                  >
                    {user.displayName.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="font-medium">
                      {user.displayName}
                      {user.id === currentUserId && (
                        <span className="ml-2 text-xs text-dark-teal/50">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-dark-teal/60">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-3">
                <RoleBadge role={user.role} />
              </td>
              <td className="px-6 py-3">
                <StatusBadge status={user.status} />
              </td>
              <td className="px-6 py-3 text-dark-teal/70">
                {dateFormat.format(new Date(user.createdAt))}
              </td>
              <td className="px-6 py-3">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    className="px-3 py-1.5 text-sm"
                    onClick={() => onEdit(user)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-3 py-1.5 text-sm"
                    onClick={() => onToggleStatus(user)}
                  >
                    {user.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(user)}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
