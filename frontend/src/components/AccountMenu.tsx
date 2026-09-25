import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLogout } from '../features/auth/useLogout'
import { useSession } from '../features/auth/useSession'
import { useAvatarQuery, useProfileQuery } from '../features/profile/useProfile'

/**
 * The account cluster in the top right (spec 01.6): who you are signed in as,
 * and the three things you do with that account. It replaces the welcome card
 * as the way to reach the profile, and is the only route back to the
 * administration panel from the product.
 *
 * It carries the session's name and email and nothing organization scoped, so
 * it says nothing about a tenant. **Administration** grants no access: the
 * boundary is the server's refusal and the support grant (spec 01.3), never
 * the absence of a link.
 */
export function AccountMenu() {
  const session = useSession()
  const signOut = useLogout()
  const location = useLocation()
  // the path the menu was opened at, rather than a boolean plus an effect to
  // close it: following a link changes the path, which closes it by derivation
  const [openedAt, setOpenedAt] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  const profileQuery = useProfileQuery()
  const avatarQuery = useAvatarQuery(!!profileQuery.data?.hasAvatar)
  const avatarBlob = avatarQuery.data
  const avatarUrl = useMemo(
    () => (avatarBlob ? URL.createObjectURL(avatarBlob) : undefined),
    [avatarBlob],
  )
  useEffect(() => {
    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl)
    }
  }, [avatarUrl])

  // the panel's own navigation is its sidebar; the entry would be noise there
  const inAdminArea = location.pathname.startsWith('/admin')
  const isAdmin = session.data?.role === 'ADMIN'
  const open = openedAt === location.pathname
  const close = () => setOpenedAt(null)

  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) close()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      close()
      trigger.current?.focus()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const user = session.data
  if (!user) return null

  const initial = user.displayName.charAt(0).toUpperCase()
  const itemClass =
    'block w-full px-4 py-2 text-left text-sm font-medium text-dark-teal transition-colors duration-150 hover:bg-teal/10'

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpenedAt(open ? null : location.pathname)}
        className="flex items-center gap-2 rounded-full border border-transparent py-1 pr-2 pl-1 transition-colors duration-150 hover:border-teal/20 hover:bg-teal/10"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="size-8 shrink-0 rounded-full object-cover ring-1 ring-white"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal/15 text-sm font-bold text-link ring-1 ring-white"
          >
            {initial}
          </span>
        )}
        <span className="hidden max-w-40 truncate text-sm text-ink-muted sm:inline">
          {user.displayName}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-3.5 w-3.5 shrink-0 text-ink-muted"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
        <span className="sr-only">Account menu for {user.displayName}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-white/60 bg-white/95 py-1 shadow-lg backdrop-blur-xl"
        >
          <p className="truncate border-b border-teal/10 px-4 pt-2 pb-3 text-xs text-ink-muted">
            {user.email}
          </p>
          <Link role="menuitem" to="/app/profile" className={itemClass}>
            Edit profile
          </Link>
          {/* the help site is served beside the app at /help/ (ADR 0005); a
              plain anchor, because it is not a route of the SPA */}
          <a
            role="menuitem"
            href="/help/"
            target="_blank"
            rel="noopener"
            className={itemClass}
            onClick={close}
          >
            Help
          </a>
          {isAdmin && !inAdminArea && (
            <Link role="menuitem" to="/admin" className={itemClass}>
              Administration
            </Link>
          )}
          <div aria-hidden="true" className="my-1 h-px bg-teal/10" />
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => {
              close()
              signOut.mutate()
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
