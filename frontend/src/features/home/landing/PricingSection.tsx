import { TIERS } from './landingData'
import type { AccessIntent } from './intent'
import { Reveal } from './Reveal'

export function PricingSection({ onRequest }: { onRequest: (intent: AccessIntent) => void }) {
  return (
    <section id="pricing" className="landing-section landing-section--alt">
      <div className="landing-container">
        <Reveal className="landing-head">
          <p className="landing-eyebrow">Pricing, in cedis</p>
          <h2 className="landing-title">A fixed price, a clear scope, and someone accountable.</h2>
          <p className="landing-lede">
            Start with the pilot on one site, licence the platform for your own team, or have ECORIV
            deliver the first inventory. Prices are in Ghana cedis, exclusive of VAT and statutory
            levies. USD pricing for the rest of West Africa on request.
          </p>
        </Reveal>

        <div className="tiers">
          {TIERS.map((tier, i) => (
            <Reveal
              key={tier.id}
              as="article"
              className={`tier ${tier.featured ? 'tier--featured' : ''}`}
              step={i}
              aria-labelledby={`tier-${tier.id}`}
            >
              {tier.flag && <span className="tier-flag">{tier.flag}</span>}
              <h3 id={`tier-${tier.id}`} className="tier-name">
                {tier.name}
              </h3>
              <p className="tier-audience">{tier.audience}</p>
              <p className="tier-price">
                <span className="tier-price-value">{tier.price}</span>
                <span className="tier-price-cadence">{tier.cadence}</span>
              </p>
              {tier.priceNote && <p className="tier-price-note">{tier.priceNote}</p>}
              <p className="tier-summary">{tier.summary}</p>
              <ul className="tier-list">
                {tier.includes.map((item) => (
                  <li key={item}>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
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

        <Reveal className="pricing-notes" step={2}>
          <div>
            <h3>What a site and a user are</h3>
            <p>
              A site is one facility in the organizational boundary: a mine, a plant, a project
              camp. A user is a named person with a role: Owner, Preparer, Reviewer or Verifier. A
              verifier's read-only access never counts against the limit.
            </p>
          </div>
          <div>
            <h3>Payment terms</h3>
            <p>
              Services packages: 25% at signing, 25% at baseline, 25% at inventory complete, 25% at
              completion. 5% off at 50% upfront, 10% off paid in full. Licences are annual, in
              advance. The pilot fee is credited against the first licence year.
            </p>
          </div>
          <div>
            <h3>Consultancies and verifiers</h3>
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
