import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
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
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <GlassCard className="w-full max-w-md space-y-3 p-8" aria-label="Loading">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </GlassCard>
      </main>
    )
  }

  const user = session.data ?? null
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
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
