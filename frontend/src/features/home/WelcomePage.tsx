import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { GlassCard } from '../../components/GlassCard'
import { useLogout } from '../auth/useLogout'
import { useSession } from '../auth/useSession'

/** Authenticated landing for every active user; admins get a link onward. */
export function WelcomePage() {
  const session = useSession()
  const signOut = useLogout()
  const user = session.data

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/50 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <p className="bg-gradient-to-r from-teal to-accent-green bg-clip-text text-lg font-bold text-transparent">
            ECORIV <span className="text-dark-teal">CarbonOS</span>
          </p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-dark-teal/70">{user?.displayName}</span>
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

      <main className="mx-auto flex max-w-5xl justify-center px-6 py-20">
        <GlassCard className="w-full max-w-lg p-10 text-center">
          <p className="bg-gradient-to-r from-teal to-accent-green bg-clip-text text-sm font-bold tracking-widest text-transparent uppercase">
            Ecoriv
          </p>
          <h1 className="mt-2 text-2xl">Welcome, {user?.displayName}</h1>
          <p className="mt-3 text-dark-teal/70">
            Measure. Certify. Sustain. Set up your reporting organizations and run your first GHG
            inventory.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/app/ghg"
              className="inline-block rounded-lg bg-teal px-6 py-2.5 font-semibold text-white transition-colors duration-150 hover:bg-bright-teal"
            >
              GHG accounting
            </Link>
            <Link
              to="/app/profile"
              className="inline-block rounded-lg border border-teal/30 px-6 py-2.5 font-semibold text-teal transition-colors duration-150 hover:bg-teal/10"
            >
              Edit profile
            </Link>
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin/users"
                className="inline-block rounded-lg border border-teal/30 px-6 py-2.5 font-semibold text-teal transition-colors duration-150 hover:bg-teal/10"
              >
                Manage users
              </Link>
            )}
          </div>
        </GlassCard>
      </main>
    </div>
  )
}
