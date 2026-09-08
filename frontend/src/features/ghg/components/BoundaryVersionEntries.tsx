import type { BoundaryVersionEntry } from '../api'

/** The facilities a boundary version recorded, read-only, as the verifier sees them. */
export function BoundaryVersionEntries({ entries }: { entries: BoundaryVersionEntry[] }) {
  if (entries.length === 0) {
    return <p className="mt-2 text-sm text-ink-muted">This version recorded no facilities.</p>
  }
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
            <th className="px-3 py-2 font-semibold">Facility</th>
            <th className="px-3 py-2 font-semibold">Ownership %</th>
            <th className="px-3 py-2 font-semibold">Financial ctrl</th>
            <th className="px-3 py-2 font-semibold">Operational ctrl</th>
            <th className="px-3 py-2 font-semibold">Accounting share</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.facilityId} className="border-b border-teal/5 last:border-0">
              <td className="px-3 py-2 font-medium">
                {entry.facilityName}
                <span className="block text-xs font-normal text-ink-muted">{entry.location}</span>
              </td>
              <td className="px-3 py-2 tabular-nums">{entry.ownershipPercent}%</td>
              <td className="px-3 py-2">{entry.financialControl ? 'Yes' : 'No'}</td>
              <td className="px-3 py-2">{entry.operationalControl ? 'Yes' : 'No'}</td>
              <td className="px-3 py-2 font-mono font-semibold">
                {Math.round(entry.accountingShare * 100)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
