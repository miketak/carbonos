import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { ScopeBadge } from './components/badges'
import { categoryLabel } from './format'
import { useEmissionFactorsQuery } from './useGhg'
import type { EmissionFactor } from './api'

/** "CO2 2.6307 · CH4 0.0001 · N2O 0.0001", listing only the gases the factor carries (spec 07.1). */
function gasSplit(factor: EmissionFactor): string {
  const parts: string[] = []
  const gases: [string, number][] = [
    ['CO₂', factor.gases.co2],
    ['CH₄', factor.gases.ch4],
    ['N₂O', factor.gases.n2o],
    ['HFCs', factor.gases.hfcs],
    ['PFCs', factor.gases.pfcs],
    ['SF₆', factor.gases.sf6],
    ['NF₃', factor.gases.nf3],
  ]
  for (const [gas, kg] of gases) {
    if (kg > 0) parts.push(`${gas} ${kg.toLocaleString(undefined, { maximumFractionDigits: 6 })}`)
  }
  if (factor.biogenicCo2KgPerUnit > 0) {
    parts.push(
      `biogenic CO₂ ${factor.biogenicCo2KgPerUnit.toLocaleString(undefined, { maximumFractionDigits: 6 })}`,
    )
  }
  return parts.join(' · ')
}

/**
 * The seeded emission-factor library: read-only, shared by every organization.
 * A factor suggests a scope and category; the accountant decides on
 * classification (spec 04.1). Per-gas components feed the report (spec 07.1).
 */
export function EmissionFactorsPage() {
  const factorsQuery = useEmissionFactorsQuery()
  const factors = factorsQuery.data

  return (
    <section>
      <div className="mb-3">
        <h1 className="text-xl">Emission factors</h1>
        <p className="text-sm text-ink-muted">
          The factor library activity records draw from. Seeded and read-only. The scope shown is
          the factor's suggestion: fuels marked "any scope" are the same physics whoever burns them,
          so a contractor's diesel lands in scope 3 with the same factor.
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
                <th className="px-4 py-3 font-semibold">Suggested scope</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Factor value</th>
                <th className="px-4 py-3 font-semibold">Gases (kg per unit)</th>
                <th className="px-4 py-3 font-semibold">Source</th>
              </tr>
            </thead>
            <tbody>
              {factors.map((factor) => (
                <tr key={factor.id} className="border-b border-teal/5 last:border-0">
                  <td className="px-4 py-3 font-medium">{factor.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <ScopeBadge scope={factor.defaultScope} />
                      {factor.scopeAgnostic && (
                        <span
                          title="Usable in scope 1 or scope 3: the scope follows who owns the source"
                          className="text-xs text-ink-muted"
                        >
                          any scope
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {categoryLabel(factor.defaultCategory)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {factor.kgCo2ePerUnit} kg CO₂e/{factor.unit}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">{gasSplit(factor)}</td>
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
