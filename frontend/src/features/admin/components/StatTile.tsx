import { Link } from 'react-router-dom'
import { GlassCard } from '../../../components/GlassCard'

/**
 * One platform count. A number and what it counts, linking to the register
 * behind it; `detail` carries the part of the total worth calling out.
 */
export function StatTile({
  label,
  value,
  detail,
  to,
}: {
  label: string
  value: number
  detail?: string
  to?: string
}) {
  const body = (
    <>
      <p className="text-sm font-medium text-ink-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value.toLocaleString()}</p>
      <p className="mt-1 min-h-4 text-xs text-ink-muted">{detail ?? ''}</p>
    </>
  )

  if (!to) {
    return <GlassCard className="p-5">{body}</GlassCard>
  }
  return (
    <Link to={to} className="block">
      <GlassCard className="hover-lift h-full p-5">{body}</GlassCard>
    </Link>
  )
}
