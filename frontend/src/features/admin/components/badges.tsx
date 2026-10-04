import { Chip } from '../../../components/Chip'
import { StatusDot } from '../../../components/StatusDot'
import type { StatusTone } from '../../../components/StatusDot'
import type { Role, Status } from '../../auth/api'

/** A role is an outlined chip (spec 10); the administrator's in the primary tone. */
export function RoleBadge({ role }: { role: Role }) {
  return (
    <Chip tone={role === 'ADMIN' ? 'primary' : 'neutral'}>
      {role === 'ADMIN' ? 'Admin' : 'Member'}
    </Chip>
  )
}

const statusTones: Record<Status, StatusTone> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  DISABLED: 'neutral',
}

const statusWords: Record<Status, string> = {
  ACTIVE: 'Active',
  PENDING: 'Pending activation',
  DISABLED: 'Disabled',
}

/** An account's state as a dot and a word (spec 10); the word carries the meaning. */
export function StatusBadge({ status }: { status: Status }) {
  return <StatusDot tone={statusTones[status]}>{statusWords[status]}</StatusDot>
}
