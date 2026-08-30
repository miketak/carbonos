import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Button } from '../../../components/Button'
import { useLogout } from '../../auth/useLogout'
import { useSession } from '../../auth/useSession'

/** The shared CarbonOS top bar; `children` renders in the right cluster (e.g. the org switcher). */
export function GhgHeader({ children }: { children?: ReactNode }) {
  const session = useSession()
  const signOut = useLogout()

  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-white/60 backdrop-blur-xl backdrop-saturate-150">
      <div className="flex h-14 items-center justify-between gap-4 px-6">
        <Link to="/app" className="shrink-0 leading-none">
          <span className="block bg-gradient-to-r from-teal to-accent-green bg-clip-text text-lg font-bold text-transparent">
            CarbonOS
          </span>
          <span className="mt-0.5 block text-[10px] font-semibold tracking-[0.2em] text-ink-muted uppercase">
            by ECORIV
          </span>
        </Link>
        <div className="flex min-w-0 items-center gap-3">
          {children}
          <span className="hidden text-sm whitespace-nowrap text-ink-muted sm:inline">
            {session.data?.displayName}
          </span>
          <Button
            variant="ghost"
            className="shrink-0 px-3 py-1.5 text-sm"
            onClick={() => signOut.mutate()}
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  )
}
