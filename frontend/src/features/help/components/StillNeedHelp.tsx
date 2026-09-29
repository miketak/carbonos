import { CONTACT_EMAIL } from '../../../lib/contact'

/** One route out when the page did not answer: an email that names the page. */
export function StillNeedHelp({ title }: { title: string }) {
  const subject = encodeURIComponent(`Help: ${title}`)
  return (
    <section className="help-still" aria-labelledby="still-need-help">
      <h2 id="still-need-help" className="help-still-title">
        Still need help?
      </h2>
      <p>
        Write to{' '}
        <a href={`mailto:${CONTACT_EMAIL}?subject=${subject}`} className="help-still-link">
          {CONTACT_EMAIL}
        </a>{' '}
        and say which page you were on. We usually reply in 48 hours.
      </p>
    </section>
  )
}
