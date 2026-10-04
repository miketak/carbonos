import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AccountMenu } from './AccountMenu'
import { Wordmark } from './Wordmark'

/**
 * The plain top bar of the areas without a rail (spec 10): the organizations
 * list, the profile page. `children` renders in the right cluster.
 */
export function AppHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-surface">
      <div className="flex h-14 items-center justify-between gap-4 px-6">
        {/* "/app" resolves by role (spec 01.6), so the wordmark means "my home" */}
        <Link to="/app" aria-label="CarbonOS home" className="shrink-0">
          <Wordmark />
        </Link>
        <div className="flex min-w-0 items-center gap-3">
          {children}
          <AccountMenu />
        </div>
      </div>
    </header>
  )
}
