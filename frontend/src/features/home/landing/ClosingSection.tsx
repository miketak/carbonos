import { Link } from 'react-router-dom'
import type { AccessIntent } from './intent'
import { Reveal } from './Reveal'
import { Wordmark } from '../../../components/Wordmark'

import { CONTACT_EMAIL } from '../../../lib/contact'

/** The close carries the trust facts the old Trust section held, as one paragraph, then the footer. */
export function ClosingSection({ onRequest }: { onRequest: (intent: AccessIntent) => void }) {
  return (
    <>
      <section className="landing-section landing-section--alt border-t border-hairline">
        <Reveal className="landing-container flex flex-col items-center gap-5 text-center">
          <p className="landing-eyebrow">Measure. Certify. Sustain.</p>
          <h2 className="landing-title max-w-2xl">
            Build the inventory once. Defend it every year.
          </h2>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => onRequest('access')}
              className="landing-btn landing-btn-primary"
            >
              Request access
            </button>
            <button
              type="button"
              onClick={() => onRequest('talk')}
              className="landing-btn landing-btn-ghost"
            >
              Talk to ECORIV
            </button>
          </div>
          <p className="mt-6 max-w-2xl text-sm text-ink-muted">
            Built in Accra by the consultancy that prepares these inventories for mines, drilling
            contractors and construction firms. A Ghana factor pack beside the UK DESNZ set. Nobody
            outside your organization can see that it exists; support access needs a stated reason,
            expires within 72 hours and is disclosed in your history. We usually reply in 48 hours.
          </p>
        </Reveal>
      </section>
      <footer className="landing-footer">
        <div className="landing-container flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Wordmark />
            <p className="mt-2 text-[13px] text-ink-muted">
              ECORIV Land Limited · Accra, Ghana ·{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-link hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
          <nav
            aria-label="Footer"
            className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-medium text-ink"
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
