import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLogout } from '../features/auth/useLogout'
import { useSession } from '../features/auth/useSession'
import { useAvatarQuery, useProfileQuery } from '../features/profile/useProfile'
import { useTheme } from '../lib/theme'

/**
 * The account cluster (spec 01.6): who you are signed in as, and the things
 * you do with that account. In the top bar it is the avatar and the name; in
 * the rail (spec 10) it fills the foot with the role line underneath. It is
 * the only route back to the administration panel from the product, and it
 * holds the theme switch.
 *
 * It carries the session's name and email and nothing organization scoped, so
 * it says nothing about a tenant. **Administration** grants no access: the
 * boundary is the server's refusal and the support grant (spec 01.3), never
 * the absence of a link.
 */
export function AccountMenu({
  variant = 'bar',
  roleLine,
}: {
  variant?: 'bar' | 'rail'
  /** spec 01.4: the reader's own role, said under the name in the rail */
  roleLine?: string
}) {
  const session = useSession()
  const signOut = useLogout()
  const location = useLocation()
  const { resolved, setTheme } = useTheme()
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

  // the panel's own navigation is its rail; the entry would be noise there
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

  const rail = variant === 'rail'
  const initial = user.displayName.charAt(0).toUpperCase()
  const itemClass =
    'flex w-full min-h-10 items-center justify-between gap-3 rounded-md px-2.5 text-left text-sm text-ink transition-colors duration-150 hover:bg-surface-sunken'
  const avatar = avatarUrl ? (
    <img src={avatarUrl} alt="" className="size-8 shrink-0 rounded-full object-cover" />
  ) : (
    <span
      aria-hidden="true"
      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
        rail
          ? 'border border-sidebar-field-border bg-sidebar-active text-sidebar-accent'
          : 'bg-surface-sunken text-ink'
      }`}
    >
      {initial}
    </span>
  )
  const chevron = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`size-4 shrink-0 ${rail ? 'text-sidebar-muted' : 'text-ink-muted'}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )

  return (
    <div ref={ref} className={rail ? 'relative' : 'relative shrink-0'}>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpenedAt(open ? null : location.pathname)}
        className={
          rail
            ? 'flex w-full min-h-13 items-center gap-2.5 rounded-md px-2.5 text-left transition-colors duration-150 hover:bg-sidebar-hover focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none'
            : 'flex items-center gap-2 rounded-lg py-1 pr-2 pl-1 transition-colors duration-150 hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none'
        }
      >
        {avatar}
        {rail ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-medium">{user.displayName}</span>
            {roleLine && (
              <span className="block truncate text-xs text-sidebar-muted">{roleLine}</span>
            )}
          </span>
        ) : (
          <span className="hidden max-w-40 truncate text-sm text-ink sm:inline">
            {user.displayName}
          </span>
        )}
        {chevron}
        <span className="sr-only">Account menu for {user.displayName}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className={`absolute z-50 flex w-60 flex-col rounded-lg border border-hairline bg-surface-raised p-1.5 text-ink shadow-pop ${
            rail ? 'bottom-[calc(100%+6px)] left-0 w-full' : 'right-0 mt-2'
          }`}
        >
          <p className="truncate px-2.5 pt-1.5 pb-2 text-xs text-ink-muted">{user.email}</p>
          <div aria-hidden="true" className="my-1 h-px bg-hairline" />
          <Link role="menuitem" to="/app/profile" className={itemClass}>
            Edit profile
          </Link>
          {/* the help centre is a route of the app (ADR 0006), opened beside the work */}
          <Link
            role="menuitem"
            to="/help"
            target="_blank"
            rel="noopener"
            className={itemClass}
            onClick={close}
          >
            Help
          </Link>
          {isAdmin && !inAdminArea && (
            <Link role="menuitem" to="/admin" className={itemClass}>
              Administration
            </Link>
          )}
          <div aria-hidden="true" className="my-1 h-px bg-hairline" />
          {/* spec 10: a per-browser convenience, never an account setting */}
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => {
              setTheme(resolved === 'dark' ? 'light' : 'dark')
              close()
            }}
          >
            {resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          </button>
          <div aria-hidden="true" className="my-1 h-px bg-hairline" />
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
