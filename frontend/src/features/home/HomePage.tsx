import { useEffect, useState } from 'react'
import type { AccessIntent } from './landing/intent'
import { RequestAccessModal } from '../access/RequestAccessModal'
import { ClosingSection } from './landing/ClosingSection'
import { FaqSection } from './landing/FaqSection'
import { Hero } from './landing/Hero'
import { InventorySection } from './landing/InventorySection'
import { LandingNav } from './landing/LandingNav'
import { LifecycleSection } from './landing/LifecycleSection'
import { PricingSection } from './landing/PricingSection'
import { ProblemSection } from './landing/ProblemSection'
import { TrustSection } from './landing/TrustSection'

const TITLE = 'CarbonOS · The GHG inventory that survives verification'

/**
 * The public landing page at `/`. Signed-in readers use `/app`, which
 * resolves to where their work is (spec 01.6); this page is for everybody
 * else: the sustainability lead, the finance director and the verifier
 * deciding whether to ask for access.
 */
export function HomePage() {
  const [intent, setIntent] = useState<AccessIntent | null>(null)

  useEffect(() => {
    const previous = document.title
    document.title = TITLE
    // the landing's own scroll rules: anchors glide, and a section lands flush under its 64px bar
    document.documentElement.classList.add('landing-open')
    return () => {
      document.title = previous
      document.documentElement.classList.remove('landing-open')
    }
  }, [])

  return (
    <div className="landing">
      <a href="#main" className="landing-skip">
        Skip to content
      </a>
      <LandingNav onRequest={setIntent} />
      <main id="main">
        <Hero onRequest={setIntent} />
        <ProblemSection />
        <LifecycleSection />
        <InventorySection />
        <PricingSection onRequest={setIntent} />
        <TrustSection />
        <FaqSection />
        <ClosingSection onRequest={setIntent} />
      </main>
      {intent && <RequestAccessModal intent={intent} onClose={() => setIntent(null)} />}
    </div>
  )
}
