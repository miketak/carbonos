import { Link } from 'react-router-dom'
import { helpHref } from '../lib/helpHref'
import type { HelpTopic } from '../lib/helpHref'

/**
 * A small "Help" link beside a heading, into the article for that screen.
 * It opens in a new tab so the reader keeps their place in the work
 * (spec 09). The same look everywhere, so a reader learns it once.
 */
export function HelpLink({
  topic,
  anchor,
  label = 'Help',
  className = '',
}: {
  topic: HelpTopic
  anchor?: string
  label?: string
  className?: string
}) {
  return (
    <Link
      to={helpHref(topic, anchor)}
      target="_blank"
      rel="noopener"
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold text-link hover:bg-teal/10 focus-visible:ring-2 focus-visible:ring-bright-teal focus-visible:outline-none ${className}`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" />
      </svg>
      {label}
    </Link>
  )
}
