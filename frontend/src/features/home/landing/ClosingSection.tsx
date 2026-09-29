import { Link } from 'react-router-dom'
import type { AccessIntent } from './intent'
import { Reveal } from './Reveal'
import { Wordmark } from '../../../components/Wordmark'

import { CONTACT_EMAIL } from '../../../lib/contact'

export function ClosingSection({ onRequest }: { onRequest: (intent: AccessIntent) => void }) {
  return (
    <>
      <section className="landing-section">
        <div className="landing-container">
          <Reveal className="closing">
            <div className="closing-glow" aria-hidden />
            <p className="landing-eyebrow landing-eyebrow--light">Measure. Certify. Sustain.</p>
            <h2 className="closing-title">Build the inventory once. Defend it every year.</h2>
            <p className="closing-lede">
              Start with a three-month pilot on one site with ECORIV alongside your team, or request
              access and we set up your organization. We usually reply in 48 hours.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => onRequest('pilot')}
                className="landing-btn landing-btn-accent"
              >
                Ask about the pilot
              </button>
              <button
                type="button"
                onClick={() => onRequest('access')}
                className="landing-btn landing-btn-ghost-light"
              >
                Request access
              </button>
            </div>
            <p className="closing-contact">
              Or write to us:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="closing-contact-link">
                {CONTACT_EMAIL}
              </a>
            </p>
          </Reveal>
        </div>
      </section>
      <footer className="landing-footer">
        <div className="landing-container flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Wordmark />
            <p className="mt-2 text-sm text-ink-muted">
              ECORIV Land Limited · Accra, Ghana ·{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-link hover:underline">
                {CONTACT_EMAIL}
              </a>{' '}
              · The GHG inventory that survives verification.
            </p>
          </div>
          <nav
            aria-label="Footer"
            className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-dark-teal"
          >
            <a
              href="https://www.ecoriv.land"
              target="_blank"
              rel="noreferrer"
              className="hover:text-link"
            >
              ecoriv.land
            </a>
            <a href="#pricing" className="hover:text-link">
              Pricing
            </a>
            <Link to="/app" className="hover:text-link">
              Sign in
            </Link>
          </nav>
        </div>
      </footer>
    </>
  )
}
