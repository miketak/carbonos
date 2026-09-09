import { Link, useParams } from 'react-router-dom'
import type { CSSProperties, ReactNode } from 'react'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { AnimatedCo2e } from './components/AnimatedCo2e'
import { ApproachBadge, InventoryStatusBadge, ScopeBadge } from './components/badges'
import { BoundaryVersionPanel } from './components/BoundaryVersionPanel'
import { Breadcrumb } from './components/Breadcrumb'
import { RunLinesTable } from './components/RunLinesTable'
import { ScopeBreakdown } from './components/ScopeBreakdown'
import {
  categoryLabel,
  conventionLabels,
  exclusionLabels,
  formatCo2e,
  formatKg,
  formatPeriod,
  formatTonnes,
  formatTonnesOfGas,
  instrumentLabels,
  marketBasisLabels,
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

/** One Chapter 9 element of the report: a numbered small-caps heading over a glass card. */
function Section({
  number,
  title,
  stagger,
  children,
}: {
  number: number
  title: string
  stagger: number
  children: ReactNode
}) {
  return (
    <GlassCard className="animate-fade-up p-6" style={{ '--stagger': stagger } as CSSProperties}>
      <h2 className="flex items-baseline gap-2 text-sm font-semibold tracking-widest text-ink-muted uppercase">
        <span className="font-mono">{String(number).padStart(2, '0')}</span>
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </GlassCard>
  )
}

const recalculationStyles: Record<RecalculationStatus, string> = {
  FLAGGED: 'bg-amber-100 text-amber-800',
  RECALCULATED: 'bg-accent-green/25 text-dark-teal',
  DECLINED: 'bg-slate-200 text-slate-600',
}

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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Breadcrumb
          items={[
            { label: 'Inventories', to: `/app/ghg/${organizationId}/inventories` },
            {
              label: report?.period.inventoryName ?? 'Inventory',
              to: `/app/ghg/${organizationId}/inventories/${inventoryId}`,
            },
            { label: report?.run.label ?? 'Run' },
          ]}
        />

        {reportQuery.isPending && (
          <div aria-label="Loading report" className="mt-3 flex flex-col gap-4">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-40" />
          </div>
        )}
        {reportQuery.isError && (
          <GlassCard className="mt-4 p-8 text-center">
            <h1 className="text-lg">Report not found</h1>
            <p className="mt-1 text-sm text-ink-muted">
              This run may have been deleted. Head back to the inventory to pick another.
            </p>
          </GlassCard>
        )}
        {report && (
          <>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="font-mono text-sm text-ink-muted">
                #{String(report.run.runNo).padStart(3, '0')}
              </span>
              <h1 className={`text-2xl ${report.run.voided ? 'line-through' : ''}`}>
                {report.run.label}
              </h1>
              <ApproachBadge approach={report.run.consolidationApproach} />
              {report.run.voided && (
                <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                  VOIDED
                </span>
              )}
              {report.run.isFinal && (
                <span className="rounded-full bg-accent-green/25 px-2.5 py-0.5 text-xs font-bold text-dark-teal">
                  FINAL
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              {report.company.organizationName} · {report.period.periodStart} →{' '}
              {report.period.periodEnd} · {report.run.activityCount} line
              {report.run.activityCount === 1 ? '' : 's'}
            </p>
            <nav aria-label="Downloads" className="mt-2 flex flex-wrap gap-2 text-sm">
              {[
                ['PDF report', `/api/ghg/runs/${runId}/report.pdf`],
                ['Lines (CSV)', `/api/ghg/runs/${runId}/lines.csv`],
                ['Exclusions (CSV)', `/api/ghg/runs/${runId}/exclusions.csv`],
                ['Frozen inputs (JSON)', `/api/ghg/runs/${runId}/inputs.json`],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  download
                  className="rounded-lg border border-teal/30 bg-white/60 px-3 py-1 font-semibold text-dark-teal hover:bg-teal/10"
                >
                  {label}
                </a>
              ))}
            </nav>
          </>
        )}
      </div>

      {report?.run.voided && (
        <GlassCard role="alert" className="border border-slate-300 bg-slate-100/70 p-4 text-sm">
          <span className="font-semibold">This run is voided</span> and must not be relied on.
          Voided by {report.run.voidedBy ?? 'unknown'}
          {report.run.voidedAt ? ` on ${new Date(report.run.voidedAt).toLocaleString()}` : ''}:{' '}
          {report.run.voidReason}. The figures are kept on the record as calculated.
        </GlassCard>
      )}
      {report && <ReportBody report={report} organizationId={organizationId} />}
    </div>
  )
}

function ReportBody({ report, organizationId }: { report: Report; organizationId: string }) {
  const { company, operationalBoundary, period, emissions, methodology } = report
  const undeclared = operationalBoundary.scope3CategoriesReported.filter(
    (category) => !operationalBoundary.scope3Categories.includes(category),
  )
  const gases = report.byGas.filter((gas) => gas.gas === 'CO2' || gas.kg !== 0 || gas.kgCo2e !== 0)
  const failingInstruments = emissions.marketInstruments.filter(
    (instrument) => !instrument.meetsQualityCriteria,
  )
  const baseYearPath = `/app/ghg/${organizationId}/base-year`

  return (
    <>
      <Section number={0} title="Report" stagger={0}>
        <ReportHeaderBlock header={report.header} />
      </Section>

      <Section number={1} title="Company and organizational boundary" stagger={1}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-lg font-semibold">{company.organizationName}</span>
          <ApproachBadge approach={company.consolidationApproach} />
        </div>
        {company.boundaryVersion ? (
          <>
            <p className="mt-2 text-sm text-ink-muted">
              Boundary version {company.boundaryVersion.version.versionNo}: the organizational
              boundary this run computed its accounting shares from, exactly as it stood when frozen
              (Corporate Standard, chapter 3).
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

      <Section number={2} title="Operational boundary" stagger={2}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-ink-muted">Scopes covered:</span>
          {operationalBoundary.scopesCovered.length === 0 && (
            <span className="text-sm text-ink-muted">none</span>
          )}
          {operationalBoundary.scopesCovered.map((scope) => (
            <ScopeBadge key={scope} scope={scope} />
          ))}
        </div>
        <p className="mt-3 text-sm font-medium">Scope 3 categories declared</p>
        {operationalBoundary.scope3Categories.length === 0 ? (
          <p className="text-sm text-ink-muted">No scope 3 categories declared.</p>
        ) : (
          <ul className="mt-1 flex flex-wrap gap-2 text-sm">
            {operationalBoundary.scope3Categories.map((category) => (
              <li key={category} className="rounded-full bg-teal/10 px-2.5 py-0.5 text-dark-teal">
                {categoryLabel(category)}
              </li>
            ))}
          </ul>
        )}
        {undeclared.length > 0 && (
          <p className="mt-2 text-sm text-ink-muted">
            Reported this run but not declared:{' '}
            {undeclared.map((category) => categoryLabel(category)).join(', ')}.
          </p>
        )}
        {operationalBoundary.exclusionsRationale && (
          <p className="mt-2 text-sm">
            <span className="text-ink-muted">Why other categories are excluded: </span>
            {operationalBoundary.exclusionsRationale}
          </p>
        )}
      </Section>

      <Section number={3} title="Reporting period" stagger={3}>
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
          <p className="mt-1 text-sm text-amber-700">
            Superseded by a correction: a later inventory restates this period.
          </p>
        )}
      </Section>

      <Section number={4} title="Emissions by scope" stagger={4}>
        <p className="text-sm text-ink-muted">Total emissions</p>
        <AnimatedCo2e
          kg={emissions.totalKgCo2e}
          className="mt-1 block text-3xl font-bold text-dark-teal"
        />
        <div className="mt-5">
          <ScopeBreakdown run={report.run} />
        </div>
        <table className="mt-5 w-full text-left text-sm">
          <tbody>
            <tr className="border-b border-teal/5">
              <td className="py-1.5">{scopeLabels.SCOPE_1}</td>
              <td className="py-1.5 text-right tabular-nums">
                {formatTonnes(emissions.scope1TCo2e)}
              </td>
            </tr>
            <tr className="border-b border-teal/5">
              <td className="py-1.5">{scopeLabels.SCOPE_2}, location-based</td>
              <td className="py-1.5 text-right tabular-nums">
                {formatTonnes(emissions.scope2LocationBasedTCo2e)}
              </td>
            </tr>
            <tr className="border-b border-teal/5">
              <td className="py-1.5">{scopeLabels.SCOPE_2}, market-based</td>
              <td className="py-1.5 text-right tabular-nums">
                {formatTonnes(emissions.scope2MarketBasedTCo2e)}
              </td>
            </tr>
            <tr className="border-b border-teal/5">
              <td className="py-1.5">{scopeLabels.SCOPE_3}</td>
              <td className="py-1.5 text-right tabular-nums">
                {formatTonnes(emissions.scope3TCo2e)}
              </td>
            </tr>
            <tr className="font-semibold">
              <td className="py-1.5">Total</td>
              <td className="py-1.5 text-right tabular-nums">
                {formatTonnes(emissions.totalTCo2e)}
              </td>
            </tr>
          </tbody>
        </table>
        <BreakdownTables report={report} />
        <p className="mt-2 text-xs text-ink-muted">
          Figures in metric tonnes to three decimals; each line below keeps its kilograms. The total
          uses the location-based scope 2 figure. Market-based basis:{' '}
          {marketBasisLabels[emissions.scope2MarketBasis]}.
          {emissions.baseYearMarketBasedIsProxy === true &&
            ' The base year held no instrument: its market-based figure is the grid average standing as a proxy.'}
          {emissions.baseYearMarketBasedIsProxy === false &&
            ' The base year reports scope 2 both ways.'}
        </p>
        <div className="mt-3">
          {emissions.marketInstruments.length > 0 && (
            <>
              <p className="text-xs font-semibold text-ink-muted uppercase">
                Contractual instruments
              </p>
              <ul className="mt-1 flex flex-col gap-1 text-sm">
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
                        ? ' · meets the Scope 2 Quality Criteria'
                        : ' · does not meet the Scope 2 Quality Criteria'}
                      {instrument.qualityNotes ? `: ${instrument.qualityNotes}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {emissions.marketInstruments.length === 0 && (
            <p className="text-xs text-ink-muted">
              No contractual instruments were held; the market-based figure is still reported, as
              the Scope 2 Guidance requires of any company in a market with instruments.
            </p>
          )}
          {failingInstruments.length > 0 && (
            <p className="mt-1 text-xs text-amber-700">
              {failingInstruments.length === 1
                ? 'One instrument'
                : `${failingInstruments.length} instruments`}{' '}
              did not meet the criteria and {failingInstruments.length === 1 ? 'was' : 'were'} not
              applied, as the lines state.
            </p>
          )}
          <p className="mt-1 text-xs text-ink-muted">{emissions.residualMixDisclosure}</p>
        </div>
      </Section>

      <Section number={5} title="Emissions by gas" stagger={5}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
              <th className="py-2 font-semibold">Gas</th>
              <th className="py-2 text-right font-semibold">Mass of gas</th>
              <th className="py-2 text-right font-semibold">CO₂e</th>
            </tr>
          </thead>
          <tbody>
            {gases.map((gas) => (
              <tr key={gas.gas} className="border-b border-teal/5 last:border-0">
                <td className="py-1.5 font-medium">{gas.gas}</td>
                <td className="py-1.5 text-right tabular-nums">{formatKg(gas.kg)}</td>
                <td className="py-1.5 text-right tabular-nums">{formatTonnes(gas.tCo2e)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-ink-muted">
          Each gas in mass and in CO₂e under IPCC {methodology.gwpSet} 100-year potentials.
          {methodology.gwpSet === 'AR6'
            ? ' Methane of fossil origin is converted at 29.8 and biogenic methane at 27.9.'
            : ' Methane is converted at 28 whatever its origin.'}
          {methodology.multipleAssessmentReports
            ? ` More than one assessment report was used: a blend whose composition is not recorded keeps the CO₂e its source stated under IPCC ${methodology.assessmentReports.slice(1).join(' and ')}.`
            : ' HFC and PFC blends are converted from their component gases with the same potentials.'}
        </p>
      </Section>

      <Section number={6} title="Biogenic CO₂" stagger={6}>
        <p className="text-sm">
          <span className="font-semibold tabular-nums">
            {formatTonnesOfGas(report.biogenicCo2T)}
          </span>
          <span className="text-ink-muted">
            {' '}
            ({formatKg(report.biogenicCo2Kg)}) of biogenic CO₂, reported separately and outside the
            scopes.
          </span>
        </p>
      </Section>

      <Section number={7} title="Base year" stagger={7}>
        {report.baseYear ? (
          <BaseYearSection baseYear={report.baseYear} path={baseYearPath} />
        ) : (
          <p className="text-sm text-ink-muted">
            No base year designated. Set one under{' '}
            <Link to={baseYearPath} className="font-semibold text-link">
              Base year
            </Link>
            .
          </p>
        )}
      </Section>

      <Section number={8} title="Methodology" stagger={8}>
        <p className="text-sm">{methodology.statement}</p>
        <p className="mt-2 text-sm text-ink-muted">
          GWP set: IPCC {methodology.gwpSet}, 100-year. Assessment reports used:{' '}
          {methodology.assessmentReports.join(', ')}.
        </p>
        <FactorTable factors={report.factors} />
        <DataQualityBlock dataQuality={report.dataQuality} />
      </Section>

      <Section number={9} title="Exclusions" stagger={9}>
        <BoundaryExclusions exclusions={report.boundaryExclusions} />
        <ExclusionSummaryTable summary={report.exclusionSummary} />
        <Exclusions exclusions={report.exclusions} />
      </Section>

      <Section number={10} title="Snapshot lines" stagger={10}>
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
        <p className="text-amber-700">
          This run and the base year use different GWP sets; the required-gases amendment recommends
          the same set for both.
        </p>
      )}
      {baseYear.originalBase ? (
        <p>
          <span className="text-ink-muted">
            Base-year emissions ({baseYear.originalBase.label}):{' '}
          </span>
          <span className="font-semibold tabular-nums">
            {formatCo2e(baseYear.originalBase.totalKgCo2e)}
          </span>
        </p>
      ) : (
        <p className="text-ink-muted">The base-year inventory has no final run yet.</p>
      )}
      {baseYear.recalculations.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-ink-muted uppercase">Recalculation history</p>
          <ul className="mt-1 flex flex-col gap-2">
            {baseYear.recalculations.map(({ decision, recalculatedBase }) => (
              <li key={decision.id} className="rounded-xl border border-teal/10 bg-white/40 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${recalculationStyles[decision.status]}`}
                  >
                    {decision.status}
                  </span>
                  <span className="text-xs text-ink-muted">
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
                  <p className="text-xs text-ink-muted">
                    Decided by {decision.decidedBy}
                    {decision.decidedAt ? `, ${new Date(decision.decidedAt).toLocaleString()}` : ''}
                  </p>
                )}
                {recalculatedBase && (
                  <p className="mt-1">
                    <span className="text-ink-muted">
                      Recalculated base ({recalculatedBase.label}):{' '}
                    </span>
                    <span className="font-semibold tabular-nums">
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
          <p className="text-xs font-semibold text-ink-muted uppercase">
            Emissions profile over time
          </p>
          <table className="mt-1 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
                <th className="py-1 font-semibold">Year</th>
                <th className="py-1 font-semibold">Inventory</th>
                <th className="py-1 text-right font-semibold">Final run</th>
                <th className="py-1 text-right font-semibold">Recalculated</th>
              </tr>
            </thead>
            <tbody>
              {baseYear.profile.map((entry) => (
                <tr key={entry.inventoryId} className="border-b border-teal/5 last:border-0">
                  <td className="py-1 tabular-nums">{entry.periodLabel}</td>
                  <td className="py-1">{entry.name}</td>
                  <td className="py-1 text-right tabular-nums">
                    {entry.totalKgCo2e === null ? 'not yet final' : formatCo2e(entry.totalKgCo2e)}
                  </td>
                  <td className="py-1 text-right tabular-nums">
                    {entry.recalculatedTotalKgCo2e === null
                      ? ''
                      : formatCo2e(entry.recalculatedTotalKgCo2e)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    <div className="mb-4">
      <h3 className="text-sm font-semibold">
        Operations excluded from the boundary{' '}
        <span className="font-normal text-ink-muted">
          ({exclusions.length} {exclusions.length === 1 ? 'operation' : 'operations'})
        </span>
      </h3>
      <table className="mt-1 w-full text-left text-sm">
        <tbody>
          {exclusions.map((exclusion) => (
            <tr
              key={`${exclusion.entityId}:${exclusion.facilityId ?? 'entity'}`}
              className="border-b border-teal/5 last:border-0"
            >
              <td className="py-1.5 pr-3 font-medium">
                {exclusion.facilityName ?? `${exclusion.entityName} (whole entity)`}
              </td>
              <td className="py-1.5 pr-3 text-ink-muted">
                {exclusion.facilityName ? exclusion.entityName : ''}
              </td>
              <td className="py-1.5 pr-3">{exclusionLabels[exclusion.reason]}</td>
              <td className="py-1.5 text-ink-muted">{exclusion.detail ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** The data-quality table and the uncertainty statement (spec 04.4, ISO 14064-1 section 9.3.1). */
function DataQualityBlock({ dataQuality }: { dataQuality: Report['dataQuality'] }) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold">Data quality and uncertainty</h3>
      <p className="mt-1 text-sm">{dataQuality.statement}</p>
      {dataQuality.uncertaintyStatement && (
        <p className="mt-1 text-sm">{dataQuality.uncertaintyStatement}</p>
      )}
      {dataQuality.byTier.length > 0 && (
        <div className="mt-2 overflow-x-auto">
          <table aria-label="Data quality by tier" className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
                <th className="py-1.5 pr-3 font-semibold">Tier</th>
                <th className="py-1.5 pr-3 font-semibold">Quality</th>
                <th className="py-1.5 pr-3 text-right font-semibold">Scope 1</th>
                <th className="py-1.5 pr-3 text-right font-semibold">Scope 2</th>
                <th className="py-1.5 pr-3 text-right font-semibold">Scope 3</th>
                <th className="py-1.5 text-right font-semibold">Share</th>
              </tr>
            </thead>
            <tbody>
              {dataQuality.byTier.map((row) => (
                <tr key={row.tier} className="border-b border-teal/5 last:border-0">
                  <td className="py-1.5 pr-3 font-mono">{row.tier}</td>
                  <td className="py-1.5 pr-3">{row.label}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">
                    {formatCo2e(row.scope1KgCo2e)}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">
                    {formatCo2e(row.scope2KgCo2e)}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">
                    {formatCo2e(row.scope3KgCo2e)}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{row.sharePercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/** Excluded records per reason with the emissions estimated to be left out (spec 04.4). */
function ExclusionSummaryTable({ summary }: { summary: Report['exclusionSummary'] }) {
  if (summary.length === 0) return null
  return (
    <table aria-label="Exclusions by reason" className="mb-4 w-full text-left text-sm">
      <thead>
        <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
          <th className="py-1.5 pr-3 font-semibold">Reason</th>
          <th className="py-1.5 pr-3 text-right font-semibold">Records</th>
          <th className="py-1.5 text-right font-semibold">Estimated left out</th>
        </tr>
      </thead>
      <tbody>
        {summary.map((row) => (
          <tr key={row.reason} className="border-b border-teal/5 last:border-0">
            <td className="py-1.5 pr-3">{exclusionLabels[row.reason]}</td>
            <td className="py-1.5 pr-3 text-right tabular-nums">{row.recordCount}</td>
            <td className="py-1.5 text-right tabular-nums">
              {formatCo2e(row.estimatedKgCo2e)}
              {row.unestimatedCount > 0 && (
                <span className="block text-xs text-ink-muted">
                  {row.unestimatedCount} not estimated
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
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
    <div className="flex flex-col gap-4">
      {[...groups.entries()].map(([reason, rows]) => (
        <div key={reason}>
          <h3 className="text-sm font-semibold">
            {exclusionLabels[reason]}{' '}
            <span className="font-normal text-ink-muted">
              ({rows.length} record{rows.length === 1 ? '' : 's'})
            </span>
          </h3>
          <div className="mt-1 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-teal/5 last:border-0">
                    <td className="py-1.5 pr-3 font-medium">{row.activityType}</td>
                    <td className="py-1.5 pr-3 text-ink-muted">{row.facilityName}</td>
                    <td className="py-1.5 pr-3 whitespace-nowrap tabular-nums">
                      {row.quantity.toLocaleString()} {row.unit}
                    </td>
                    <td className="py-1.5 pr-3 whitespace-nowrap text-ink-muted">
                      {formatPeriod(row.periodStart, row.periodEnd)}
                    </td>
                    <td className="py-1.5 pr-3 text-ink-muted">
                      {row.exclusionDetail ?? ''}
                      {row.exclusionJustification && (
                        <span className="block">{row.exclusionJustification}</span>
                      )}
                    </td>
                    <td className="py-1.5 text-right whitespace-nowrap text-ink-muted tabular-nums">
                      {row.estimatedKgCo2e === null ? '' : `~${formatCo2e(row.estimatedKgCo2e)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

/** The header block (spec 07.4): the reporting entity, who prepared and approved the report, its version and assurance. */
function ReportHeaderBlock({ header }: { header: Report['header'] }) {
  const rows: [string, string][] = [
    ['Reporting entity', [header.organizationName, header.address].filter(Boolean).join(', ')],
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
      'Version',
      `${header.version}${header.supersedes.length > 0 ? `, supersedes ${header.supersedes.join(', ')}` : ''}${header.supersededBy ? `; superseded by ${header.supersededBy}` : ''}`,
    ],
    [
      'Assurance',
      header.assuranceLevel === 'UNVERIFIED'
        ? 'Unverified'
        : `${assuranceLabels[header.assuranceLevel]}${header.assuranceProvider ? ` by ${header.assuranceProvider}` : ''}${header.assuranceStatement ? ` (${header.assuranceStatement})` : ''}`,
    ],
  ]
  return (
    <table aria-label="Report header" className="w-full text-left text-sm">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-b border-teal/5 last:border-0">
            <th scope="row" className="py-1 pr-3 font-medium whitespace-nowrap text-ink-muted">
              {label}
            </th>
            <td className="py-1">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function BreakdownTable({ title, rows }: { title: string; rows: Breakdown[] }) {
  if (rows.length === 0) return null
  return (
    <div className="mt-4 overflow-x-auto">
      <p className="text-xs font-semibold text-ink-muted uppercase">{title}</p>
      <table aria-label={title} className="mt-1 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
            <th className="py-1 font-semibold">Name</th>
            <th className="py-1 text-right font-semibold">Scope 1</th>
            <th className="py-1 text-right font-semibold">Scope 2 (location)</th>
            <th className="py-1 text-right font-semibold">Scope 2 (market)</th>
            <th className="py-1 text-right font-semibold">Scope 3</th>
            <th className="py-1 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-teal/5 last:border-0">
              <td className="py-1 pr-2">{row.name}</td>
              <td className="py-1 text-right tabular-nums">
                {formatTonnes(row.scope1KgCo2e / 1000)}
              </td>
              <td className="py-1 text-right tabular-nums">
                {formatTonnes(row.scope2KgCo2e / 1000)}
              </td>
              <td className="py-1 text-right tabular-nums">
                {formatTonnes(row.scope2MarketBasedKgCo2e / 1000)}
              </td>
              <td className="py-1 text-right tabular-nums">
                {formatTonnes(row.scope3KgCo2e / 1000)}
              </td>
              <td className="py-1 text-right font-semibold tabular-nums">
                {formatTonnes(row.totalTCo2e)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Chapter 9: scope 3 by category is required where scope 3 is reported; facility, entity and country breakdowns are recommended. */
function BreakdownTables({ report }: { report: Report }) {
  return (
    <>
      {report.byScope3Category.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-ink-muted uppercase">Scope 3 by category</p>
          <table aria-label="Scope 3 by category" className="mt-1 w-full text-left text-sm">
            <tbody>
              {report.byScope3Category.map((row) => (
                <tr key={row.category} className="border-b border-teal/5 last:border-0">
                  <td className="py-1 pr-2">{categoryLabel(row.category)}</td>
                  <td className="py-1 text-right text-xs text-ink-muted">
                    {row.lineCount} line{row.lineCount === 1 ? '' : 's'}
                  </td>
                  <td className="py-1 text-right tabular-nums">{formatTonnes(row.tCo2e)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <BreakdownTable title="By facility" rows={report.byFacility} />
      <BreakdownTable title="By legal entity" rows={report.byEntity} />
      <BreakdownTable title="By country" rows={report.byCountry} />
      {report.intensity.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-ink-muted uppercase">Intensity</p>
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
    <div className="mt-3 overflow-x-auto">
      <p className="text-xs font-semibold text-ink-muted uppercase">Emission factors applied</p>
      <table aria-label="Emission factors applied" className="mt-1 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
            <th className="py-1 font-semibold">Factor</th>
            <th className="py-1 text-right font-semibold">kg CO₂e per unit</th>
            <th className="py-1 font-semibold">Gases (kg per unit)</th>
            <th className="py-1 font-semibold">GWP</th>
            <th className="py-1 font-semibold">Source</th>
          </tr>
        </thead>
        <tbody>
          {factors.map((f) => (
            <tr key={f.factorId} className="border-b border-teal/5 last:border-0">
              <td className="py-1 pr-2 font-medium">{f.name}</td>
              <td className="py-1 text-right tabular-nums whitespace-nowrap">
                {f.kgCo2ePerUnit} / {f.unit}
              </td>
              <td className="py-1 pr-2 text-xs text-ink-muted">{gases(f)}</td>
              <td className="py-1 pr-2 text-xs">IPCC {f.gwpSet}</td>
              <td className="py-1 text-xs text-ink-muted">{f.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
