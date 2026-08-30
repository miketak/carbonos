import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GlassCard } from '../../components/GlassCard'
import { RequestAccessModal } from '../access/RequestAccessModal'

export function HomePage() {
  const [requesting, setRequesting] = useState(false)

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <GlassCard className="max-w-md p-10 text-center">
        <h1 className="bg-gradient-to-r from-teal to-accent-green bg-clip-text text-3xl font-bold text-transparent">
          CarbonOS
        </h1>
        <p className="mt-1 text-xs font-semibold tracking-[0.2em] text-ink-muted uppercase">
          by ECORIV
        </p>
        <p className="mt-3 text-ink-muted">
          Measure. Certify. Sustain. Verified carbon data for forward-thinking companies.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            to="/app"
            className="inline-block rounded-lg bg-teal-deep px-6 py-2.5 font-semibold text-white transition-colors duration-150 hover:bg-dark-teal"
          >
            Sign in
          </Link>
          <button
            type="button"
            onClick={() => setRequesting(true)}
            className="inline-block rounded-lg border-2 border-teal px-6 py-2.5 font-semibold text-link transition-colors duration-150 hover:bg-teal/10"
          >
            Request access
          </button>
        </div>
      </GlassCard>

      {requesting && <RequestAccessModal onClose={() => setRequesting(false)} />}
    </main>
  )
}
