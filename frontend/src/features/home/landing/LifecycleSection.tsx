import { Reveal } from './Reveal'

const STATES = [
  {
    name: 'Draft',
    what: 'Records land, are classified, and carry evidence and a data quality tier.',
  },
  { name: 'Frozen', what: 'Freezing cuts a boundary version. Reopening needs a reason.' },
  { name: 'In review', what: 'The preparer submits a run; someone else signs it off.' },
  { name: 'Final', what: 'A final run refuses known defects instead of warning about them.' },
  { name: 'Published', what: 'A correction becomes report version 2. Version 1 is never altered.' },
]

const RUNS = [
  { n: 'Run 1', state: 'superseded', note: 'Draft, DESNZ 2024 edition' },
  { n: 'Run 2', state: 'superseded', note: 'Draft, DESNZ 2025 edition adopted' },
  { n: 'Run 3', state: 'voided', note: 'Voided: Site B November diesel double-counted' },
  { n: 'Run 4', state: 'final', note: 'Final · approved by K. Boateng · 86,412 tCO₂e' },
]

/** The one dark band: five states, four runs, the voided one kept in the list. */
export function LifecycleSection() {
  return (
    <section className="landing-section landing-section--dark">
      <div className="landing-container flex flex-col gap-12">
        <Reveal className="flex max-w-2xl flex-col gap-4">
          <p className="landing-eyebrow text-accent-green">A record a verifier can rely on</p>
          <h2 className="landing-title">Nothing changes silently.</h2>
          <p className="landing-lede">
            An inventory moves through five states. Each one is a decision somebody made, with a
            reason, on a date.
          </p>
        </Reveal>

        <Reveal className="relative" step={1}>
          <div
            className="absolute top-3 right-3 left-3 hidden h-px bg-hairline md:block"
            aria-hidden
          />
          <ol className="relative grid gap-8 md:grid-cols-5">
            {STATES.map((s, i) => (
              <li key={s.name} className="flex flex-col gap-3">
                <span
                  className={`size-6 rounded-full border-2 border-bright-teal ${
                    i >= 2
                      ? i === 3
                        ? 'border-accent-green bg-accent-green'
                        : 'bg-bright-teal'
                      : 'bg-surface-sunken'
                  }`}
                  aria-hidden
                />
                <strong className="text-base text-ink">{s.name}</strong>
                <span className="text-ink-muted">{s.what}</span>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal className="landing-frame landing-frame--dark text-[13px]" step={2}>
          <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5">
            <span className="font-semibold text-ink">Runs</span>
            <span className="text-ink-muted">FY2025 · 4 runs</span>
          </div>
          <ol>
            {RUNS.map((r) => (
              <li
                key={r.n}
                className={`grid grid-cols-[4.5rem_minmax(0,1fr)_auto] gap-4 border-b border-hairline px-5 py-3 last:border-b-0 ${
                  r.state === 'voided' ? 'text-ink-faint' : 'text-ink'
                }`}
              >
                <span
                  className={
                    r.state === 'final' ? 'font-semibold text-accent-green' : 'text-ink-muted'
                  }
                >
                  {r.n}
                </span>
                <span>
                  {r.state === 'voided' ? (
                    <>
                      <s>Approved by K. Boateng</s> · voided: Site B November diesel double-counted
                    </>
                  ) : (
                    r.note
                  )}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 ${r.state === 'final' ? 'font-semibold text-accent-green' : 'text-ink-muted'}`}
                >
                  {r.state === 'final' && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  )}
                  {r.state}
                </span>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  )
}
