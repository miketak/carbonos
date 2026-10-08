import { useDateFormat } from '../../../lib/dates'
import { Chip } from '../../../components/Chip'
import { Table, Td, Th } from '../../../components/Table'
import { categoryLabel, formatCo2e, formatPeriod, leaseLabels } from '../format'
import { ScopeBadge } from './badges'
import type { RunLine } from '../api'

/** The per-activity snapshot lines of a run, weight and CO₂e included. */
export function RunLinesTable({ lines }: { lines: RunLine[] }) {
  const dateFormat = useDateFormat()
  if (lines.length === 0) {
    return <p className="text-sm text-ink-muted">No activity fell inside this run's period.</p>
  }
  return (
    <Table>
      <thead>
        <tr>
          <Th className="pl-5">Facility</Th>
          <Th>Source</Th>
          <Th>Scope</Th>
          <Th align="right">Quantity</Th>
          <Th align="right">Factor</Th>
          <Th align="right">Weight</Th>
          <Th align="right" className="pr-5">
            CO₂e
          </Th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => (
          <tr key={line.id} className="align-top">
            <Td className="pl-5 align-top">{line.facilityName}</Td>
            <Td className="align-top">
              <div className="flex flex-col gap-0.5">
                {line.activityType && (
                  <span className="font-medium">
                    {line.recordRef ? (
                      <span className="mr-1.5 font-normal text-ink-muted">{line.recordRef}</span>
                    ) : null}
                    {line.activityType}
                  </span>
                )}
                <span className={line.activityType ? 'text-[13px] text-ink-muted' : 'font-medium'}>
                  {line.factorName}
                </span>
                <span className="text-[13px] text-ink-muted">
                  {categoryLabel(line.category)}
                  {line.evidenceRef ? ` · ${line.evidenceRef}` : ''}
                  {line.dataQualityTier !== null ? ` · tier ${line.dataQualityTier}` : ''}
                </span>
                {line.evidenceFiles && (
                  <span className="text-[13px] text-ink-muted">Evidence: {line.evidenceFiles}</span>
                )}
                {line.leaseType && (
                  <span className="text-[13px] text-ink-muted">{leaseLabels[line.leaseType]}</span>
                )}
                {/* spec 04.7: a line an upstream rule derived, and the line it rides on */}
                {line.derivedKind !== null && (
                  <span className="mt-0.5 flex flex-col items-start gap-0.5">
                    <Chip className="h-[22px] text-xs">Derived line</Chip>
                    {line.derivedNote && (
                      <span className="text-[13px] text-ink-muted">{line.derivedNote}</span>
                    )}
                  </span>
                )}
                {/* spec 02.4: no scope total includes this line; the report discloses it apart */}
                {line.reportingBasis === 'OUTSIDE_SCOPES_NON_KYOTO' && (
                  <Chip tone="warning" className="mt-0.5 h-[22px] self-start text-xs">
                    Outside the scopes
                  </Chip>
                )}
              </div>
            </Td>
            <Td className="align-top">
              <ScopeBadge scope={line.scope} />
            </Td>
            <Td align="right" className="align-top">
              <div className="flex flex-col items-end gap-0.5">
                <span>
                  {line.quantity.toLocaleString()} {line.unit}
                </span>
                <span className="text-[13px] text-ink-muted">
                  {formatPeriod(line.periodStart, line.periodEnd, dateFormat)}
                </span>
                {line.unit.toLowerCase() !== line.factorUnit.toLowerCase() && (
                  <span className="text-[13px] text-ink-muted">
                    →{' '}
                    {line.convertedQuantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}{' '}
                    {line.factorUnit}
                  </span>
                )}
                {line.conversionNote && (
                  <span className="text-[13px] text-ink-muted">{line.conversionNote}</span>
                )}
              </div>
            </Td>
            <Td align="right" className="align-top">
              {line.kgCo2ePerUnit} kg/{line.factorUnit}
            </Td>
            <Td align="right" className="align-top">
              {(line.weight * 100).toFixed(0)}%
              {line.periodNote && (
                <span className="block text-[13px] font-normal text-warning">
                  {line.periodNote}
                </span>
              )}
            </Td>
            <Td align="right" className="pr-5 align-top font-semibold">
              {formatCo2e(line.kgCo2e)}
              {line.marketBasedKgCo2e !== null && (
                <span className="block text-[13px] font-normal text-ink-muted">
                  market-based: {formatCo2e(line.marketBasedKgCo2e)}
                  {line.marketNote ? ` (${line.marketNote})` : ''}
                </span>
              )}
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
