import { Link } from 'react-router-dom'
import { Button } from '../../../components/Button'
import { useLogout } from '../../auth/useLogout'
import { useSession } from '../../auth/useSession'

/** Every page of the administration area, so each one can link to the others. */
const pages = [
  { to: '/admin/users', label: 'Manage users' },
  { to: '/admin/organizations', label: 'Organizations' },
  { to: '/admin/factor-packs', label: 'Factor packs' },
] as const

/**
 * The sticky glass header the administration pages share. Each page names
 * itself with `current`, and the header links to the others: three pages
 * carrying their own copy of the bar, each with the other links hardcoded,
 * stops working the moment a fourth arrives.
 */
export function AdminHeader({ current }: { current: string }) {
  const session = useSession()
  const signOut = useLogout()

  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <div className="leading-none">
          <p className="bg-gradient-to-r from-teal to-accent-green bg-clip-text text-lg font-bold text-transparent">
            CarbonOS
          </p>
          <p className="mt-0.5 text-[10px] font-semibold tracking-[0.2em] text-ink-muted uppercase">
            by ECORIV
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pages
            .filter((page) => page.to !== current)
            .map((page) => (
              <Link key={page.to} to={page.to} className="text-sm font-semibold text-link">
                {page.label}
              </Link>
            ))}
          <span className="text-sm text-ink-muted">{session.data?.displayName}</span>
          <Button variant="ghost" className="px-3 py-1.5 text-sm" onClick={() => signOut.mutate()}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  )
}
