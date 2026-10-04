import { Fragment } from 'react'
import { Link, NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AccountMenu } from './AccountMenu'
import { Wordmark } from './Wordmark'

export interface RailSection {
  to: string
  label: string
  end?: boolean
  /** the step's number for the entries that are steps of the workflow; a dash for the landing */
  num?: string
  /** a hairline above this entry, where the sections change kind */
  ruleBefore?: boolean
  /** a count the entry carries (open notices, waiting requests) */
  badge?: { count: number; title: string; srLabel: string }
}

/**
 * The rail of the workspace and the administration area (spec 10): the
 * wordmark; a labelled block for what the rail belongs to (the organization
 * switcher, the area's name); the sections, numbered where they are steps;
 * and a foot with the links out, the role line and the account.
 */
export function Sidebar({
  navLabel,
  sections,
  tail = [],
  workspaceLabel,
  workspace,
  foot,
  roleLine,
}: {
  navLabel: string
  sections: RailSection[]
  /** entries that sit at the bottom of the navigation, apart from the sections (Settings) */
  tail?: RailSection[]
  workspaceLabel: string
  workspace: ReactNode
  /** the links out of this area, rendered under the navigation */
  foot?: ReactNode
  roleLine?: string | null
}) {
  // the number is decoration, drawn from data-num by a pseudo-element, so a
  // reader and a test get the label alone and the bare entries sit flush left
  const numbered = 'rail-num before:w-5.5 before:shrink-0 before:text-[13px] before:font-semibold'

  const entry = (section: RailSection) => (
    <Fragment key={section.label}>
      {section.ruleBefore && (
        <div aria-hidden="true" className="mx-3 my-2.5 h-px bg-sidebar-hairline" />
      )}
      <NavLink
        to={section.to}
        end={section.end}
        data-num={section.num}
        className={({ isActive }) =>
          `flex min-h-11 items-center gap-3.5 rounded-md px-3 text-[15px] font-medium whitespace-nowrap transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none ${
            section.num !== undefined
              ? `${numbered} ${isActive ? 'before:text-sidebar-accent' : 'before:text-sidebar-muted'}`
              : ''
          } ${
            isActive
              ? 'bg-sidebar-active text-sidebar-ink shadow-[inset_3px_0_0_var(--sidebar-accent)]'
              : 'text-sidebar-ink hover:bg-sidebar-hover'
          }`
        }
      >
        <span>{section.label}</span>
        {section.badge && section.badge.count > 0 && (
          <span
            title={section.badge.title}
            className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-sidebar-accent px-1.5 text-xs font-semibold text-sidebar-bg"
          >
            {section.badge.count}
            <span className="sr-only"> {section.badge.srLabel}</span>
          </span>
        )}
      </NavLink>
    </Fragment>
  )

  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 bg-sidebar-bg px-3 pt-5 pb-4 text-sidebar-ink md:min-h-screen md:w-[260px]">
      {/* "/app" resolves by role (spec 01.6), so the wordmark means "my home" */}
      <Link to="/app" aria-label="CarbonOS home" className="px-3">
        <Wordmark surface="dark" byline={false} />
      </Link>

      <div>
        <div className="mb-2 px-3 text-[11px] font-semibold tracking-[0.08em] text-sidebar-muted uppercase">
          {workspaceLabel}
        </div>
        {workspace}
      </div>

      <nav aria-label={navLabel} className="flex flex-1 flex-col gap-0.5">
        {sections.map(entry)}
        {tail.length > 0 && (
          <div className="mt-auto flex flex-col gap-0.5 pt-3">{tail.map(entry)}</div>
        )}
      </nav>

      <div className="flex flex-col gap-0.5 border-t border-sidebar-hairline pt-3">
        {foot}
        <AccountMenu variant="rail" roleLine={roleLine ?? undefined} />
      </div>
    </aside>
  )
}

/** A link out of the area, in the rail's foot: Help, All organizations, GHG accounting. */
export function RailLink({
  to,
  external = false,
  icon,
  children,
}: {
  to: string
  external?: boolean
  icon: string
  children: ReactNode
}) {
  return (
    <Link
      to={to}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener' : undefined}
      className="flex min-h-11 items-center gap-3 rounded-md px-3 text-[15px] font-medium whitespace-nowrap text-sidebar-ink transition-colors duration-150 hover:bg-sidebar-hover focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-5 shrink-0 text-sidebar-muted"
      >
        <path d={icon} />
      </svg>
      {children}
    </Link>
  )
}

export const railIcons = {
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01',
  organizations: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  ghg: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10M2 21c0-3 1.85-5.36 4.71-6.5',
}
