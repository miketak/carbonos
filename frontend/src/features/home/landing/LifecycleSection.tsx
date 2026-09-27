import { Reveal } from './Reveal'

const STATES = [
  {
    name: 'Draft',
    what: 'Records land, are classified, and carry evidence and a data quality tier.',
  },
  { name: 'Frozen', what: 'Freezing cuts a boundary version. Reopening needs a reason.' },
  { name: 'Final', what: 'A final run refuses known defects instead of warning about them.' },
  { name: 'Published', what: 'A correction becomes report version 2. Version 1 is never altered.' },
]

const RUNS = [
  { n: 'Run 1', state: 'superseded', note: 'Draft, DESNZ 2024 edition' },
  { n: 'Run 2', state: 'superseded', note: 'Draft, DESNZ 2025 edition adopted' },
  { n: 'Run 3', state: 'voided', note: 'Voided: Site B November diesel double-counted' },
  { n: 'Run 4', state: 'final', note: 'Final · approved by K. Boateng · 86,412 tCO₂e' },
]

export function LifecycleSection() {
  return (
    <section className="landing-section landing-section--dark">
      <div className="landing-container">
        <Reveal className="landing-head">
          <p className="landing-eyebrow landing-eyebrow--light">A record a verifier can rely on</p>
          <h2 className="landing-title landing-title--light">Nothing changes silently.</h2>
          <p className="landing-lede landing-lede--light">
            An inventory moves through four states. Runs are numbered, immutable snapshots. A wrong
            run is voided with a reason and stays listed, so two runs can be compared and a mistake
            is never hidden.
          </p>
        </Reveal>

        <Reveal className="lifecycle" step={1}>
          <div className="lifecycle-track" aria-hidden>
            <span className="lifecycle-track-fill" />
          </div>
          <ol className="lifecycle-steps">
            {STATES.map((s, i) => (
              <li
                key={s.name}
                className="lifecycle-step"
                style={{ '--stagger': i } as React.CSSProperties}
              >
                <span className="lifecycle-dot">
                  <span className="lifecycle-dot-core" />
                </span>
                <span className="lifecycle-name">{s.name}</span>
                <span className="lifecycle-what">{s.what}</span>
              </li>
            ))}
          </ol>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Reveal className="runs" step={2}>
            <div className="runs-head">
              <span>Calculation runs</span>
              <span className="runs-head-note">Gye Nyame Gold</span>
            </div>
            <ol className="runs-list">
              {RUNS.map((r, i) => (
                <li
                  key={r.n}
                  className={`run run--${r.state}`}
                  style={{ '--stagger': i } as React.CSSProperties}
                >
                  <span className="run-n">{r.n}</span>
                  <span className="run-note">{r.note}</span>
                  <span className="run-state">{r.state}</span>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal className="controls" step={3}>
            {[
              [
                'Approval refuses self-approval',
                'The approver and the date are recorded. While another writer exists, a preparer cannot approve their own run.',
              ],
              [
                'A final run refuses known defects',
                'An unflagged proxy density, a blend published under another GWP set, a missing Table 1 entity: refused, not flagged.',
              ],
              [
                'Corrections carry reasons',
                'Exclusions never print a false zero. The original figure stays on the record beside the correction.',
              ],
              [
                'Support access is time-boxed and disclosed',
                'An organization is invisible to outsiders. A platform administrator needs a stated reason, and the grant expires within 72 hours.',
              ],
            ].map(([title, body]) => (
              <div key={title} className="control">
                <span className="control-mark" aria-hidden>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <div>
                  <h3 className="control-title">{title}</h3>
                  <p className="control-body">{body}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
