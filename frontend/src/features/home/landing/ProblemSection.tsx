import { Reveal } from './Reveal'

const QUESTIONS = [
  'Which legal entities were in the boundary on 1 March, and under which consolidation approach?',
  'Why is the generator diesel at the Obuasi camp in Scope 1 and the contractor haulage in Scope 3?',
  'Which edition of the grid factor produced the Scope 2 figure, and who adopted it?',
  'Who approved run 3, and why does run 4 exist?',
  'What changed in the report after the board signed it?',
]

const LEDGER = [
  {
    who: 'A. Mensah',
    role: 'Preparer',
    what: 'Adopted the DESNZ 2025 edition',
    why: 'reason: annual factor update',
  },
  {
    who: 'K. Boateng',
    role: 'Reviewer',
    what: 'Approved run 3',
    why: 'self-approval refused for the preparer',
  },
  {
    who: 'A. Mensah',
    role: 'Preparer',
    what: 'Voided run 3',
    why: 'reason: Site B November diesel double-counted',
  },
  {
    who: 'Pre-flight',
    role: '',
    what: 'Run 4 refused as final',
    why: 'unflagged proxy density on LPG',
    warn: true,
  },
  {
    who: 'A. Mensah',
    role: 'Preparer',
    what: 'Flagged the density as a proxy · run 4 passed',
    why: 'frozen: boundary version 3',
  },
]

/** The verifier's questions beside the history that answers them. */
export function ProblemSection() {
  return (
    <section id="product" className="landing-section landing-section--alt">
      <div className="landing-container grid items-center gap-14 lg:grid-cols-2">
        <Reveal className="flex flex-col gap-5">
          <p className="landing-eyebrow">The record</p>
          <h2 className="landing-title">The problem is not the arithmetic. It is the record.</h2>
          <p className="landing-lede">
            A verifier does not ask for the total. A verifier asks these, and a spreadsheet cannot
            answer them after the fact.
          </p>
          <ul className="mt-2 flex flex-col gap-3 text-ink">
            {QUESTIONS.map((q) => (
              <li key={q} className="flex gap-3">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className="mt-0.5 shrink-0 text-link"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8.5 12.5l2.5 2.5 4.5-5" />
                </svg>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal as="div" className="landing-frame" step={1}>
          <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-4 text-[13px]">
            <span className="font-semibold text-ink">History</span>
            <span className="text-ink-muted">Gye Nyame Gold · FY2025</span>
          </div>
          <ol className="text-[13px]" aria-label="Organization history">
            {LEDGER.map((row) => (
              <li
                key={row.what}
                className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 border-b border-hairline px-5 py-3.5 last:border-b-0"
              >
                <span className="text-ink-muted">
                  {row.who}
                  {row.role && <span className="block text-[11px]">{row.role}</span>}
                </span>
                <span className="text-ink">
                  {row.what}
                  <span className={`block ${row.warn ? 'text-warning' : 'text-ink-muted'}`}>
                    {row.why}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  )
}
