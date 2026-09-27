import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AccountMenu } from './AccountMenu'
import { Wordmark } from './Wordmark'

/** The shared CarbonOS top bar; `children` renders in the right cluster (the org switcher, the area name). */
export function AppHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-white/60 backdrop-blur-xl backdrop-saturate-150">
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
