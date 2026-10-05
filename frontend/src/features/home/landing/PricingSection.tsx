import { TIERS } from './landingData'
import type { AccessIntent } from './intent'
import { Reveal } from './Reveal'

export function PricingSection({ onRequest }: { onRequest: (intent: AccessIntent) => void }) {
  return (
    <section id="pricing" className="landing-section landing-section--alt">
      <div className="landing-container flex flex-col gap-10">
        <Reveal className="flex max-w-2xl flex-col gap-4">
          <p className="landing-eyebrow">Pricing, in cedis</p>
          <h2 className="landing-title">A fixed price, a clear scope, and someone accountable.</h2>
          <p className="landing-lede">
            Start with the pilot on one site, licence the platform for your own team, or have ECORIV
            deliver the first inventory. Exclusive of VAT and statutory levies. USD on request for
            the rest of West Africa.
          </p>
        </Reveal>

        <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
          {TIERS.map((tier, i) => (
            <Reveal
              key={tier.id}
              as="article"
              className={`landing-card ${tier.featured ? 'landing-card--featured' : ''}`}
              step={i}
              aria-labelledby={`tier-${tier.id}`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 id={`tier-${tier.id}`} className="text-lg font-semibold text-ink">
                  {tier.name}
                </h3>
                {tier.flag && (
                  <span className="rounded-chip bg-selected px-2 py-1 text-[11px] font-semibold tracking-[0.06em] text-link uppercase">
                    {tier.flag}
                  </span>
                )}
              </div>
              <p className="text-[13px] text-ink-muted">{tier.audience}</p>
              <p className="text-ink">
                <span className="text-[30px] leading-tight font-semibold tracking-[-0.02em]">
                  {tier.price}
                </span>{' '}
                <span className="text-[13px] text-ink-muted">{tier.cadence}</span>
              </p>
              {tier.priceNote && (
                <p className="text-[13px] font-medium text-link">{tier.priceNote}</p>
              )}
              <ul className="flex flex-col gap-2 text-[13px] text-ink">
                {tier.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2">
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
                      className="mt-1 shrink-0 text-link"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => onRequest(tier.intent)}
                className={`landing-btn ${tier.featured ? 'landing-btn-primary' : 'landing-btn-outline'} mt-auto w-full`}
              >
                {tier.cta}
              </button>
            </Reveal>
          ))}
        </div>

        <Reveal className="grid gap-6 text-[13px] text-ink-muted md:grid-cols-3" step={2}>
          <div>
            <h3 className="mb-1.5 font-semibold text-ink">What a site and a user are</h3>
            <p>
              A site is one facility in the organizational boundary: a mine, a plant, a project
              camp. A user is a named person with a role: Owner, Preparer, Reviewer or Verifier. A
              verifier's read-only access never counts against the limit.
            </p>
          </div>
          <div>
            <h3 className="mb-1.5 font-semibold text-ink">Payment terms</h3>
            <p>
              Services packages: 25% at signing, 25% at baseline, 25% at inventory complete, 25% at
              completion. 5% off at 50% upfront, 10% off paid in full. Licences are annual, in
              advance. The pilot fee is credited against the first licence year.
            </p>
          </div>
          <div>
            <h3 className="mb-1.5 font-semibold text-ink">Consultancies and verifiers</h3>
            <p>
              Run your clients on CarbonOS instead of spreadsheets. Per-client pricing for GHG
              consultancies and verification bodies across West Africa, on request. Your data is
              yours, the PDF report is yours, and the methodology is the public GHG Protocol.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
