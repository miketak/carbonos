import { useEffect, useState } from 'react'
import type { HelpHeading } from '../manifest'
import { useReducedMotion } from '../../../lib/useReducedMotion'

/** The rail of H2 and H3 headings; the one in view is marked as the reader scrolls. */
export function OnThisPage({
  headings,
  ready = true,
  plain = false,
}: {
  headings: HelpHeading[]
  ready?: boolean
  plain?: boolean
}) {
  const [active, setActive] = useState<string | undefined>(headings[0]?.id)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!ready || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) {
          setActive(visible[0].target.id)
          return
        }
        // nothing in the band (the reader is past the last heading): mark the last one above it
        const band = 72 + window.innerHeight * 0.3
        const above = headings.filter((h) => {
          const top = document.getElementById(h.id)?.getBoundingClientRect().top
          return top !== undefined && top < band
        })
        if (above.length) setActive(above[above.length - 1].id)
      },
      { rootMargin: '-72px 0px -70% 0px' },
    )
    for (const h of headings) {
      const node = document.getElementById(h.id)
      if (node) observer.observe(node)
    }
    return () => observer.disconnect()
  }, [headings, ready])

  return (
    <nav className="help-onthispage">
      {!plain && <p className="help-onthispage-title">On this page</p>}
      <ul>
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? 'is-sub' : ''}>
            <a
              href={`#${h.id}`}
              aria-current={active === h.id ? 'location' : undefined}
              onClick={(event) => {
                event.preventDefault()
                document
                  .getElementById(h.id)
                  ?.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' })
                history.replaceState(null, '', `#${h.id}`)
                setActive(h.id)
              }}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
