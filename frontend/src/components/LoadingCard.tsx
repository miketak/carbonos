import { GlassCard } from './GlassCard'
import { Skeleton } from './Skeleton'

/** The full-page placeholder a route shows while it works out what to render. */
export function LoadingCard({ label = 'Loading' }: { label?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <GlassCard className="w-full max-w-md space-y-3 p-8" aria-label={label}>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </GlassCard>
    </main>
  )
}
