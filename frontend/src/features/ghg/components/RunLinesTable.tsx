import { categoryLabel, formatCo2e, formatPeriod, leaseLabels } from '../format'
import { ScopeBadge } from './badges'
import type { RunLine } from '../api'

/** The per-activity snapshot lines of a run, weight and CO₂e included. */
export function RunLinesTable({ lines }: { lines: RunLine[] }) {
  if (lines.length === 0) {
    return <p className="text-sm text-ink-muted">No activity fell inside this run's period.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
            <th className="px-3 py-2 font-semibold">Facility</th>
            <th className="px-3 py-2 font-semibold">Source</th>
            <th className="px-3 py-2 font-semibold">Scope</th>
            <th className="px-3 py-2 font-semibold">Quantity</th>
            <th className="px-3 py-2 font-semibold">Factor</th>
            <th className="px-3 py-2 font-semibold">Weight</th>
            <th className="px-3 py-2 font-semibold">CO₂e</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id} className="border-b border-teal/5 last:border-0">
              <td className="px-3 py-2">{line.facilityName}</td>
              <td className="px-3 py-2">
                {line.activityType && (
                  <span className="block font-medium">
                    {line.recordRef ? (
                      <span className="mr-1 font-mono text-xs text-ink-muted">
                        {line.recordRef}
                      </span>
                    ) : null}
                    {line.activityType}
                  </span>
                )}
                <span className={line.activityType ? 'text-xs text-ink-muted' : 'font-medium'}>
                  {line.factorName}
                </span>
                <span className="block text-xs text-ink-muted">
                  {categoryLabel(line.category)}
                  {line.evidenceRef ? ` · ${line.evidenceRef}` : ''}
                  {line.dataQualityTier !== null ? ` · tier ${line.dataQualityTier}` : ''}
                </span>
                {line.evidenceFiles && (
                  <span className="block text-xs text-ink-muted">
                    Evidence: {line.evidenceFiles}
                  </span>
                )}
                {line.leaseType && (
                  <span className="block text-xs text-ink-muted">
                    {leaseLabels[line.leaseType]}
                  </span>
                )}
                {/* spec 02.4: no scope total includes this line; the report discloses it apart */}
                {line.reportingBasis === 'OUTSIDE_SCOPES_NON_KYOTO' && (
                  <span className="mt-0.5 inline-block rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-800">
                    Outside the scopes
                  </span>
                )}
              </td>
              <td className="px-3 py-2">
                <ScopeBadge scope={line.scope} />
              </td>
              <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                {line.quantity.toLocaleString()} {line.unit}
                <span className="block text-xs text-ink-muted">
                  {formatPeriod(line.periodStart, line.periodEnd)}
                </span>
                {line.unit.toLowerCase() !== line.factorUnit.toLowerCase() && (
                  <span className="block text-xs text-ink-muted">
                    →{' '}
                    {line.convertedQuantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}{' '}
                    {line.factorUnit}
                  </span>
                )}
                {line.conversionNote && (
                  <span className="block text-xs text-ink-muted">{line.conversionNote}</span>
                )}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {line.kgCo2ePerUnit} kg/{line.factorUnit}
              </td>
              <td className="px-3 py-2">
                {(line.weight * 100).toFixed(0)}%
                {line.periodNote && (
                  <span className="block text-xs font-normal text-amber-700">
                    {line.periodNote}
                  </span>
                )}
              </td>
              <td className="px-3 py-2 whitespace-nowrap font-medium">
                {formatCo2e(line.kgCo2e)}
                {line.marketBasedKgCo2e !== null && (
                  <span className="block text-xs font-normal text-ink-muted">
                    market-based: {formatCo2e(line.marketBasedKgCo2e)}
                    {line.marketNote ? ` (${line.marketNote})` : ''}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
