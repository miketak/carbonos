import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { GlassCard } from '../../components/GlassCard'
import { LoadingCard } from '../../components/LoadingCard'
import { isSigningOut } from './signOut'
import { useSession } from './useSession'
import type { Role } from './api'

interface RequireAuthProps {
  role?: Role
  children: ReactNode
}

export function RequireAuth({ role, children }: RequireAuthProps) {
  const session = useSession()
  const location = useLocation()

  if (session.isPending) {
    return <LoadingCard />
  }

  const user = session.data ?? null
  if (!user) {
    // a visitor bounced from a page returns to it after signing in; an account
    // signing out does not hand that page to the next one (spec 01.6)
    const signedOut = isSigningOut()
    return (
      <Navigate
        to="/login"
        state={signedOut ? { signedOut } : { from: location.pathname }}
        replace
      />
    )
  }

  if (role && user.role !== role) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <GlassCard className="max-w-md p-8 text-center">
          <h1 className="mb-2 text-xl">Access denied</h1>
          <p className="text-ink-muted">
            You do not have permission to view this page. Contact an administrator if you believe
            this is a mistake.
          </p>
          <Link
            to="/app"
            className="mt-6 inline-block rounded-lg bg-teal-deep px-5 py-2 font-semibold text-white transition-colors duration-150 hover:bg-dark-teal"
          >
            Back to home
          </Link>
        </GlassCard>
      </main>
    )
  }

  return <>{children}</>
}
