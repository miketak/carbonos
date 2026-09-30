import { Link } from 'react-router-dom'
import { GlassCard } from './GlassCard'

/**
 * What an address that matches no page shows: a stale bookmark or a mistyped
 * link lands here with a way back, instead of on a blank screen.
 */
export function NotFoundPage({ inLayout = false }: { inLayout?: boolean }) {
  const card = (
    <GlassCard className="max-w-md p-8 text-center">
      <h1 className="mb-2 text-xl">Page not found</h1>
      <p className="text-ink-muted">
        No page lives at this address. The link may be out of date, or the address mistyped.
      </p>
      <Link
        to="/app"
        className="mt-6 inline-block rounded-lg bg-teal-deep px-5 py-2 font-semibold text-white transition-colors duration-150 hover:bg-dark-teal"
      >
        Back to home
      </Link>
    </GlassCard>
  )
  return inLayout ? (
    <section className="flex justify-center py-12">{card}</section>
  ) : (
    <main className="flex min-h-screen items-center justify-center p-6">{card}</main>
  )
}
