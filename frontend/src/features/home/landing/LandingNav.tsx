import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AccessIntent } from './intent'
import { Wordmark } from '../../../components/Wordmark'

const LINKS = [
  { href: '#product', label: 'Product' },
  { href: '#inventory', label: 'Inventory' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
]

export function LandingNav({ onRequest }: { onRequest: (intent: AccessIntent) => void }) {
  const [scrolled, setScrolled] = useState(false)
  const menu = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeMenu = () => {
    if (menu.current) menu.current.open = false
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }
    const onPointer = (event: PointerEvent) => {
      if (menu.current?.open && !menu.current.contains(event.target as Node)) closeMenu()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [])

  return (
    <header className={`landing-nav ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="landing-container flex h-16 items-center justify-between gap-4">
        <a href="#top" aria-label="CarbonOS, back to top" className="shrink-0">
          <Wordmark />
        </a>
        <nav aria-label="Page sections" className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-dark-teal transition-colors hover:bg-teal/10"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          {/* a phone row holds the wordmark, the button and the menu; Sign in lives in the menu there,
              and on the narrowest phones (under 375px) Request access does too, since the hero repeats it */}
          <Link
            to="/app"
            className="hidden rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap text-dark-teal transition-colors hover:bg-teal/10 sm:inline-flex"
          >
            Sign in
          </Link>
          <button
            type="button"
            onClick={() => onRequest('access')}
            className="hidden rounded-lg bg-teal-deep px-2.5 py-2 text-sm font-semibold whitespace-nowrap text-white shadow-[0_4px_16px_rgba(9,168,149,0.35)] transition-all hover:bg-dark-teal hover:shadow-[0_6px_20px_rgba(9,168,149,0.45)] focus-visible:ring-2 focus-visible:ring-bright-teal focus-visible:outline-none min-[375px]:inline-flex sm:px-4"
          >
            Request access
          </button>
          <details ref={menu} className="landing-menu md:hidden">
            <summary className="landing-menu-button" aria-label="Page sections">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </summary>
            <nav aria-label="Page sections" className="landing-menu-panel">
              <Link to="/app" onClick={closeMenu} className="landing-menu-link sm:hidden">
                Sign in
              </Link>
              <button
                type="button"
                onClick={() => {
                  closeMenu()
                  onRequest('access')
                }}
                className="landing-menu-link text-left min-[375px]:hidden"
              >
                Request access
              </button>
              <span className="landing-menu-rule sm:hidden" aria-hidden />
              {LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className="landing-menu-link"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  )
}
