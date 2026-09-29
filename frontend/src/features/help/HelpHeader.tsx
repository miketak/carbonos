import { Link, useLocation } from 'react-router-dom'
import { AccountMenu } from '../../components/AccountMenu'
import { Wordmark } from '../../components/Wordmark'
import { useSession } from '../auth/useSession'
import { SearchBox } from './components/SearchBox'

/**
 * The help's top bar: the lockup, search, and either the account menu (a
 * signed-in reader) or a sign-in link (a visitor). While the session is
 * unknown the right side stays empty rather than flashing the wrong one.
 */
export function HelpHeader({ onBrowse }: { onBrowse: () => void }) {
  const session = useSession()
  const signedIn = !!session.data
  const onSearchPage = useLocation().pathname === '/help/search'
  return (
    <header className="help-header">
      <div className="help-header-row">
        <Link to={signedIn ? '/app' : '/'} aria-label="CarbonOS home" className="shrink-0">
          <Wordmark />
        </Link>
        {onSearchPage ? null : (
          <div className="help-header-search">
            <SearchBox />
          </div>
        )}
        <div className="flex items-center gap-2">
          <button type="button" className="help-browse lg:hidden" onClick={onBrowse}>
            Browse
          </button>
          {session.isPending ? null : signedIn ? (
            <AccountMenu />
          ) : (
            <Link to="/login" className="help-signin">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
