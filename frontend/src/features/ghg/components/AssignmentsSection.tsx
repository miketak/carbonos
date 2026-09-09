import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { InputField } from '../../../components/Field'
import { GlassCard } from '../../../components/GlassCard'
import { Skeleton } from '../../../components/Skeleton'
import { useToast } from '../../../components/toast'
import { problemDetail } from '../../../lib/api'
import {
  categoriesForScope,
  categoryLabel,
  exclusionLabels,
  formatCo2e,
  formatPeriod,
  isAutomaticReason,
  manualExclusionReasons,
  leaseLabels,
  scopeLabels,
} from '../format'
import { convertQuantity, DIMENSION_LABELS, needsDensity, unitDimension } from '../units'
import {
  useAssignmentsQuery,
  useClassifyAssignment,
  useCoverageQuery,
  useDensitiesQuery,
  useEmissionFactorsQuery,
  useExcludeAssignment,
  useIncludeAssignment,
  useSyncAssignments,
  useUnitsQuery,
} from '../useGhg'
import { ScopeBadge } from './badges'
import type {
  ActivityCategory,
  Assignment,
  CoverageRow,
  ClassifyInput,
  Density,
  EmissionFactor,
  ExcludeInput,
  ExclusionReason,
  GhgScope,
  LeaseType,
  Unit,
} from '../api'

const selectClasses =
  'w-full rounded-lg border border-teal/40 bg-white/70 px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-teal focus:outline-none disabled:opacity-60'

/**
 * This inventory's decision about one fact, as pill(s). When excluded, the pill
 * is removable: the cross re-includes the fact (DR-03), and an automatic
 * exclusion says why in words (spec 03.2).
 */
function StatusPills({
  assignment,
  editable,
  onInclude,
}: {
  assignment: Assignment
  editable: boolean
  onInclude: () => void
}) {
  if (!assignment.included) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1 rounded-full bg-slate-200 py-0.5 pr-1 pl-2.5 text-xs font-semibold text-slate-600">
        Excluded · {assignment.exclusionReason ? exclusionLabels[assignment.exclusionReason] : ''}
        {assignment.exclusionDetail && (
          <span className="font-normal text-slate-500">({assignment.exclusionDetail})</span>
        )}
        {assignment.exclusionJustification && (
          <span className="font-normal text-slate-500">
            {assignment.exclusionJustification}
            {assignment.estimatedKgCo2e !== null
              ? `; about ${formatCo2e(assignment.estimatedKgCo2e)} left out`
              : ''}
          </span>
        )}
        {editable && (
          <button
            type="button"
            onClick={onInclude}
            aria-label={`Re-include ${assignment.activityType}`}
            title="Re-include"
            className="flex size-5 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-300 hover:text-slate-700"
          >
            ✕
          </button>
        )}
      </span>
    )
  }
  if (assignment.classified) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block rounded-full bg-teal/15 px-2.5 py-0.5 text-xs font-semibold text-dark-teal">
          Included
        </span>
        {assignment.scope && <ScopeBadge scope={assignment.scope} />}
      </span>
    )
  }
  return (
    <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
      Unclassified
    </span>
  )
}

/**
 * The "10,000 US-gallon → 37,854.12 litre × 2.66 kg CO₂e/litre" line, through a
 * density when mass meets volume (spec 02.2), or null when no conversion applies.
 */
function conversionPreview(
  units: Unit[],
  assignment: Assignment,
  factor: EmissionFactor,
  density: Density | undefined,
): string | null {
  if (factor.unit.toLowerCase() === assignment.unit.toLowerCase()) return null
  let converted = convertQuantity(units, assignment.quantity, assignment.unit, factor.unit)
  let via = ''
  if (converted === null && density && needsDensity(units, assignment.unit, factor.unit)) {
    const fromMass = unitDimension(units, assignment.unit) === 'MASS'
    if (fromMass) {
      const kg = convertQuantity(units, assignment.quantity, assignment.unit, 'kg')
      converted =
        kg === null ? null : convertQuantity(units, kg / density.kgPerLitre, 'litre', factor.unit)
    } else {
      const litres = convertQuantity(units, assignment.quantity, assignment.unit, 'litre')
      converted =
        litres === null
          ? null
          : convertQuantity(units, litres * density.kgPerLitre, 'kg', factor.unit)
    }
    via = ` (density of ${density.material}, ${density.kgPerLitre} kg/litre)`
  }
  if (converted === null) return null
  const shown = converted.toLocaleString(undefined, { maximumFractionDigits: 4 })
  return `${assignment.quantity.toLocaleString()} ${assignment.unit} → ${shown} ${factor.unit}${via} × ${factor.kgCo2ePerUnit} kg CO₂e/${factor.unit}`
}

/** The category to send for a scope: the factor's default when it belongs, else the scope's first. */
function categoryFor(scope: GhgScope, factor: EmissionFactor): ActivityCategory {
  if (factor.defaultScope === scope) return factor.defaultCategory
  return categoriesForScope(scope)[0].category
}

/**
 * Classification as an accounting decision (spec 04.1): the factor, then the
 * scope and category the accountant chooses, or a lease type from which
 * Appendix F derives them under the inventory's approach.
 */
function ClassifyControls({
  assignment,
  factors,
  units,
  densities,
  editable,
  onClassify,
}: {
  assignment: Assignment
  factors: EmissionFactor[]
  units: Unit[]
  densities: Density[]
  editable: boolean
  onClassify: (input: ClassifyInput) => void
}) {
  // CLASS-01, widened for conversion: offer factors whose unit shares the fact's
  // dimension (convertible), and, when the organization has densities, factors
  // across the mass-volume divide (spec 02.2). For an unregistered unit, fall
  // back to an exact-string match; those never auto-convert.
  const dimension = unitDimension(units, assignment.unit)
  const bridged = (factor: EmissionFactor) =>
    densities.length > 0 && needsDensity(units, assignment.unit, factor.unit)
  const compatible = factors.filter((factor) =>
    dimension !== null
      ? factor.dimension === dimension || bridged(factor)
      : factor.unit.toLowerCase() === assignment.unit.toLowerCase(),
  )
  const selected = factors.find((factor) => factor.id === assignment.emissionFactorId)
  // keep the current classification visible even if it no longer matches
  const options =
    selected && !compatible.some((factor) => factor.id === selected.id)
      ? [selected, ...compatible]
      : compatible
  const density = densities.find((candidate) => candidate.id === assignment.densityId)
  const densityNeeded = !!selected && needsDensity(units, assignment.unit, selected.unit)
  const preview = selected ? conversionPreview(units, assignment, selected, density) : null
  const scope = assignment.scope ?? selected?.defaultScope ?? 'SCOPE_1'
  const leased = assignment.leaseType !== null
  const scopeLocked = !!selected && !selected.scopeAgnostic && !leased

  return (
    <div className="flex flex-col gap-1 md:w-80">
      {/* DR-04: wide enough not to truncate the factor + unit; teal border marks it as the primary action */}
      <select
        aria-label={`Classify ${assignment.activityType}`}
        value={assignment.emissionFactorId ?? ''}
        disabled={!editable}
        onChange={(event) => {
          const factor = factors.find((candidate) => candidate.id === event.target.value)
          if (factor)
            onClassify({
              emissionFactorId: factor.id,
              scope: factor.defaultScope,
              category: factor.defaultCategory,
              densityId: needsDensity(units, assignment.unit, factor.unit)
                ? (assignment.densityId ?? undefined)
                : undefined,
            })
        }}
        className={selectClasses}
      >
        <option value="">Select emission factor…</option>
        {options.map((factor) => (
          <option key={factor.id} value={factor.id}>
            {factor.name} (/{factor.unit})
          </option>
        ))}
      </select>
      {options.length === 0 && (
        <p className="text-xs text-ink-muted">
          No factor matches {assignment.unit}
          {dimension ? ` (${DIMENSION_LABELS[dimension].toLowerCase()})` : ''}: add a matching
          factor or record it in a compatible unit.
        </p>
      )}
      {preview && <p className="text-xs text-ink-muted tabular-nums">{preview}</p>}
      {selected && densityNeeded && (
        <select
          aria-label={`${assignment.activityType} density`}
          value={assignment.densityId ?? ''}
          disabled={!editable}
          onChange={(event) =>
            onClassify({
              emissionFactorId: selected.id,
              scope: assignment.scope ?? selected.defaultScope,
              category: assignment.category ?? selected.defaultCategory,
              densityId: event.target.value === '' ? undefined : event.target.value,
            })
          }
          className={selectClasses}
        >
          <option value="">Choose the density that converts…</option>
          {densities.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.material}, {candidate.kgPerLitre} kg/litre
              {candidate.typical ? ' (typical value)' : ''}
            </option>
          ))}
        </select>
      )}
      {selected && (
        <div className="flex flex-wrap gap-1">
          <select
            aria-label={`${assignment.activityType} scope`}
            value={scope}
            disabled={!editable || scopeLocked || leased}
            onChange={(event) => {
              const chosen = event.target.value as GhgScope
              onClassify({
                emissionFactorId: selected.id,
                scope: chosen,
                category: categoryFor(chosen, selected),
                densityId: assignment.densityId ?? undefined,
              })
            }}
            className={`${selectClasses} w-auto flex-1`}
          >
            {(Object.keys(scopeLabels) as GhgScope[]).map((value) => (
              <option key={value} value={value}>
                {scopeLabels[value]}
              </option>
            ))}
          </select>
          <select
            aria-label={`${assignment.activityType} category`}
            value={assignment.category ?? ''}
            disabled={!editable || leased}
            onChange={(event) =>
              onClassify({
                emissionFactorId: selected.id,
                scope,
                category: event.target.value as ActivityCategory,
                densityId: assignment.densityId ?? undefined,
              })
            }
            className={`${selectClasses} w-auto flex-1`}
          >
            {categoriesForScope(scope).map((entry) => (
              <option key={entry.category} value={entry.category}>
                {entry.label}
              </option>
            ))}
          </select>
          <select
            aria-label={`${assignment.activityType} lease type`}
            value={assignment.leaseType ?? ''}
            disabled={!editable}
            onChange={(event) => {
              const lease = event.target.value as LeaseType | ''
              onClassify(
                lease === ''
                  ? {
                      emissionFactorId: selected.id,
                      scope: selected.defaultScope,
                      category: selected.defaultCategory,
                      densityId: assignment.densityId ?? undefined,
                    }
                  : {
                      emissionFactorId: selected.id,
                      leaseType: lease,
                      densityId: assignment.densityId ?? undefined,
                    },
              )
            }}
            className={`${selectClasses} w-full`}
          >
            <option value="">Not a leased asset</option>
            {Object.entries(leaseLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {scopeLocked && (
            <p className="w-full text-xs text-ink-muted">This factor's scope is inherent.</p>
          )}
          {assignment.scope && assignment.scope !== selected.defaultScope && (
            <p className="w-full text-xs text-ink-muted">
              '{selected.name}' suggests {scopeLabels[selected.defaultScope]}
              {leased ? ' (leased asset, Appendix F)' : ''}.
            </p>
          )}
          {assignment.category && (
            <p className="w-full text-xs text-ink-muted">{categoryLabel(assignment.category)}</p>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * DR-03: exclusion is a deliberate button-and-popover, not a disguised dropdown.
 * The button opens a small menu to capture the required reason; a reason the
 * review cannot compute itself then asks for the justification and the
 * estimated magnitude Chapter 9 wants (spec 04.4). Nothing changes until the
 * form is submitted. Renders nothing once excluded (the removable status chip
 * owns the reversal).
 */
function ExcludeMenu({
  assignment,
  onExclude,
}: {
  assignment: Assignment
  onExclude: (input: ExcludeInput) => void
}) {
  const [open, setOpen] = useState(false)
  const [chosen, setChosen] = useState<ExclusionReason | null>(null)
  const [justification, setJustification] = useState('')
  const [estimated, setEstimated] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!chosen) return
    onExclude({
      reason: chosen,
      justification: justification.trim(),
      estimatedKgCo2e: Number(estimated),
    })
    setChosen(null)
    setJustification('')
    setEstimated('')
  }

  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative inline-block text-left">
      <Button
        variant="ghost"
        className="px-2.5 py-1 text-xs"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Exclude…
      </Button>
      {open && (
        <div
          role="menu"
          aria-label={`Exclude ${assignment.activityType}: choose a reason`}
          className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-teal/15 bg-white shadow-[0_8px_28px_rgba(9,168,149,0.18)]"
        >
          <p className="border-b border-teal/10 px-3 py-2 text-xs font-semibold text-ink-muted">
            Exclude: reason
          </p>
          {manualExclusionReasons.map((value) => (
            <button
              key={value}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                if (isAutomaticReason(value)) onExclude({ reason: value })
                else setChosen(value)
              }}
              className="block w-full px-3 py-2 text-left text-sm text-dark-teal transition-colors hover:bg-teal/10"
            >
              {exclusionLabels[value]}
            </button>
          ))}
        </div>
      )}
      {chosen && (
        <form
          onSubmit={submit}
          aria-label={`Exclude ${assignment.activityType}: justification`}
          className="absolute right-0 z-20 mt-1 flex w-80 flex-col gap-2 rounded-xl border border-teal/15 bg-white p-3 text-left shadow-[0_8px_28px_rgba(9,168,149,0.18)]"
        >
          <p className="text-xs font-semibold text-ink-muted">{exclusionLabels[chosen]}</p>
          <InputField
            label="Justification"
            placeholder="Why this record is left out"
            value={justification}
            minLength={10}
            maxLength={500}
            required
            onChange={(event) => setJustification(event.target.value)}
          />
          <InputField
            label="Estimated emissions left out (kg CO₂e)"
            type="number"
            min="0"
            step="0.001"
            value={estimated}
            required
            hint="0 when the record emits nothing; the report totals these per reason."
            onChange={(event) => setEstimated(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              className="px-2.5 py-1 text-xs"
              onClick={() => setChosen(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-2.5 py-1 text-xs"
              disabled={justification.trim().length < 10 || estimated.trim() === ''}
            >
              Exclude
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

/** The activity view: this inventory's accounting decisions about the facts (spec 04, 04.1, 05). */
export function AssignmentsSection({
  organizationId,
  inventoryId,
  editable,
}: {
  organizationId: string
  inventoryId: string
  editable: boolean
}) {
  const assignmentsQuery = useAssignmentsQuery(inventoryId)
  const coverageQuery = useCoverageQuery(inventoryId)
  const factorsQuery = useEmissionFactorsQuery(organizationId)
  const densitiesQuery = useDensitiesQuery(organizationId)
  const unitsQuery = useUnitsQuery(organizationId)
  const sync = useSyncAssignments(inventoryId)
  const classify = useClassifyAssignment(inventoryId)
  const exclude = useExcludeAssignment(inventoryId)
  const include = useIncludeAssignment(inventoryId)
  const toast = useToast()

  const assignments = assignmentsQuery.data
  const factors = factorsQuery.data ?? []
  const densities = densitiesQuery.data ?? []
  const units = unitsQuery.data ?? []

  const onClassify = (assignment: Assignment) => (input: ClassifyInput) =>
    classify.mutate(
      { id: assignment.id, input },
      { onError: (error) => toast(problemDetail(error) ?? 'Could not classify.', 'error') },
    )
  const onExclude = (assignment: Assignment) => (input: ExcludeInput) =>
    exclude.mutate(
      { id: assignment.id, input },
      { onError: (error) => toast(problemDetail(error) ?? 'Could not exclude.', 'error') },
    )
  const onInclude = (assignment: Assignment) => () =>
    include.mutate(assignment.id, {
      onError: (error) => toast(problemDetail(error) ?? 'Could not include.', 'error'),
    })

  return (
    <GlassCard className="p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl">Activity view</h2>
          <p className="text-sm text-ink-muted">
            This inventory's accounting decisions about the facts. The records themselves are never
            modified.
          </p>
        </div>
        <Button
          className="px-4 py-1.5 text-sm"
          busy={sync.isPending}
          disabled={!editable}
          title={editable ? undefined : 'Reopen the inventory as a draft to review activity data'}
          onClick={() =>
            sync.mutate(undefined, {
              onSuccess: ({ created, updated }) => {
                const parts = []
                if (created > 0)
                  parts.push(`${created} new record${created === 1 ? '' : 's'} under review`)
                if (updated > 0)
                  parts.push(`${updated} stale decision${updated === 1 ? '' : 's'} refreshed`)
                toast(
                  parts.length === 0
                    ? 'All activity records are already reviewed.'
                    : parts.join(' · ') + '.',
                )
              },
              onError: (error) => toast(problemDetail(error) ?? 'Could not sync.', 'error'),
            })
          }
        >
          Review activity data
        </Button>
      </div>

      {assignmentsQuery.isPending && (
        <div aria-label="Loading assignments" className="mt-4">
          <Skeleton className="h-16" />
        </div>
      )}
      {assignments?.length === 0 && (
        <p className="mt-4 text-sm text-ink-muted">
          Nothing under review yet: hit "Review activity data" to pull in the organization's
          records.
        </p>
      )}
      {assignments && assignments.length > 0 && (
        <>
          {/* desktop: table */}
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
                  <th className="px-3 py-2 font-semibold">Fact</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Classification</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="border-b border-teal/5 last:border-0">
                    <td className="px-3 py-2">
                      <span className="font-medium">{assignment.activityType}</span>
                      <span className="block text-xs text-ink-muted">
                        {assignment.facilityName} · {assignment.quantity.toLocaleString()}{' '}
                        {assignment.unit} ·{' '}
                        {formatPeriod(assignment.periodStart, assignment.periodEnd)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <StatusPills
                        assignment={assignment}
                        editable={editable}
                        onInclude={onInclude(assignment)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      {assignment.included ? (
                        <ClassifyControls
                          assignment={assignment}
                          factors={factors}
                          units={units}
                          densities={densities}
                          editable={editable}
                          onClassify={onClassify(assignment)}
                        />
                      ) : (
                        <span className="text-xs text-ink-muted">·</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {assignment.included && editable && (
                        <ExcludeMenu assignment={assignment} onExclude={onExclude(assignment)} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <CoverageMatrix rows={coverageQuery.data ?? []} />

          {/* mobile: one card per fact */}
          <ul className="mt-4 flex flex-col gap-3 md:hidden">
            {assignments.map((assignment) => (
              <li
                key={assignment.id}
                className="flex flex-col gap-2 rounded-xl border border-teal/10 bg-white/40 p-3"
              >
                <div>
                  <p className="font-medium">{assignment.activityType}</p>
                  <p className="text-xs text-ink-muted">
                    {assignment.facilityName} · {assignment.quantity.toLocaleString()}{' '}
                    {assignment.unit} · {formatPeriod(assignment.periodStart, assignment.periodEnd)}
                  </p>
                </div>
                <StatusPills
                  assignment={assignment}
                  editable={editable}
                  onInclude={onInclude(assignment)}
                />
                {assignment.included && (
                  <>
                    <ClassifyControls
                      assignment={assignment}
                      factors={factors}
                      units={units}
                      densities={densities}
                      editable={editable}
                      onClassify={onClassify(assignment)}
                    />
                    {editable && (
                      <div>
                        <ExcludeMenu assignment={assignment} onExclude={onExclude(assignment)} />
                      </div>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </GlassCard>
  )
}

/**
 * Period coverage (spec 04.2): which months of the inventory period have data
 * from included records, per facility and activity type, so a missing quarter
 * is visible before the run.
 */
function CoverageMatrix({ rows }: { rows: CoverageRow[] }) {
  if (rows.length === 0) return null
  const months = rows[0].months
  return (
    <div className="mt-6 hidden md:block">
      <h3 className="text-sm font-semibold">Period coverage</h3>
      <p className="text-xs text-ink-muted">
        Months of the reporting period with data from included records, per facility and activity.
      </p>
      <div className="mt-2 overflow-x-auto">
        <table aria-label="Period coverage" className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-teal/10 text-ink-muted uppercase">
              <th className="px-2 py-1 font-semibold">Facility · activity</th>
              {months.map((month) => (
                <th key={month} className="px-1 py-1 text-center font-semibold">
                  {month.slice(5)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.facilityId}:${row.activityType}`} className="border-b border-teal/5">
                <td className="px-2 py-1 whitespace-nowrap">
                  <span className="text-ink-muted">{row.facilityName}</span> · {row.activityType}
                </td>
                {months.map((month) => {
                  const covered = row.coveredMonths.includes(month)
                  return (
                    <td
                      key={month}
                      title={`${row.activityType}, ${month}: ${covered ? 'data' : 'no data'}`}
                      className={`px-1 py-1 text-center ${covered ? 'text-dark-teal' : 'text-red-500'}`}
                    >
                      {covered ? '●' : '○'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
