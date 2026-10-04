import { Link, useParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Banner } from '../../components/Banner'
import { Chip } from '../../components/Chip'
import type { ChipTone } from '../../components/Chip'
import { OrganizationName } from '../../components/OrganizationName'
import { PageHeader } from '../../components/PageHeader'
import { Panel } from '../../components/Panel'
import { Skeleton } from '../../components/Skeleton'
import { Table, Td, Th } from '../../components/Table'
import { accountLabel } from '../../lib/organizationLabel'
import { AnimatedCo2e } from './components/AnimatedCo2e'
import { ApproachBadge, InventoryStatusBadge, ScopeBadge } from './components/badges'
import { BoundaryVersionPanel } from './components/BoundaryVersionPanel'
import { RunLinesTable } from './components/RunLinesTable'
import { ScopeBreakdown } from './components/ScopeBreakdown'
import {
  approachLabels,
  categoryLabel,
  conventionLabels,
  exclusionLabels,
  formatCo2e,
  formatDateTime,
  formatExactKg,
  formatKg,
  formatPeriod,
  formatTonnes,
  formatTonnesOfGas,
  instrumentLabels,
  marketBasisLabels,
  outsideScopesBasisLabels,
  upstreamRuleKindPhrases,
  publicationLine,
  scopeLabels,
} from './format'
import { useReportQuery } from './useGhg'
import { assuranceLabels } from './components/ReportMetadataCard'
import type {
  BoundaryExclusionEntry,
  ExclusionReason,
  RecalculationStatus,
  Report,
  Breakdown,
  RunExclusion,
} from './api'

/** The sentence under the block of gases outside the scopes (spec 02.4); the PDF prints it too. */
const OUTSIDE_SCOPES_RULE =
  'Reported separately as optional information under Chapter 4 and Chapter 9; not included in any scope.'

/**
 * One Chapter 9 element of the report (spec 10): a panel whose head is the
 * section's numbered eyebrow. The heading sits straight under the panel so a
 * test can scope a section by the panel the heading is in.
 */
function Section({
  number,
  title,
  flush = false,
  children,
}: {
  /** The section number; a string for a lettered section such as "6a" (spec 02.4). */
  number: number | string
  title: string
  /** a section that is one table: the table meets the panel's edges */
  flush?: boolean
  children: ReactNode
}) {
  return (
    <Panel>
      <h2 className="border-b border-hairline px-5 py-3.5 text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
        <span className="mr-2">
          {typeof number === 'number' ? String(number).padStart(2, '0') : number}
        </span>
        {title}
      </h2>
      <div className={flush ? '' : 'p-5'}>{children}</div>
    </Panel>
  )
}

const recalculationTones: Record<RecalculationStatus, ChipTone> = {
  FLAGGED: 'warning',
  RECALCULATED: 'success',
  DECLINED: 'neutral',
  SUPERSEDED: 'neutral',
}

/** A download styled as the kit's button; a link, since the report is a read with no write control. */
const downloadLink =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 text-[15px] font-medium whitespace-nowrap transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none'
const secondaryLink = `${downloadLink} border-hairline-strong bg-surface text-ink hover:border-ink-muted`
const ghostLink = `${downloadLink} border-transparent text-ink hover:bg-surface-sunken`

/**
 * One run read as the inventory report, in the order Chapter 9 of the
 * Corporate Standard lists its required elements (spec 07.1): boundary,
 * operational boundary, period, emissions by scope (scope 2 both ways), each
 * gas, biogenic CO2, base year, methodology, exclusions, then the lines.
 */
export function RunDetailPage() {
  const { organizationId = '', inventoryId = '', runId = '' } = useParams()
  const reportQuery = useReportQuery(runId)
  const report = reportQuery.data
  const inventoryPath = `/app/ghg/${organizationId}/inventories/${inventoryId}`

  if (reportQuery.isPending) {
    return (
      <div aria-label="Loading report" className="flex flex-col gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40" />
      </div>
    )
  }
  if (reportQuery.isError || !report) {
    return (
      <Panel className="p-8 text-center">
        <h1 className="text-lg">Report not found</h1>
        <p className="mt-1 text-sm text-ink-muted">
          This run may have been deleted.{' '}
          <Link to={inventoryPath} className="font-semibold text-link">
            Head back to the inventory
          </Link>{' '}
          to pick another.
        </p>
      </Panel>
    )
  }

  const downloads: [string, string, string][] = [
    ['PDF report', `/api/ghg/runs/${runId}/report.pdf`, secondaryLink],
    ['Lines (CSV)', `/api/ghg/runs/${runId}/lines.csv`, ghostLink],
    ['Exclusions (CSV)', `/api/ghg/runs/${runId}/exclusions.csv`, ghostLink],
    ['Frozen inputs (JSON)', `/api/ghg/runs/${runId}/inputs.json`, ghostLink],
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ to: inventoryPath }}
        crumbs={[
          { label: 'Inventories', to: `/app/ghg/${organizationId}/inventories` },
          { label: report.period.inventoryName, to: inventoryPath },
          { label: report.run.label },
        ]}
        status={`Calculated ${formatDateTime(report.run.createdAt)}`}
        title={
          <>
            {/* the number is visual only; the label already carries it, and the heading's name stays the label */}
            <span aria-hidden="true" className="mr-3 text-[22px] font-normal text-ink-muted">
              #{String(report.run.runNo).padStart(3, '0')}
            </span>
            <span className={report.run.voided ? 'line-through' : ''}>{report.run.label}</span>
          </>
        }
        chips={
          <>
            <ApproachBadge approach={report.run.consolidationApproach} />
            {report.run.voided && <Chip tone="warning">VOIDED</Chip>}
            {report.run.isFinal && <Chip tone="primary">FINAL</Chip>}
          </>
        }
        subtitle={
          <>
            {report.company.organizationName} ({accountLabel(report.company.organizationAccountNo)})
            · {report.period.periodStart} → {report.period.periodEnd} · {report.run.activityCount}{' '}
            line{report.run.activityCount === 1 ? '' : 's'}
          </>
        }
        actions={
          <nav aria-label="Downloads" className="flex flex-wrap gap-2">
            {downloads.map(([label, href, className]) => (
              <a key={href} href={href} download className={className}>
                {label}
              </a>
            ))}
          </nav>
        }
      />

      {report.run.voided && (
        <Banner tone="danger" role="alert" title="This run is voided">
          It must not be relied on. Voided by {report.run.voidedBy ?? 'unknown'}
          {report.run.voidedAt ? ` on ${new Date(report.run.voidedAt).toLocaleString()}` : ''}:{' '}
          {report.run.voidReason}. The figures are kept on the record as calculated.
        </Banner>
      )}
      <ReportBody report={report} organizationId={organizationId} />
    </div>
  )
}

function ReportBody({ report, organizationId }: { report: Report; organizationId: string }) {
  const { company, operationalBoundary, period, emissions, methodology } = report
  const undeclared = operationalBoundary.scope3CategoriesReported.filter(
    (category) => !operationalBoundary.scope3Categories.includes(category),
  )
  const gases = report.byGas.filter((gas) => gas.gas === 'CO2' || gas.kg !== 0 || gas.kgCo2e !== 0)
  // spec 07.7: the reconciling row for factors that publish CO2e only, and the footing that ties to section 04
  const unsplit = report.byGas.find((gas) => gas.gas === 'CO2E_UNSPLIT')
  // spec 02.4: gases outside the scopes; absent on a report snapshot taken before the block existed
  const outsideScopes = report.outsideScopes ?? []
  const publishedBases = [
    ...new Set(
      outsideScopes
        .map((row) => row.informationalGwpSource)
        .filter((basis): basis is string => basis !== null && basis !== report.methodology.gwpSet),
    ),
  ]
  const byGasTotalTCo2e =
    report.byGasTotalTCo2e ?? report.byGas.reduce((sum, gas) => sum + gas.tCo2e, 0)
  const failingInstruments = emissions.marketInstruments.filter(
    (instrument) => !instrument.meetsQualityCriteria,
  )
  const baseYearPath = `/app/ghg/${organizationId}/settings/baseline`

  return (
    <>
      <Section number={0} title="Report">
        <ReportHeaderBlock header={report.header} />
        {report.correction && (
          <div className="mt-4">
            <Banner tone="warning" title={`Correction of ${report.correction.ofName}`}>
              <p>{report.correction.reason}</p>
              <p className="mt-1">
                Against the published run: {report.correction.addedLines} line
                {report.correction.addedLines === 1 ? '' : 's'} added,{' '}
                {report.correction.removedLines} removed, {report.correction.changedLines} changed;{' '}
                {report.correction.deltaKgCo2e >= 0 ? '+' : ''}
                {formatCo2e(report.correction.deltaKgCo2e)} in total.
              </p>
            </Banner>
          </div>
        )}
        {report.sincePublication && (
          <div className="mt-4 rounded-lg border border-hairline p-4 text-sm">
            <p className="font-semibold">Since publication</p>
            <p className="text-[13px] text-ink-muted">
              The report above reads exactly as it was published. What came after is listed here and
              nowhere else.
            </p>
            {report.sincePublication.changedRecords.length === 0 &&
              report.sincePublication.laterInventories.length === 0 &&
              report.sincePublication.events.length === 0 && (
                <p className="mt-1 text-ink-muted">Nothing has changed since.</p>
              )}
            {report.sincePublication.changedRecords.length > 0 && (
              <ul className="mt-1 flex flex-col gap-0.5">
                {report.sincePublication.changedRecords.map((change) => (
                  <li key={`${change.activityId}:${change.field}`}>
                    <span className="font-medium">{change.activityType}</span>: {change.field}{' '}
                    {change.was} → {change.now}
                  </li>
                ))}
              </ul>
            )}
            {report.sincePublication.laterInventories.length > 0 && (
              <p className="mt-1 text-ink-muted">
                Later inventories:{' '}
                {report.sincePublication.laterInventories
                  .map((later) => `${later.name} (${later.periodLabel})`)
                  .join(', ')}
                .
              </p>
            )}
            {report.sincePublication.events.length > 0 && (
              <p className="mt-1 text-ink-muted">
                {report.sincePublication.events.length} act
                {report.sincePublication.events.length === 1 ? '' : 's'} on the inventory since
                publication; see its history.
              </p>
            )}
          </div>
        )}
      </Section>

      <Section number={1} title="Company and organizational boundary">
        <div className="flex flex-wrap items-center gap-3">
          <OrganizationName
            name={company.organizationName}
            accountNo={company.organizationAccountNo}
            className="text-lg font-semibold"
          />
          <ApproachBadge approach={company.consolidationApproach} />
        </div>
        {company.boundaryVersion ? (
          <>
            <p className="mt-2 text-sm text-ink-muted">
              Boundary version {company.boundaryVersion.version.versionNo}
              {report.header.boundaryVersionCount
                ? ` of ${report.header.boundaryVersionCount}`
                : ''}
              : the organizational boundary this run computed its accounting shares from, exactly as
              it stood when frozen (Corporate Standard, chapter 3). The report version in the header
              counts corrections, not freezes.
            </p>
            <BoundaryVersionPanel versionId={company.boundaryVersion.version.id} />
          </>
        ) : (
          <p className="mt-2 text-sm text-ink-muted">
            This run predates boundary versioning and cites no boundary version. Each of its lines
            still records the accounting share it used.
          </p>
        )}
      </Section>

      <Section number={2} title="Operational boundary">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-ink-muted">Scopes covered:</span>
          {operationalBoundary.scopesCovered.length === 0 && (
            <span className="text-sm text-ink-muted">none</span>
          )}
          {operationalBoundary.scopesCovered.map((scope) => (
            <ScopeBadge key={scope} scope={scope} />
          ))}
        </div>
        <p className="mt-4 text-sm font-medium">Scope 3 categories declared</p>
        {report.byScope3Category.length === 0 ? (
          <p className="text-sm text-ink-muted">No scope 3 categories declared or reported.</p>
        ) : (
          <div className="mt-1">
            <Table aria-label="Scope 3 declaration">
              <thead>
                <tr>
                  <Th>Category</Th>
                  <Th>Declared</Th>
                  <Th align="right">Lines</Th>
                  <Th align="right">t CO₂e</Th>
                </tr>
              </thead>
              <tbody>
                {report.byScope3Category.map((row) => (
                  <tr key={row.category}>
                    <Td>{categoryLabel(row.category)}</Td>
                    <Td className="text-ink-muted">
                      {row.declared ? 'yes' : 'no: reported, not declared'}
                    </Td>
                    <Td align="right">{row.lineCount}</Td>
                    <Td align="right" className="whitespace-normal">
                      {row.lineCount === 0
                        ? `declared, not quantified: ${row.notQuantifiedReason ?? 'no reason recorded'}`
                        : formatTonnes(row.tCo2e)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
        {undeclared.length > 0 && (
          <p className="mt-3 text-sm text-warning">
            Reported this run but not declared:{' '}
            {undeclared.map((category) => categoryLabel(category)).join(', ')}.
          </p>
        )}
        {operationalBoundary.exclusionsRationale && (
          <p className="mt-3 text-sm">
            <span className="text-ink-muted">Why other categories are excluded: </span>
            {operationalBoundary.exclusionsRationale}
          </p>
        )}
      </Section>

      <Section number={3} title="Reporting period">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold">{period.inventoryName}</span>
          <span className="text-sm text-ink-muted">
            {period.periodStart} → {period.periodEnd}
          </span>
          <InventoryStatusBadge
            inventory={{
              status: period.status,
              currentBoundaryVersionNo: report.run.boundaryVersionNo,
              supersededById: period.supersededById,
            }}
          />
        </div>
        {period.publishedAt && (
          <p className="mt-2 text-sm text-ink-muted">
            Published {new Date(period.publishedAt).toLocaleString()}.
          </p>
        )}
        {period.supersededById && (
          <p className="mt-1 text-sm text-warning">
            Superseded by a correction: a later inventory restates this period.
          </p>
        )}
      </Section>

      <Section number={4} title="Emissions by scope">
        <p className="text-sm text-ink-muted">Total emissions</p>
        <AnimatedCo2e
          kg={emissions.totalKgCo2e}
          className="mt-1 block text-3xl font-semibold tracking-tight"
        />
        <div className="mt-5">
          <ScopeBreakdown run={report.run} />
        </div>
        <div className="mt-5">
          <Table>
            <tbody>
              <tr>
                <Td>{scopeLabels.SCOPE_1}</Td>
                <Td align="right">{formatTonnes(emissions.scope1TCo2e)}</Td>
              </tr>
              <tr>
                <Td>{scopeLabels.SCOPE_2}, location-based</Td>
                <Td align="right">{formatTonnes(emissions.scope2LocationBasedTCo2e)}</Td>
              </tr>
              <tr>
                <Td>{scopeLabels.SCOPE_2}, market-based</Td>
                <Td align="right">{formatTonnes(emissions.scope2MarketBasedTCo2e)}</Td>
              </tr>
              <tr>
                <Td>{scopeLabels.SCOPE_3}</Td>
                <Td align="right">{formatTonnes(emissions.scope3TCo2e)}</Td>
              </tr>
              <tr className="font-semibold">
                <Td className="border-b-0">Total</Td>
                <Td align="right" className="border-b-0">
                  {formatTonnes(emissions.totalTCo2e)}
                </Td>
              </tr>
            </tbody>
          </Table>
        </div>
        <BreakdownTables report={report} />
        <p className="mt-3 text-[13px] text-ink-muted">
          Figures in metric tonnes to three decimals; each line below keeps its kilograms. The total
          uses the location-based scope 2 figure. Market-based basis:{' '}
          {marketBasisLabels[emissions.scope2MarketBasis]}.
          {emissions.baseYearMarketBasedIsProxy === true &&
            ' The base year held no instrument: its market-based figure is the grid average standing as a proxy.'}
          {emissions.baseYearMarketBasedIsProxy === false &&
            ' The base year reports scope 2 both ways.'}
        </p>
        <div className="mt-4">
          {emissions.marketInstruments.length > 0 && (
            <>
              <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
                Contractual instruments
              </p>
              <ul className="mt-2 flex flex-col gap-3 text-sm">
                {emissions.marketInstruments.map((instrument) => (
                  <li key={instrument.id}>
                    <span className="font-medium">{instrument.facilityName}</span>
                    <span className="text-ink-muted">
                      {' '}
                      · {instrumentLabels[instrument.instrumentType]} · {instrument.kgCo2ePerKwh} kg
                      CO₂e/kWh
                      {instrument.coveredKwh !== null
                        ? ` · covers ${(instrument.coveredKwh / 1000).toLocaleString()} MWh`
                        : ' · covers every kWh'}
                      {instrument.periodStart || instrument.periodEnd
                        ? ` (${instrument.periodStart ?? 'period start'} to ${instrument.periodEnd ?? 'period end'})`
                        : ''}{' '}
                      · {instrument.source}
                      {instrument.meetsQualityCriteria
                        ? ' · meets every Scope 2 Quality Criterion'
                        : ` · not applied: ${instrument.notMetCount} criteria not met, ${instrument.unansweredCount} unanswered`}
                      {instrument.qualityNotes ? `: ${instrument.qualityNotes}` : ''}
                    </span>
                    <span className="block text-[13px] text-ink-muted">
                      {[
                        instrument.certificateId ? `certificate ${instrument.certificateId}` : null,
                        instrument.registry ? `registry ${instrument.registry}` : null,
                        instrument.vintage ? `vintage ${instrument.vintage}` : null,
                        instrument.retirementDate ? `retired ${instrument.retirementDate}` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'no certificate details recorded'}
                    </span>
                    <ol
                      aria-label={`${instrument.facilityName} criteria`}
                      className="mt-1 grid gap-x-4 gap-y-0.5 text-[13px] text-ink-muted md:grid-cols-2"
                    >
                      {instrument.criteria.map((criterion, index) => (
                        <li key={criterion.code}>
                          <span
                            className={`font-medium ${
                              criterion.answer === 'MET'
                                ? 'text-success'
                                : criterion.answer === 'NOT_MET'
                                  ? 'text-danger'
                                  : 'text-warning'
                            }`}
                          >
                            {index + 1}.{' '}
                            {criterion.answer === 'MET'
                              ? 'met'
                              : criterion.answer === 'NOT_MET'
                                ? 'not met'
                                : 'unanswered'}
                          </span>{' '}
                          {criterion.title}
                        </li>
                      ))}
                    </ol>
                  </li>
                ))}
              </ul>
            </>
          )}
          {emissions.marketInstruments.length === 0 && (
            <p className="text-[13px] text-ink-muted">
              No contractual instruments were held; the market-based figure is still reported, as
              the Scope 2 Guidance requires of any company in a market with instruments.
            </p>
          )}
          {failingInstruments.length > 0 && (
            <p className="mt-1 text-[13px] text-warning">
              {failingInstruments.length === 1
                ? 'One instrument'
                : `${failingInstruments.length} instruments`}{' '}
              did not meet the criteria and {failingInstruments.length === 1 ? 'was' : 'were'} not
              applied, as the lines state.
            </p>
          )}
          <p className="mt-1 text-[13px] text-ink-muted">{emissions.residualMixDisclosure}</p>
        </div>
      </Section>

      <Section number={5} title="Emissions by gas">
        <Table>
          <thead>
            <tr>
              <Th>Gas</Th>
              <Th align="right">Mass of gas</Th>
              <Th align="right">CO₂e</Th>
            </tr>
          </thead>
          <tbody>
            {gases.map((gas) => (
              <tr key={gas.gas}>
                <Td className="font-medium">
                  {gas.gas === 'CO2E_UNSPLIT' ? 'CO₂e from factors without a gas split' : gas.gas}
                </Td>
                <Td align="right">
                  {gas.kg === null ? (
                    <span className="text-ink-muted">not separable</span>
                  ) : (
                    formatKg(gas.kg)
                  )}
                </Td>
                <Td align="right">{formatTonnes(gas.tCo2e)}</Td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold">
              <Td className="border-b-0" colSpan={2}>
                Total (scope 2 location-based), ties to section 04
              </Td>
              <Td align="right" className="border-b-0">
                {formatTonnes(byGasTotalTCo2e)}
              </Td>
            </tr>
          </tfoot>
        </Table>
        <p className="mt-2 text-[13px] text-ink-muted">
          The market-based scope 2 figure is not split by gas; its instruments and balance are in
          section 04.
        </p>
        {unsplit && (
          <p className="mt-2 text-[13px] text-ink-muted">
            <span className="font-semibold">CO₂e from factors without a gas split</span>
            {(unsplit.factors ?? []).length > 0
              ? `: ${(unsplit.factors ?? []).join('; ')}. `
              : '. '}
            Factors that publish CO₂e only are listed on one row. Their CO₂, CH₄ and N₂O are not
            separable; the source did not publish them.
          </p>
        )}
        <p className="mt-2 text-[13px] text-ink-muted">
          Each gas in mass and in CO₂e under IPCC {methodology.gwpSet} 100-year potentials.
          {methodology.gwpSet === 'AR6'
            ? ' Methane of fossil origin is converted at 29.8 and biogenic methane at 27.9.'
            : ' Methane is converted at 28 whatever its origin.'}
          {methodology.multipleAssessmentReports
            ? ` More than one assessment report was used: a blend whose composition is not recorded keeps the CO₂e its source stated under IPCC ${methodology.assessmentReports.slice(1).join(' and ')}.`
            : ' HFC and PFC blends are converted from their component gases with the same potentials.'}
        </p>
      </Section>

      <Section number={6} title="Biogenic CO₂">
        <p className="text-sm">
          <span className="font-semibold">{formatTonnesOfGas(report.biogenicCo2T)}</span>
          <span className="text-ink-muted">
            {' '}
            ({formatKg(report.biogenicCo2Kg)}) of biogenic CO₂, reported separately and outside the
            scopes.
          </span>
        </p>
      </Section>

      {/* spec 02.4: a Montreal Protocol gas is not a Kyoto gas; its mass is disclosed, its CO2e informs only */}
      <Section number="6a" title="Gases outside the scopes (Montreal Protocol)">
        {outsideScopes.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No gases outside the scopes were reported. {OUTSIDE_SCOPES_RULE}
          </p>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Gas</Th>
                  <Th align="right">Mass (kg)</Th>
                  <Th>Basis</Th>
                  <Th>CO₂e for information</Th>
                  <Th>Records</Th>
                </tr>
              </thead>
              <tbody>
                {outsideScopes.map((row) => (
                  <tr key={row.gas}>
                    <Td>{row.gas}</Td>
                    <Td align="right">{formatExactKg(row.kg)}</Td>
                    <Td className="text-[13px] text-ink-muted">
                      {outsideScopesBasisLabels[row.basis]}
                    </Td>
                    <Td className="text-[13px] text-ink-muted">
                      {row.kgCo2eInformational === null
                        ? 'not quantified'
                        : `${formatExactKg(row.kgCo2eInformational)} CO₂e` +
                          (row.informationalGwpSource
                            ? `, ${row.informationalGwpSource} as published`
                            : '')}
                    </Td>
                    <Td className="text-[13px] text-ink-muted">{row.recordRefs.join(', ')}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <p className="mt-3 text-[13px] text-ink-muted">{OUTSIDE_SCOPES_RULE}</p>
            {publishedBases.length > 0 && (
              <p className="mt-1 text-[13px] text-ink-muted">
                {publishedBases.join(' and ')} potentials as published; not restated to{' '}
                {report.methodology.gwpSet}.
              </p>
            )}
          </>
        )}
      </Section>

      <Section number={7} title="Base year">
        {report.baseYear ? (
          <BaseYearSection baseYear={report.baseYear} path={baseYearPath} />
        ) : (
          <p className="text-sm text-ink-muted">
            No base year designated. Set one under Settings,{' '}
            <Link to={baseYearPath} className="font-semibold text-link">
              Baseline and targets
            </Link>
            .
          </p>
        )}
      </Section>

      <Section number={8} title="Methodology">
        <p className="text-sm">{methodology.statement}</p>
        <p className="mt-2 text-sm text-ink-muted">
          GWP set: IPCC {methodology.gwpSet}, 100-year. Assessment reports used:{' '}
          {methodology.assessmentReports.join(', ')}.
        </p>
        {/* spec 04.7: the rules that quantified category 3, and how many lines each derived */}
        {methodology.upstreamRules && methodology.upstreamRules.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold">Upstream rules (category 3)</h3>
            <ul className="mt-1 list-disc pl-5 text-sm text-ink-muted">
              {methodology.upstreamRules.map((rule) => (
                <li key={`${rule.primaryFactorName}-${rule.upstreamFactorName}-${rule.kind}`}>
                  {rule.primaryFactorName} → {rule.upstreamFactorName} (
                  {upstreamRuleKindPhrases[rule.kind]}, {rule.lineCount} line
                  {rule.lineCount === 1 ? '' : 's'})
                </li>
              ))}
            </ul>
          </div>
        )}
        <FactorTable factors={report.factors} />
        <DataQualityBlock dataQuality={report.dataQuality} />
      </Section>

      <Section number={9} title="Exclusions">
        <BoundaryExclusions exclusions={report.boundaryExclusions} />
        <ExclusionSummaryTable summary={report.exclusionSummary} />
        <Exclusions exclusions={report.exclusions} />
      </Section>

      <Section number={10} title="Snapshot lines" flush={report.lines.length > 0}>
        <RunLinesTable lines={report.lines} />
      </Section>
    </>
  )
}

function BaseYearSection({
  baseYear,
  path,
}: {
  baseYear: NonNullable<Report['baseYear']>
  path: string
}) {
  return (
    <div className="flex flex-col gap-3 text-sm">
      <p>
        <span className="font-semibold">{baseYear.periodLabel}</span>
        <span className="text-ink-muted">
          {' '}
          · {baseYear.inventoryName} · significance threshold {baseYear.thresholdPercent}%, applied
          to each change and to the cumulative effect since the base year
        </span>
      </p>
      <p>
        <span className="text-ink-muted">Why this year: </span>
        {baseYear.reason}
      </p>
      <p>
        <span className="text-ink-muted">Mid-year structural changes: </span>
        {conventionLabels[baseYear.structuralChangeConvention]}
      </p>
      {!baseYear.gwpSetMatches && (
        <p className="text-warning">
          This run and the base year use different GWP sets; the required-gases amendment recommends
          the same set for both.
        </p>
      )}
      {baseYear.originalBase ? (
        <p>
          <span className="text-ink-muted">
            Base-year emissions ({baseYear.originalBase.label}):{' '}
          </span>
          <span className="font-semibold">{formatCo2e(baseYear.originalBase.totalKgCo2e)}</span>
        </p>
      ) : (
        <p className="text-ink-muted">The base-year inventory has no final run yet.</p>
      )}
      {baseYear.recalculations.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
            Recalculation history
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {baseYear.recalculations.map(({ decision, recalculatedBase }) => (
              <li key={decision.id} className="rounded-lg border border-hairline p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Chip tone={recalculationTones[decision.status]}>{decision.status}</Chip>
                  <span className="text-[13px] text-ink-muted">
                    {decision.affectedPercent !== null
                      ? `${decision.affectedPercent}% of base-year emissions, ${decision.aboveThreshold ? 'above' : 'below'} the threshold`
                      : ''}
                  </span>
                </div>
                <p className="mt-1">{decision.reason}</p>
                {decision.decisionNote && (
                  <p className="text-ink-muted">Decision: {decision.decisionNote}</p>
                )}
                {decision.decidedBy && (
                  <p className="text-[13px] text-ink-muted">
                    Decided by {decision.decidedBy}
                    {decision.decidedAt ? `, ${new Date(decision.decidedAt).toLocaleString()}` : ''}
                  </p>
                )}
                {recalculatedBase && (
                  <p className="mt-1">
                    <span className="text-ink-muted">
                      Recalculated base ({recalculatedBase.label}):{' '}
                    </span>
                    <span className="font-semibold">
                      {formatCo2e(recalculatedBase.totalKgCo2e)}
                    </span>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {baseYear.profile.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
            Emissions profile over time
          </p>
          <Table className="mt-1">
            <thead>
              <tr>
                <Th>Year</Th>
                <Th>Inventory</Th>
                <Th align="right">Final run</Th>
                <Th align="right">Recalculated</Th>
              </tr>
            </thead>
            <tbody>
              {baseYear.profile.map((entry) => (
                <tr key={entry.inventoryId}>
                  <Td>{entry.periodLabel}</Td>
                  <Td>{entry.name}</Td>
                  <Td align="right">
                    {entry.totalKgCo2e === null ? 'not yet final' : formatCo2e(entry.totalKgCo2e)}
                  </Td>
                  <Td align="right">
                    {entry.recalculatedTotalKgCo2e === null
                      ? ''
                      : formatCo2e(entry.recalculatedTotalKgCo2e)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
      {(baseYear.otherViews ?? []).length > 0 && (
        <div>
          <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
            Other views
          </p>
          <p className="text-[13px] text-ink-muted">
            Inventories over the same periods under another consolidation approach or GWP set. They
            are not years of the base year&apos;s series and do not compare with it.
          </p>
          <Table className="mt-1">
            <thead>
              <tr>
                <Th>Period</Th>
                <Th>Inventory</Th>
                <Th>Approach / GWP</Th>
                <Th align="right">Final run</Th>
              </tr>
            </thead>
            <tbody>
              {(baseYear.otherViews ?? []).map((entry) => (
                <tr key={entry.inventoryId}>
                  <Td>{entry.periodLabel}</Td>
                  <Td>{entry.name}</Td>
                  <Td>
                    {approachLabels[entry.consolidationApproach]} / {entry.gwpSet}
                  </Td>
                  <Td align="right">
                    {entry.totalKgCo2e === null ? 'not yet final' : formatCo2e(entry.totalKgCo2e)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
      <Link to={path} className="font-semibold text-link">
        Base year and recalculation policy →
      </Link>
    </div>
  )
}

/** Operations deliberately left out of the boundary, with their reasons (Chapter 9, spec 07.2). */
function BoundaryExclusions({ exclusions }: { exclusions: BoundaryExclusionEntry[] }) {
  if (exclusions.length === 0) return null
  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold">
        Operations excluded from the boundary{' '}
        <span className="font-normal text-ink-muted">
          ({exclusions.length} {exclusions.length === 1 ? 'operation' : 'operations'})
        </span>
      </h3>
      <Table className="mt-1">
        <tbody>
          {exclusions.map((exclusion) => (
            <tr key={`${exclusion.entityId}:${exclusion.facilityId ?? 'entity'}`}>
              <Td className="font-medium">
                {exclusion.facilityName ?? `${exclusion.entityName} (whole entity)`}
              </Td>
              <Td className="text-ink-muted">
                {exclusion.facilityName ? exclusion.entityName : ''}
              </Td>
              <Td>{exclusionLabels[exclusion.reason]}</Td>
              <Td className="text-ink-muted">{exclusion.detail ?? ''}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

/** The data-quality table and the uncertainty statement (spec 04.4, ISO 14064-1 section 9.3.1). */
function DataQualityBlock({ dataQuality }: { dataQuality: Report['dataQuality'] }) {
  return (
    <div className="mt-5">
      <h3 className="text-sm font-semibold">Data quality and uncertainty</h3>
      <p className="mt-1 text-sm">{dataQuality.statement}</p>
      {dataQuality.uncertaintyStatement && (
        <p className="mt-1 text-sm">{dataQuality.uncertaintyStatement}</p>
      )}
      {dataQuality.byTier.length > 0 && (
        <Table aria-label="Data quality by tier" className="mt-2">
          <thead>
            <tr>
              <Th>Tier</Th>
              <Th>Quality</Th>
              <Th align="right">Scope 1</Th>
              <Th align="right">Scope 2</Th>
              <Th align="right">Scope 3</Th>
              <Th align="right">Share</Th>
            </tr>
          </thead>
          <tbody>
            {dataQuality.byTier.map((row) => (
              <tr key={row.tier}>
                <Td>{row.tier}</Td>
                <Td>{row.label}</Td>
                <Td align="right">{formatCo2e(row.scope1KgCo2e)}</Td>
                <Td align="right">{formatCo2e(row.scope2KgCo2e)}</Td>
                <Td align="right">{formatCo2e(row.scope3KgCo2e)}</Td>
                <Td align="right">{row.sharePercent}%</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  )
}

/** Excluded records per reason with the emissions estimated to be left out (spec 04.4). */
function ExclusionSummaryTable({ summary }: { summary: Report['exclusionSummary'] }) {
  if (summary.length === 0) return null
  return (
    <Table aria-label="Exclusions by reason" className="mb-5">
      <thead>
        <tr>
          <Th>Reason</Th>
          <Th align="right">Records</Th>
          <Th align="right">Estimated left out</Th>
        </tr>
      </thead>
      <tbody>
        {summary.map((row) => (
          <tr key={row.reason}>
            <Td>{exclusionLabels[row.reason]}</Td>
            <Td align="right">{row.recordCount}</Td>
            {/* spec 04.8: a record nobody sized never prints as a bare 0 */}
            <Td align="right">
              {row.reason === 'OUTSIDE_SCOPES_NON_KYOTO' ? (
                <span className="text-[13px] text-ink-muted">
                  see Gases outside the scopes (Montreal Protocol)
                </span>
              ) : (
                <>
                  {row.estimatedCount > 0 && (
                    <>
                      {formatCo2e(row.estimatedKgCo2e)}
                      <span className="block text-[13px] text-ink-muted">
                        estimated over {row.estimatedCount} record
                        {row.estimatedCount === 1 ? '' : 's'}
                      </span>
                    </>
                  )}
                  {row.emitsNothingCount > 0 && (
                    <span className="block text-[13px] text-ink-muted">
                      {row.emitsNothingCount} emits nothing
                    </span>
                  )}
                  {row.unestimatedCount > 0 && (
                    <span className="block text-[13px] text-ink-muted">
                      {row.unestimatedCount} not estimated
                    </span>
                  )}
                  {row.estimatedCount === 0 &&
                    row.emitsNothingCount === 0 &&
                    row.unestimatedCount === 0 && (
                      <span className="text-[13px] text-ink-muted">not estimated</span>
                    )}
                </>
              )}
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

/** Exclusions grouped by their documented reason (Chapter 9). */
function Exclusions({ exclusions }: { exclusions: RunExclusion[] }) {
  if (exclusions.length === 0) {
    return <p className="text-sm text-ink-muted">No exclusions.</p>
  }
  const groups = new Map<ExclusionReason, RunExclusion[]>()
  for (const exclusion of exclusions) {
    groups.set(exclusion.exclusionReason, [
      ...(groups.get(exclusion.exclusionReason) ?? []),
      exclusion,
    ])
  }
  return (
    <div className="flex flex-col gap-5">
      {[...groups.entries()].map(([reason, rows]) => (
        <div key={reason}>
          <h3 className="text-sm font-semibold">
            {exclusionLabels[reason]}{' '}
            <span className="font-normal text-ink-muted">
              ({rows.length} record{rows.length === 1 ? '' : 's'})
            </span>
          </h3>
          <Table className="mt-1">
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <Td className="font-medium">{row.activityType}</Td>
                  <Td className="text-ink-muted">{row.facilityName}</Td>
                  <Td className="whitespace-nowrap">
                    {row.quantity.toLocaleString()} {row.unit}
                  </Td>
                  <Td className="whitespace-nowrap text-ink-muted">
                    {formatPeriod(row.periodStart, row.periodEnd)}
                  </Td>
                  <Td className="text-ink-muted">
                    {row.exclusionDetail ?? ''}
                    {row.exclusionJustification && (
                      <span className="block">{row.exclusionJustification}</span>
                    )}
                  </Td>
                  <Td align="right" className="text-ink-muted">
                    {row.estimateState === 'NOT_ESTIMATED' && 'not estimated'}
                    {row.estimateState === 'EMITS_NOTHING' && 'emits nothing'}
                    {row.estimateState === 'ESTIMATED' &&
                      row.estimatedKgCo2e !== null &&
                      `~${formatCo2e(row.estimatedKgCo2e)}`}
                    {row.gas !== null && row.gas}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ))}
    </div>
  )
}

/**
 * The header block (spec 07.4): the reporting entity, who prepared and approved
 * the report, its version and assurance. A two-column table read as the
 * mockup's key-value list: labels muted on the left, values on the right.
 */
function ReportHeaderBlock({ header }: { header: Report['header'] }) {
  const rows: [string, string][] = [
    [
      'Reporting entity',
      [`${header.organizationName} (${accountLabel(header.organizationAccountNo)})`, header.address]
        .filter(Boolean)
        .join(', '),
    ],
    ['Contact', header.contact ?? 'not recorded'],
    ['Reporting period', `${header.periodLabel} (${header.periodStart} → ${header.periodEnd})`],
    [
      'Prepared by',
      `${header.preparedBy ?? 'not recorded'}, ${new Date(header.preparedAt).toLocaleString()}`,
    ],
    ['Approved by', header.approvedBy ?? 'not yet approved'],
    [
      'Published',
      header.publishedAt
        ? `${new Date(header.publishedAt).toLocaleString()} by ${header.publishedBy ?? 'unknown'}`
        : 'not published',
    ],
    [
      'Report version',
      `${header.version}${header.supersedes.length > 0 ? `, supersedes ${header.supersedes.join(', ')}` : ''}${header.supersededBy ? `; superseded by ${header.supersededBy}` : ''}`,
    ],
    [
      'Final designated',
      header.finalDesignatedBy
        ? `by ${header.finalDesignatedBy}${header.finalDesignatedAt ? ` on ${new Date(header.finalDesignatedAt).toLocaleDateString()}` : ''}${header.finalNote ? `: ${header.finalNote}` : ''}`
        : 'not designated',
    ],
    [
      'Assurance',
      header.assuranceLevel === 'UNVERIFIED'
        ? assuranceLabels.UNVERIFIED
        : `${assuranceLabels[header.assuranceLevel]}${header.assuranceProvider ? ` by ${header.assuranceProvider}` : ''}${header.assuranceStatement ? ` (${header.assuranceStatement})` : ''}`,
    ],
  ]
  return (
    <table aria-label="Report header" className="w-full border-collapse text-left text-sm">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th
              scope="row"
              className="w-44 py-1.5 pr-4 align-top font-normal whitespace-nowrap text-ink-muted"
            >
              {label}
            </th>
            <td className="py-1.5">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function BreakdownTable({ title, rows }: { title: string; rows: Breakdown[] }) {
  if (rows.length === 0) return null
  return (
    <div className="mt-5">
      <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
        {title}
      </p>
      <Table aria-label={title} className="mt-1">
        <thead>
          <tr>
            <Th>Name</Th>
            <Th align="right">Scope 1</Th>
            <Th align="right">Scope 2 (location)</Th>
            <Th align="right">Scope 2 (market)</Th>
            <Th align="right">Scope 3</Th>
            <Th align="right">Total</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <Td>{row.name}</Td>
              <Td align="right">{formatTonnes(row.scope1KgCo2e / 1000)}</Td>
              <Td align="right">{formatTonnes(row.scope2KgCo2e / 1000)}</Td>
              <Td align="right">{formatTonnes(row.scope2MarketBasedKgCo2e / 1000)}</Td>
              <Td align="right">{formatTonnes(row.scope3KgCo2e / 1000)}</Td>
              <Td align="right" className="font-semibold">
                {formatTonnes(row.totalTCo2e)}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

/** Chapter 9: scope 3 by category is required where scope 3 is reported; facility, entity and country breakdowns are recommended. */
function BreakdownTables({ report }: { report: Report }) {
  return (
    <>
      {report.byScope3Category.length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
            Scope 3 by category
          </p>
          <Table aria-label="Scope 3 by category" className="mt-1">
            <tbody>
              {report.byScope3Category.map((row) => (
                <tr key={row.category}>
                  <Td>{categoryLabel(row.category)}</Td>
                  <Td align="right" className="text-[13px] text-ink-muted">
                    {row.lineCount} line{row.lineCount === 1 ? '' : 's'}
                  </Td>
                  <Td align="right">{formatTonnes(row.tCo2e)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
      <BreakdownTable title="By facility" rows={report.byFacility} />
      <BreakdownTable title="By legal entity" rows={report.byEntity} />
      <BreakdownTable title="By country" rows={report.byCountry} />
      {report.intensity.length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
            Intensity
          </p>
          <ul className="mt-1 text-sm">
            {report.intensity.map((row) => (
              <li key={row.name}>
                {row.tCo2ePerUnit.toLocaleString(undefined, { maximumFractionDigits: 6 })} t CO₂e
                per {row.unit} of {row.name.toLowerCase()} ({row.value.toLocaleString()} {row.unit})
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

/** Every factor as the run applied it (spec 07.4): value, unit, gas split, GWP set and source. */
function FactorTable({ factors }: { factors: Report['factors'] }) {
  if (factors.length === 0) return null
  const gases = (f: Report['factors'][number]) =>
    [
      f.co2 > 0 ? `CO₂ ${f.co2}` : '',
      f.ch4 > 0 ? `CH₄ ${f.ch4} (${f.ch4Fossil ? 'fossil' : 'biogenic'})` : '',
      f.n2o > 0 ? `N₂O ${f.n2o}` : '',
      f.hfcsKg > 0 ? `HFCs ${f.hfcsKg}${f.blendComposition ? ` (${f.blendComposition})` : ''}` : '',
      f.pfcsKg > 0 ? `PFCs ${f.pfcsKg}` : '',
      f.sf6 > 0 ? `SF₆ ${f.sf6}` : '',
      f.nf3 > 0 ? `NF₃ ${f.nf3}` : '',
      f.biogenicCo2 > 0 ? `biogenic CO₂ ${f.biogenicCo2}` : '',
    ]
      .filter(Boolean)
      .join(' · ')
  return (
    <div className="mt-4">
      <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
        Emission factors applied
      </p>
      <Table aria-label="Emission factors applied" className="mt-1">
        <thead>
          <tr>
            <Th>Factor</Th>
            <Th align="right">kg CO₂e per unit</Th>
            <Th>Gases (kg per unit)</Th>
            <Th>GWP</Th>
            <Th>Packs</Th>
            <Th>Source (publication)</Th>
          </tr>
        </thead>
        <tbody>
          {factors.map((f) => (
            <tr key={f.factorId} className="align-top">
              <Td className="align-top font-medium">{f.name}</Td>
              <Td align="right" className="align-top">
                {f.kgCo2ePerUnit} / {f.unit}
              </Td>
              <Td className="align-top text-[13px] text-ink-muted">{gases(f)}</Td>
              <Td className="align-top text-[13px]">
                IPCC {f.gwpSet}
                {/* spec 07.4: a blend published under another set and not re-derived says so */}
                {f.blendGwpSource && f.blendGwpSource !== f.gwpSet && (
                  <span className="block text-warning">
                    CO₂e as published, {f.blendGwpSource}; not rebased
                  </span>
                )}
              </Td>
              {/* spec 02.3: the packs that delivered the row, always apart from its publication */}
              <Td className="align-top text-[13px] text-ink-muted">
                {f.packs && f.packs.length > 0 ? (
                  <span className="flex flex-wrap gap-1">
                    {f.packs.map((pack) => (
                      <Chip key={pack} className="h-[22px] text-xs">
                        {pack}
                      </Chip>
                    ))}
                  </span>
                ) : (
                  'entered by hand'
                )}
                {f.selfApproved && (
                  <span
                    className="block"
                    title="Approved by the person who entered it, nobody else being able to check it at the time (spec 02.11)"
                  >
                    self-approved{f.approvedBy ? ` by ${f.approvedBy}` : ''}
                  </span>
                )}
              </Td>
              <Td className="align-top text-[13px] text-ink-muted">{publicationLine(f)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
