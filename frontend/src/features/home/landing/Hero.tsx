import type { AccessIntent } from './intent'

/**
 * The first screen: one promise, one sub-line, two calls to action, and the
 * product itself in a frame. The picture is the FY2025 inventory of the help
 * centre's example, Gye Nyame Gold, as the walkthrough left it: published,
 * with its lifecycle and its calculation runs. It is cropped above the
 * toast the capture carried, so the frame shows the page and nothing else.
 */
export function Hero({ onRequest }: { onRequest: (intent: AccessIntent) => void }) {
  return (
    <section id="top" className="landing-hero">
      <div className="landing-hero-glow" aria-hidden />
      <div className="landing-container grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">
        <div className="relative flex flex-col gap-6">
          <p
            className="landing-eyebrow animate-fade-up"
            style={{ '--stagger': 0 } as React.CSSProperties}
          >
            GHG inventories for Ghana and West Africa
          </p>
          <h1
            className="hero-title animate-fade-up"
            style={{ '--stagger': 1 } as React.CSSProperties}
          >
            The inventory that <span className="text-link">survives verification.</span>
          </h1>
          <p
            className="hero-lede animate-fade-up"
            style={{ '--stagger': 2 } as React.CSSProperties}
          >
            CarbonOS turns fuel, power and process data into a greenhouse gas inventory a verifier
            will sign.
          </p>
          <div
            className="mt-2 flex flex-wrap items-center gap-3 animate-fade-up"
            style={{ '--stagger': 3 } as React.CSSProperties}
          >
            <button
              type="button"
              onClick={() => onRequest('pilot')}
              className="landing-btn landing-btn-primary"
            >
              Ask about the pilot
            </button>
            <a href="#pricing" className="landing-btn landing-btn-ghost">
              See pricing
            </a>
          </div>
          <p
            className="text-[13px] text-ink-muted animate-fade-up"
            style={{ '--stagger': 4 } as React.CSSProperties}
          >
            GHG Protocol and ISO 14064-1. A Ghana factor pack beside UK DESNZ. Priced in cedis.
          </p>
        </div>

        <figure
          className="landing-frame animate-fade-up"
          style={{ '--stagger': 2 } as React.CSSProperties}
        >
          <div className="landing-frame-bar" aria-hidden>
            <span className="font-medium text-ink">Inventories</span>
            <span>›</span>
            <span className="font-medium text-ink">FY2025</span>
          </div>
          <img
            src="/landing/inventory-fy2025.png"
            width={1440}
            height={800}
            alt="The FY2025 inventory of Gye Nyame Gold, published: the lifecycle from draft to published, and its calculation runs with the final total of 86,412 tonnes CO2 equivalent"
            className="landing-frame-img"
            loading="eager"
            fetchPriority="high"
          />
        </figure>
      </div>
    </section>
  )
}
