import { categoryLabel, formatCo2e } from '../format'
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
                <span className="font-medium">{line.factorName}</span>
                <span className="block text-xs text-ink-muted">{categoryLabel(line.category)}</span>
              </td>
              <td className="px-3 py-2">
                <ScopeBadge scope={line.scope} />
              </td>
              <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                {line.quantity.toLocaleString()} {line.unit}
                {line.unit.toLowerCase() !== line.factorUnit.toLowerCase() && (
                  <span className="block text-xs text-ink-muted">
                    →{' '}
                    {line.convertedQuantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}{' '}
                    {line.factorUnit}
                  </span>
                )}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {line.kgCo2ePerUnit} kg/{line.factorUnit}
              </td>
              <td className="px-3 py-2">{(line.weight * 100).toFixed(0)}%</td>
              <td className="px-3 py-2 whitespace-nowrap font-medium">{formatCo2e(line.kgCo2e)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
