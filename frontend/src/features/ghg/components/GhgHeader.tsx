import { Link } from 'react-router-dom'
import { Button } from '../../../components/Button'
import { useLogout } from '../../auth/useLogout'
import { useSession } from '../../auth/useSession'

/** The shared CarbonOS top bar, with a home link back to /app. */
export function GhgHeader() {
  const session = useSession()
  const signOut = useLogout()

  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link
          to="/app"
          className="bg-gradient-to-r from-teal to-accent-green bg-clip-text text-lg font-bold text-transparent"
        >
          ECORIV <span className="text-dark-teal">CarbonOS</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-dark-teal/70">{session.data?.displayName}</span>
          <Button variant="ghost" className="px-3 py-1.5 text-sm" onClick={() => signOut.mutate()}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  )
}
