import { HeroSceneMount } from './HeroSceneMount'
import type { AccessIntent } from './intent'

export function Hero({ onRequest }: { onRequest: (intent: AccessIntent) => void }) {
  return (
    <section id="top" className="landing-hero">
      <div className="landing-container grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-6">
        <div className="relative z-10 pt-16 lg:pt-8">
          <p
            className="hero-eyebrow animate-fade-up"
            style={{ '--stagger': 0 } as React.CSSProperties}
          >
            <span className="hero-eyebrow-dot" aria-hidden />
            The operating system for GHG inventories
          </p>
          <h1
            className="hero-title animate-fade-up"
            style={{ '--stagger': 1 } as React.CSSProperties}
          >
            The GHG inventory that <span className="hero-title-accent">survives verification.</span>
          </h1>
          <p
            className="hero-lede animate-fade-up"
            style={{ '--stagger': 2 } as React.CSSProperties}
          >
            CarbonOS turns fuel, power and process data into a greenhouse gas inventory a verifier
            will sign.
          </p>
          <div
            className="mt-8 flex flex-wrap items-center gap-3 animate-fade-up"
            style={{ '--stagger': 3 } as React.CSSProperties}
          >
            <button
              type="button"
              onClick={() => onRequest('pilot')}
              className="landing-btn landing-btn-primary"
            >
              Ask about the pilot
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
            <a href="#pricing" className="landing-btn landing-btn-ghost">
              See pricing
            </a>
          </div>
        </div>
        <div className="hero-stage">
          <HeroSceneMount />
        </div>
      </div>
    </section>
  )
}
