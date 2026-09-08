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
  exclusionLabels,
  formatCo2e,
  formatKg,
  instrumentLabels,
  scopeLabels,
} from './format'
import { useReportQuery } from './useGhg'
import type { ExclusionReason, RecalculationStatus, Report, RunExclusion } from './api'

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
              <h1 className="text-2xl">{report.run.label}</h1>
              <ApproachBadge approach={report.run.consolidationApproach} />
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
          </>
        )}
      </div>

      {report && <ReportBody report={report} organizationId={organizationId} />}
    </div>
  )
}

function ReportBody({ report, organizationId }: { report: Report; organizationId: string }) {
  const { company, operationalBoundary, period, emissions, methodology } = report
  const undeclared = operationalBoundary.scope3CategoriesReported.filter(
    (category) => !operationalBoundary.scope3Categories.includes(category),
  )
  const gases = report.byGas.filter(
    (gas) => gas.gas === 'CO2' || (gas.kg ?? 0) !== 0 || gas.kgCo2e !== 0,
  )
  const baseYearPath = `/app/ghg/${organizationId}/base-year`

  return (
    <>
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
              (spec 03).
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
                {formatCo2e(emissions.scope1KgCo2e)}
              </td>
            </tr>
            <tr className="border-b border-teal/5">
              <td className="py-1.5">{scopeLabels.SCOPE_2}, location-based</td>
              <td className="py-1.5 text-right tabular-nums">
                {formatCo2e(emissions.scope2LocationBasedKgCo2e)}
              </td>
            </tr>
            {emissions.scope2MarketBasedKgCo2e !== null && (
              <tr className="border-b border-teal/5">
                <td className="py-1.5">{scopeLabels.SCOPE_2}, market-based</td>
                <td className="py-1.5 text-right tabular-nums">
                  {formatCo2e(emissions.scope2MarketBasedKgCo2e)}
                </td>
              </tr>
            )}
            <tr className="border-b border-teal/5">
              <td className="py-1.5">{scopeLabels.SCOPE_3}</td>
              <td className="py-1.5 text-right tabular-nums">
                {formatCo2e(emissions.scope3KgCo2e)}
              </td>
            </tr>
            <tr className="font-semibold">
              <td className="py-1.5">Total</td>
              <td className="py-1.5 text-right tabular-nums">
                {formatCo2e(emissions.totalKgCo2e)}
              </td>
            </tr>
          </tbody>
        </table>
        {emissions.scope2MarketBasedKgCo2e !== null && emissions.marketInstruments.length > 0 && (
          <div className="mt-3">
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
                    CO₂e/kWh · {instrument.source}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
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
                <td className="py-1.5 text-right tabular-nums">
                  {gas.kg === null ? '' : formatKg(gas.kg)}
                </td>
                <td className="py-1.5 text-right tabular-nums">{formatCo2e(gas.kgCo2e)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-ink-muted">
          HFCs and PFCs are blends whose global warming potentials the factor source applied, so
          they are reported in CO₂e only. Other gases use IPCC {methodology.gwpSet} potentials.
        </p>
      </Section>

      <Section number={6} title="Biogenic CO₂" stagger={6}>
        <p className="text-sm">
          <span className="font-semibold tabular-nums">{formatKg(report.biogenicCo2Kg)}</span>
          <span className="text-ink-muted">
            {' '}
            of biogenic CO₂, reported separately and outside the scopes.
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
        <p className="mt-2 text-sm text-ink-muted">GWP set: IPCC {methodology.gwpSet}, 100-year.</p>
        {methodology.factorSources.length > 0 && (
          <p className="mt-1 text-sm text-ink-muted">
            Emission factors: {methodology.factorSources.join(', ')}.
          </p>
        )}
      </Section>

      <Section number={9} title="Exclusions" stagger={9}>
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
  const triggers = [
    baseYear.triggers.structuralChanges ? 'structural changes' : null,
    baseYear.triggers.methodologyChanges ? 'methodology changes' : null,
    baseYear.triggers.errorCorrections ? 'significant errors' : null,
  ].filter((trigger) => trigger !== null)
  return (
    <div className="flex flex-col gap-3 text-sm">
      <p>
        <span className="font-semibold">{baseYear.year}</span>
        <span className="text-ink-muted">
          {' '}
          · {baseYear.inventoryName} · significance threshold {baseYear.thresholdPercent}% ·
          triggers honoured: {triggers.length > 0 ? triggers.join(', ') : 'none'}
        </span>
      </p>
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
      <Link to={path} className="font-semibold text-link">
        Base year and recalculation policy →
      </Link>
    </div>
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
                      {row.activityDate}
                    </td>
                    <td className="py-1.5 text-ink-muted">{row.exclusionDetail ?? ''}</td>
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
