import { Reveal } from './Reveal'

const PILLARS = [
  {
    title: 'A record, not a spreadsheet',
    body: 'Every figure carries its evidence, its data quality tier and its history. Corrections keep both values and a reason. Nothing is overwritten.',
    icon: (
      <>
        <path d="M5 4h10l4 4v12H5z" />
        <path d="M15 4v4h4M8 13h8M8 17h8M8 9h3" />
      </>
    ),
  },
  {
    title: 'Every refusal explained',
    body: 'Owner, Preparer, Reviewer and Verifier. When the product refuses an action, the screen says why and names the role that can do it.',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </>
    ),
  },
  {
    title: 'A report that ties',
    body: 'Emissions by gas foot to the total. Scope 2 is reported both ways. Every factor is cited by publisher and edition.',
    icon: (
      <>
        <path d="M4 19h16M6 16V9M11 16V5M16 16v-7" />
        <path d="M20 7l-3-3-3 3" />
      </>
    ),
  },
]

/** Three equal cards under the hero: what the product is, in the order a buyer asks. */
export function Pillars() {
  return (
    <section aria-label="What CarbonOS is" className="pb-24 sm:pb-28">
      <div className="landing-container grid gap-6 md:grid-cols-3">
        {PILLARS.map((pillar, i) => (
          <Reveal key={pillar.title} as="article" className="landing-card" step={i}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className="text-link"
            >
              {pillar.icon}
            </svg>
            <h2 className="text-lg font-semibold tracking-[-0.01em] text-ink">{pillar.title}</h2>
            <p className="text-ink-muted">{pillar.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
