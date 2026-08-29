import type { Role, Status } from '../../auth/api'

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        role === 'ADMIN' ? 'bg-dark-teal text-white' : 'bg-teal/15 text-dark-teal'
      }`}
    >
      {role === 'ADMIN' ? 'Admin' : 'Member'}
    </span>
  )
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        status === 'ACTIVE' ? 'bg-accent-green/25 text-dark-teal' : 'bg-gray-200 text-gray-500'
      }`}
    >
      {status === 'ACTIVE' ? 'Active' : 'Disabled'}
    </span>
  )
}
