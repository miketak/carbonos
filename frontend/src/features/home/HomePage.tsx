import { Link } from 'react-router-dom'
import { GlassCard } from '../../components/GlassCard'

export function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-soft-mint via-soft-mint to-bright-teal/20 p-6">
      <GlassCard className="max-w-md p-10 text-center">
        <p className="bg-gradient-to-r from-teal to-accent-green bg-clip-text text-sm font-bold tracking-widest text-transparent uppercase">
          Ecoriv
        </p>
        <h1 className="mt-2 text-3xl">CarbonOS</h1>
        <p className="mt-3 text-dark-teal/70">
          Measure. Certify. Sustain. Verified carbon data for forward-thinking companies.
        </p>
        <Link
          to="/admin/users"
          className="mt-8 inline-block rounded-lg bg-teal px-6 py-2.5 font-semibold text-white transition-colors duration-150 hover:bg-bright-teal"
        >
          Sign in
        </Link>
      </GlassCard>
    </main>
  )
}
