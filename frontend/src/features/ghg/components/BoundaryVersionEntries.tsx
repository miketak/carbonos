import type { BoundaryVersionEntry } from '../api'
import { describeWindow, relationshipShortLabels } from '../format'

/**
 * The legal entities a boundary version recorded, read-only, as the verifier
 * sees them (spec 03.1): one row per entity with the Table 1 facts and the
 * derived share, the membership window (spec 03.2), and the facilities beneath.
 * A zero-share entity is shown as excluded with its reason (spec 05.1).
 */
export function BoundaryVersionEntries({ entries }: { entries: BoundaryVersionEntry[] }) {
  if (entries.length === 0) {
    return <p className="mt-2 text-sm text-ink-muted">This version recorded no entities.</p>
  }
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
            <th className="px-3 py-2 font-semibold">Entity</th>
            <th className="px-3 py-2 font-semibold">Economic interest</th>
            <th className="px-3 py-2 font-semibold">Operated</th>
            <th className="px-3 py-2 font-semibold">Accounting share</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const window = describeWindow(entry.effectiveFrom, entry.effectiveTo)
            return (
              <tr key={entry.entityId} className="border-b border-teal/5 align-top last:border-0">
                <td className="px-3 py-2">
                  <span className="font-medium">{entry.entityName}</span>
                  <span className="block text-xs text-ink-muted" title={entry.table1Row}>
                    {relationshipShortLabels[entry.relationshipType]}
                    {window ? ` · ${window}` : ''}
                  </span>
                  {entry.facilities.length > 0 && (
                    <ul className="mt-1 ml-3 flex flex-col gap-0.5 border-l border-teal/15 pl-2 text-xs">
                      {entry.facilities.map((facility) => (
                        <li key={facility.facilityId}>
                          {facility.facilityName}
                          <span className="text-ink-muted"> · {facility.location}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {entry.excluded && entry.exclusionReason && (
                    <span className="mt-1 block text-xs text-ink-muted">
                      Excluded: {entry.exclusionReason}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 tabular-nums">{entry.economicInterestPercent}%</td>
                <td className="px-3 py-2">{entry.operatedByCompany ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2 font-mono font-semibold">
                  {entry.excluded ? (
                    <span
                      className="font-sans font-normal text-ink-muted"
                      title={entry.exclusionReason ?? undefined}
                    >
                      excluded
                    </span>
                  ) : (
                    `${Math.round(entry.accountingShare * 100)}%`
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
