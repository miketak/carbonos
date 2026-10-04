import { Link } from 'react-router-dom'
import { Panel } from './Panel'

/**
 * What an address that matches no page shows: a stale bookmark or a mistyped
 * link lands here with a way back, instead of on a blank screen.
 */
export function NotFoundPage({ inLayout = false }: { inLayout?: boolean }) {
  const card = (
    <Panel className="max-w-md p-8 text-center">
      <h1 className="mb-2 text-xl">Page not found</h1>
      <p className="text-ink-muted">
        No page lives at this address. The link may be out of date, or the address mistyped.
      </p>
      <Link
        to="/app"
        className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 font-medium text-primary-ink transition-colors duration-150 hover:bg-primary-hover"
      >
        Back to home
      </Link>
    </Panel>
  )
  return inLayout ? (
    <section className="flex justify-center py-12">{card}</section>
  ) : (
    <main className="flex min-h-screen items-center justify-center p-6">{card}</main>
  )
}
