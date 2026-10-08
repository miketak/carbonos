import { useDateFormat } from '../../../lib/dates'
import { Table, Td, Th } from '../../../components/Table'
import type { BoundaryVersionEntry } from '../api'
import { describeWindow, relationshipShortLabels } from '../format'

/**
 * The legal entities a boundary version recorded, read-only, as the verifier
 * sees them (spec 03.1): one row per entity with the Table 1 facts and the
 * derived share, the membership window (spec 03.2), and the facilities beneath.
 * A zero-share entity is shown as excluded with its reason (spec 05.1).
 */
export function BoundaryVersionEntries({ entries }: { entries: BoundaryVersionEntry[] }) {
  const dateFormat = useDateFormat()
  if (entries.length === 0) {
    return <p className="mt-2 text-sm text-ink-muted">This version recorded no entities.</p>
  }
  return (
    <div className="mt-3">
      <Table>
        <thead>
          <tr>
            <Th>Entity</Th>
            <Th align="right">Economic interest</Th>
            <Th>Operated</Th>
            <Th align="right">Accounting share</Th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const window = describeWindow(entry.effectiveFrom, entry.effectiveTo, dateFormat)
            return (
              <tr key={entry.entityId} className="align-top">
                <Td className="align-top">
                  <span className="font-medium">{entry.entityName}</span>
                  <span className="block text-[13px] text-ink-muted" title={entry.table1Row}>
                    {relationshipShortLabels[entry.relationshipType]}
                    {window ? ` · ${window}` : ''}
                  </span>
                  {entry.facilities.length > 0 && (
                    <ul className="mt-1.5 ml-1 flex flex-col gap-0.5 border-l border-hairline pl-3 text-[13px]">
                      {entry.facilities.map((facility) => (
                        <li key={facility.facilityId}>
                          {facility.facilityName}
                          <span className="text-ink-muted"> · {facility.location}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {entry.excluded && entry.exclusionReason && (
                    <span className="mt-1 block text-[13px] text-ink-muted">
                      Excluded: {entry.exclusionReason}
                    </span>
                  )}
                </Td>
                <Td align="right" className="align-top">
                  {entry.economicInterestPercent}%
                </Td>
                <Td className="align-top">{entry.operatedByCompany ? 'Yes' : 'No'}</Td>
                <Td align="right" className="align-top font-medium">
                  {entry.excluded ? (
                    <span
                      className="font-normal text-ink-muted"
                      title={entry.exclusionReason ?? undefined}
                    >
                      excluded
                    </span>
                  ) : (
                    `${Math.round(entry.accountingShare * 100)}%`
                  )}
                </Td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </div>
  )
}
