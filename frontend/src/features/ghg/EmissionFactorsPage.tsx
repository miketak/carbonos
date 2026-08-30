import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { ScopeBadge } from './components/badges'
import { categoryLabel } from './format'
import { useEmissionFactorsQuery } from './useGhg'

/** The seeded emission-factor library: read-only, shared by every organization. */
export function EmissionFactorsPage() {
  const factorsQuery = useEmissionFactorsQuery()
  const factors = factorsQuery.data

  return (
    <section>
      <div className="mb-3">
        <h1 className="text-xl">Emission factors</h1>
        <p className="text-sm text-ink-muted">
          The factor library activity records draw from. Seeded and read-only.
        </p>
      </div>

      <GlassCard className="animate-fade-up overflow-x-auto">
        {factorsQuery.isPending && (
          <div aria-label="Loading emission factors" className="flex flex-col gap-2 p-4">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        )}
        {factors && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
                <th className="px-4 py-3 font-semibold">Factor</th>
                <th className="px-4 py-3 font-semibold">Scope</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Factor value</th>
                <th className="px-4 py-3 font-semibold">Source</th>
              </tr>
            </thead>
            <tbody>
              {factors.map((factor) => (
                <tr key={factor.id} className="border-b border-teal/5 last:border-0">
                  <td className="px-4 py-3 font-medium">{factor.name}</td>
                  <td className="px-4 py-3">
                    <ScopeBadge scope={factor.scope} />
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{categoryLabel(factor.category)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {factor.kgCo2ePerUnit} kg CO₂e/{factor.unit}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{factor.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>
    </section>
  )
}
