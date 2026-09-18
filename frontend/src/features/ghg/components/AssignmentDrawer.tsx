import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { Drawer } from '../../../components/Drawer'
import { InputField } from '../../../components/Field'
import { Tabs } from '../../../components/Tabs'
import {
  categoriesForScope,
  categoryLabel,
  exclusionLabels,
  factorIdentity,
  formatPeriod,
  isAutomaticReason,
  isOutsideScopesReason,
  manualExclusionReasons,
  leaseLabels,
  publicationLine,
  scopeLabels,
} from '../format'
import { convertQuantity, DIMENSION_LABELS, needsDensity, unitDimension } from '../units'
import { useEmissionFactorsQuery } from '../useGhg'
import { AssignmentStatusPills } from './badges'
import type {
  ActivityCategory,
  Assignment,
  ClassifyInput,
  Density,
  Dimension,
  EmissionFactor,
  ExcludeInput,
  ExclusionReason,
  GhgScope,
  LeaseType,
  Unit,
} from '../api'

/** How many factors the picker holds at once; a search narrows a bigger library (FU-03). */
const PICKER_PAGE_SIZE = 50

const selectClasses =
  'w-full rounded-lg border border-teal/40 bg-white/70 px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-teal focus:outline-none disabled:opacity-60'

type DrawerTab = 'classify' | 'exclude'

/**
 * Classifies one record beside the register, rather than inside its row (spec
 * 05.6). The picker, the scope and category, the density, the proxy flag and
 * the exclusion form used to render 448 lines deep in every one of fifty rows;
 * here they render once, for the record the reviewer is actually looking at,
 * and the register's rows go back to being one line each.
 *
 * Built like ActivityDrawer (spec 04.6): non-modal, so the list stays live
 * beside it, keyed by the record at the call site so the form resets without
 * an effect, and taking the page so prev and next need no fetch.
 *
 * Classification saves on every change, as it always has: there is no Save
 * button, because each control is one accounting decision the server accepts
 * or refuses on its own.
 */
export function AssignmentDrawer({
  organizationId,
  assignmentId,
  pageItems,
  factors,
  units,
  densities,
  editable,
  period,
  onNavigate,
  onClose,
  onClassify,
  onExclude,
  onInclude,
}: {
  organizationId: string
  assignmentId: string
  pageItems: Assignment[]
  /** The factors this page's records already reference, resolved by identifier (FU-03). */
  factors: EmissionFactor[]
  units: Unit[]
  densities: Density[]
  /** The inventory takes writes and this reader may make them. */
  editable: boolean
  /** The inventory's reporting period: the picker offers the versions live in it (spec 02.6). */
  period?: { start: string; end: string }
  onNavigate: (id: string) => void
  onClose: () => void
  onClassify: (assignment: Assignment) => (input: ClassifyInput) => void
  onExclude: (assignment: Assignment) => (input: ExcludeInput) => void
  onInclude: (assignment: Assignment) => () => void
}) {
  const index = pageItems.findIndex((item) => item.id === assignmentId)
  const assignment = index >= 0 ? pageItems[index] : undefined

  if (!assignment) {
    return (
      <Drawer eyebrow="Review record" title="Not in this view" onClose={onClose}>
        <p className="text-sm text-ink-muted">
          This record is not on the page in front of you. Clear the search or the filters to bring
          it back.
        </p>
      </Drawer>
    )
  }

  return (
    <AssignmentPanel
      key={assignment.id}
      organizationId={organizationId}
      assignment={assignment}
      position={{ index, total: pageItems.length }}
      previousId={index > 0 ? pageItems[index - 1].id : undefined}
      nextId={index < pageItems.length - 1 ? pageItems[index + 1].id : undefined}
      factors={factors}
      units={units}
      densities={densities}
      editable={editable}
      period={period}
      onNavigate={onNavigate}
      onClose={onClose}
      onClassify={onClassify(assignment)}
      onExclude={onExclude(assignment)}
      onInclude={onInclude(assignment)}
    />
  )
}

function AssignmentPanel({
  organizationId,
  assignment,
  position,
  previousId,
  nextId,
  factors,
  units,
  densities,
  editable,
  period,
  onNavigate,
  onClose,
  onClassify,
  onExclude,
  onInclude,
}: {
  organizationId: string
  assignment: Assignment
  position: { index: number; total: number }
  previousId?: string
  nextId?: string
  factors: EmissionFactor[]
  units: Unit[]
  densities: Density[]
  editable: boolean
  period?: { start: string; end: string }
  onNavigate: (id: string) => void
  onClose: () => void
  onClassify: (input: ClassifyInput) => void
  onExclude: (input: ExcludeInput) => void
  onInclude: () => void
}) {
  const [tab, setTab] = useState<DrawerTab>('classify')

  const footer = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1 text-xs text-ink-muted">
        <span>
          {position.index + 1}/{position.total}
        </span>
        <button
          type="button"
          aria-label="Previous record"
          disabled={!previousId}
          onClick={() => previousId && onNavigate(previousId)}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-teal/10 disabled:opacity-40"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Next record"
          disabled={!nextId}
          onClick={() => nextId && onNavigate(nextId)}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-teal/10 disabled:opacity-40"
        >
          ›
        </button>
      </div>
      <Button type="button" variant="ghost" className="px-3 py-1.5 text-sm" onClick={onClose}>
        {nextId ? 'Done' : 'Close'}
      </Button>
    </div>
  )

  return (
    <Drawer
      eyebrow={assignment.included ? 'Classify record' : 'Excluded record'}
      title={assignment.activityType}
      subtitle={
        <>
          <span>
            {assignment.facilityName} · {assignment.quantity.toLocaleString()} {assignment.unit} ·{' '}
            {formatPeriod(assignment.periodStart, assignment.periodEnd)}
          </span>
          <AssignmentStatusPills
            assignment={assignment}
            editable={editable}
            onInclude={onInclude}
          />
        </>
      }
      footer={footer}
      onClose={onClose}
    >
      {assignment.changedSincePublication && assignment.changedSincePublication.length > 0 && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Changed since publication: {assignment.changedSincePublication.join(', ')}
        </p>
      )}

      {assignment.included ? (
        <>
          <div className="mb-4">
            <Tabs<DrawerTab>
              label="Record decisions"
              value={tab}
              onChange={setTab}
              tabs={[
                { value: 'classify', label: 'Classify' },
                { value: 'exclude', label: 'Exclude' },
              ]}
            />
          </div>
          {tab === 'classify' && (
            <ClassifyPanel
              assignment={assignment}
              organizationId={organizationId}
              factors={factors}
              units={units}
              densities={densities}
              editable={editable}
              period={period}
              onClassify={onClassify}
            />
          )}
          {tab === 'exclude' &&
            (editable ? (
              <ExcludePanel assignment={assignment} units={units} onExclude={onExclude} />
            ) : (
              <p className="text-sm text-ink-muted">
                Leaving a record out of the inventory is a preparer's decision. You are reading.
              </p>
            ))}
        </>
      ) : (
        <p className="text-sm text-ink-muted">
          This record is left out of the inventory. The reason and what it was sized at are on the
          chip above; clear it there to bring the record back in.
        </p>
      )}
    </Drawer>
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
function ClassifyPanel({
  assignment,
  organizationId,
  factors,
  units,
  densities,
  editable,
  period,
  onClassify,
}: {
  assignment: Assignment
  organizationId: string
  /** The factors this page's records already reference, resolved by identifier (FU-03). */
  factors: EmissionFactor[]
  units: Unit[]
  densities: Density[]
  editable: boolean
  period?: { start: string; end: string }
  onClassify: (input: ClassifyInput) => void
}) {
  // CLASS-01, widened for conversion: offer factors whose unit shares the fact's
  // dimension (convertible), and, when the organization has densities, factors
  // across the mass-volume divide (spec 02.2). For an unregistered unit, fall
  // back to an exact-string match; those never auto-convert. FU-03: the
  // database applies this, so a library of thousands costs the picker a page.
  const dimension = unitDimension(units, assignment.unit)
  const bridges = densities.length > 0 && (dimension === 'MASS' || dimension === 'VOLUME')
  const dimensions: Dimension[] =
    dimension === null ? [] : bridges ? ['MASS', 'VOLUME'] : [dimension]
  // a per-litre factor on a mass record (or the reverse) cannot be sent without a density (spec 02.2):
  // hold the pick locally until the density is chosen, then send both together. The whole factor
  // is held, not its id: `factors` only carries what the page's records already cite, so a
  // factor picked a moment ago is not in it yet, and an id alone would resolve to nothing.
  const [pendingFactor, setPendingFactor] = useState<EmissionFactor | null>(null)
  // a proxy flag is only sent together with its justification (the backend refuses one without)
  const [proxyTicked, setProxyTicked] = useState(false)
  // spec 05.5: a row shows its factor as text; the picker opens on demand, with the grouped,
  // searchable contents of spec 02.3, and asks the server for one page of them
  const [pickerOpen, setPickerOpen] = useState(false)
  const [factorSearch, setFactorSearch] = useState('')
  // spec 02.3: an unapproved factor is hidden until asked for, so nobody picks one without seeing it
  const [showUnapproved, setShowUnapproved] = useState(false)
  const pickerQuery = useEmissionFactorsQuery(
    organizationId,
    {
      q: factorSearch.trim() === '' ? undefined : factorSearch.trim(),
      includeUnapproved: showUnapproved,
      unit: dimension === null ? assignment.unit : undefined,
      dimension: dimensions.length > 0 ? dimensions : undefined,
      // spec 02.6: only the versions live in the inventory's period; a split period offers both
      periodStart: period?.start,
      periodEnd: period?.end,
      size: PICKER_PAGE_SIZE,
    },
    { enabled: pickerOpen },
  )
  const selected = assignment.emissionFactorId
    ? (factors.find((factor) => factor.id === assignment.emissionFactorId) ??
      (pendingFactor?.id === assignment.emissionFactorId ? pendingFactor : undefined))
    : (pendingFactor ?? undefined)
  const page = pickerQuery.data
  const matched = page?.items ?? []
  // keep the current classification visible even when its unit no longer fits the record; a
  // search is the one filter it does not survive, because the server decides what matches
  const shown =
    selected && factorSearch.trim() === '' && !matched.some((factor) => factor.id === selected.id)
      ? [selected, ...matched]
      : matched
  const hiddenUnapproved = showUnapproved ? 0 : (page?.unapproved ?? 0)
  const beyondPage = Math.max(0, (page?.total ?? 0) - matched.length)
  // nothing at all fits this record's unit, which is worth saying before a search narrows it further
  const noneFit = pickerOpen && !pickerQuery.isPending && factorSearch.trim() === '' && !page?.total
  // spec 02.10 retired the shared library, so there is one tier and no grouping: every factor the
  // picker offers is this organization's, ordered by the database so the order holds across pages.
  const density = densities.find((candidate) => candidate.id === assignment.densityId)
  const densityNeeded = !!selected && needsDensity(units, assignment.unit, selected.unit)
  const preview = selected ? conversionPreview(units, assignment, selected, density) : null
  const scope = assignment.scope ?? selected?.defaultScope ?? 'SCOPE_1'
  const leased = assignment.leaseType !== null
  // spec 04.7 (finding F34): any factor can be used in any scope with a justification; only a
  // lease type fixes the scope, because Appendix F derives it (spec 04.1)
  // spec 04.3: the stream's default when the record has one, else the factor's
  const defaultScope = assignment.defaultScope ?? selected?.defaultScope ?? null
  const departs = !!selected && !leased && !!assignment.scope && assignment.scope !== defaultScope
  // what the current classification carries, so a justification or proxy flag does not drop it
  const current = (): ClassifyInput =>
    assignment.leaseType
      ? {
          emissionFactorId: selected!.id,
          leaseType: assignment.leaseType,
          densityId: assignment.densityId ?? undefined,
        }
      : {
          emissionFactorId: selected!.id,
          scope: assignment.scope ?? undefined,
          category: assignment.category ?? undefined,
          densityId: assignment.densityId ?? undefined,
        }
  const carry = {
    scopeJustification: assignment.scopeJustification ?? undefined,
    proxy: assignment.proxy || undefined,
    proxyJustification: assignment.proxyJustification ?? undefined,
  }

  return (
    <div className="flex flex-col gap-2">
      {selected && !pickerOpen && (
        <p className="text-sm">
          <span className="font-medium">{selected.name}</span>
          <span className="text-ink-muted"> (/{selected.unit})</span>
          {selected.sourceActivity && (
            <span className="text-ink-muted"> · {selected.sourceActivity}</span>
          )}
          {selected.packs.map((pack) => (
            <span
              key={pack}
              className="ml-1 rounded-full border border-teal/30 px-1.5 text-xs text-ink-muted"
              title="Delivered by a factor pack"
            >
              {pack}
            </span>
          ))}
          {!selected.approved && (
            <span className="ml-1 rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-800">
              not approved
            </span>
          )}
          {editable && (
            <button
              type="button"
              className="ml-2 text-xs text-link hover:underline"
              onClick={() => setPickerOpen(true)}
            >
              Change factor…
            </button>
          )}
        </p>
      )}
      {!selected && !pickerOpen && editable && (
        <Button
          variant="ghost"
          className="self-start px-2.5 py-1 text-xs"
          onClick={() => setPickerOpen(true)}
        >
          Choose factor…
        </Button>
      )}
      {!selected && !pickerOpen && !editable && (
        <span className="text-xs text-ink-muted">No factor chosen</span>
      )}
      {pickerOpen && (
        <div
          role="group"
          aria-label={`Factor picker for ${assignment.activityType}`}
          className="flex flex-col gap-1 rounded-md border border-line p-2"
        >
          <input
            aria-label={`Search factors for ${assignment.activityType}`}
            value={factorSearch}
            placeholder="Search by name, publication or pack"
            onChange={(event) => setFactorSearch(event.target.value)}
            className={selectClasses}
          />
          <label className="flex items-center gap-1.5 text-xs text-ink-muted">
            <input
              type="checkbox"
              checked={showUnapproved}
              onChange={(event) => setShowUnapproved(event.target.checked)}
            />
            Show unapproved
            {hiddenUnapproved > 0 && !showUnapproved && ` (${hiddenUnapproved} hidden)`}
          </label>
          {/* DR-04: each option carries its publication and tags, so two factors of the same
              name and unit never read alike (spec 02.3) */}
          <div
            aria-label={`Classify ${assignment.activityType}`}
            className="max-h-64 overflow-y-auto rounded-md border border-line"
          >
            {pickerQuery.isPending && (
              <p className="p-2 text-xs text-ink-muted">Searching the library…</p>
            )}
            {!pickerQuery.isPending && shown.length === 0 && (
              <p className="p-2 text-xs text-ink-muted">No factor matches this search.</p>
            )}
            <ul>
              {shown.map((factor) => (
                <li key={factor.id}>
                  <button
                    type="button"
                    aria-pressed={factor.id === assignment.emissionFactorId}
                    className={`w-full px-2 py-1.5 text-left hover:bg-surface-muted ${
                      factor.id === assignment.emissionFactorId ? 'bg-surface-muted' : ''
                    }`}
                    onClick={() => {
                      setPickerOpen(false)
                      setFactorSearch('')
                      if (
                        needsDensity(units, assignment.unit, factor.unit) &&
                        !assignment.densityId
                      ) {
                        setPendingFactor(factor)
                        return
                      }
                      setPendingFactor(null)
                      onClassify({
                        emissionFactorId: factor.id,
                        // spec 04.3: the record's stream fixes the default scope; the factor only suggests one
                        scope: assignment.defaultScope ?? factor.defaultScope,
                        category: assignment.defaultScope
                          ? (assignment.defaultCategory ?? factor.defaultCategory)
                          : factor.defaultCategory,
                        densityId: needsDensity(units, assignment.unit, factor.unit)
                          ? (assignment.densityId ?? undefined)
                          : undefined,
                      })
                    }}
                  >
                    <span className="text-sm">
                      <span className="font-medium">{factor.name}</span>
                      <span className="text-ink-muted"> (/{factor.unit})</span>
                      {!factor.approved && (
                        <span className="ml-1 rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-800">
                          unapproved
                        </span>
                      )}
                    </span>
                    {/* FU-03: 1,157 of the 1,868 DEFRA rows share a display name, and the three
                            butane rows differ only by unit. The publisher's activity and the value
                            go beside the name, so no two options are indistinguishable. */}
                    <span className="block text-xs text-ink-muted">{factorIdentity(factor)}</span>
                    <span className="block text-xs text-ink-muted">
                      {publicationLine(factor)}
                      {factor.packs.length > 0 && ` · ${factor.packs.join(', ')}`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {beyondPage > 0 && (
            <p className="text-xs text-ink-muted">
              {beyondPage.toLocaleString()} more match. Narrow the search to see them.
            </p>
          )}
          <button
            type="button"
            className="self-start text-xs text-ink-muted hover:underline"
            onClick={() => {
              setPickerOpen(false)
              setFactorSearch('')
            }}
          >
            Close picker
          </button>
        </div>
      )}
      {!selected && assignment.suggestedFactorId && editable && (
        <button
          type="button"
          className="self-start text-xs text-link hover:underline"
          onClick={() => {
            const factor = factors.find(
              (candidate) => candidate.id === assignment.suggestedFactorId,
            )
            if (factor)
              onClassify({
                emissionFactorId: factor.id,
                scope: assignment.defaultScope ?? factor.defaultScope,
                category: assignment.defaultScope
                  ? (assignment.defaultCategory ?? factor.defaultCategory)
                  : factor.defaultCategory,
              })
          }}
        >
          Suggested for this facility's grid: {assignment.suggestedFactorName}
        </button>
      )}
      {assignment.inheritedLeaseType && (
        <p className="text-xs text-amber-700">
          Leased facility: {leaseLabels[assignment.inheritedLeaseType].toLowerCase()} inherited
          {assignment.leaseType === null && selected ? ' (set aside for this record)' : ''}.
        </p>
      )}
      {noneFit && (
        <p className="text-xs text-ink-muted">
          No factor matches {assignment.unit}
          {dimension ? ` (${DIMENSION_LABELS[dimension].toLowerCase()})` : ''}: add a matching
          factor or record it in a compatible unit.
        </p>
      )}
      {preview && <p className="text-xs text-ink-muted tabular-nums">{preview}</p>}
      {selected && densityNeeded && !assignment.densityId && (
        <p className="text-xs text-amber-700">
          {assignment.unit} meets a factor per {selected.unit}: choose the density that converts
          between them to finish classifying.
        </p>
      )}
      {selected && densityNeeded && (
        <select
          aria-label={`${assignment.activityType} density`}
          value={assignment.densityId ?? ''}
          disabled={!editable}
          onChange={(event) => {
            setPendingFactor(null)
            onClassify({
              emissionFactorId: selected.id,
              scope: assignment.scope ?? assignment.defaultScope ?? selected.defaultScope,
              category:
                assignment.category ?? assignment.defaultCategory ?? selected.defaultCategory,
              densityId: event.target.value === '' ? undefined : event.target.value,
              ...carry,
            })
          }}
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
            disabled={!editable || leased}
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
                      ignoreFacilityLease: assignment.inheritedLeaseType !== null,
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
          {assignment.scope && defaultScope && assignment.scope !== defaultScope && (
            <p className="w-full text-xs text-ink-muted">
              {assignment.defaultScope ? 'The stream' : `'${selected.name}'`} suggests{' '}
              {scopeLabels[defaultScope]}
              {leased ? ' (leased asset, Appendix F)' : ''}.
            </p>
          )}
          {departs && (
            <JustificationInput
              label={`${assignment.activityType} scope justification`}
              value={assignment.scopeJustification}
              placeholder="Why the scope departs from the default (at least 10 characters)"
              minLength={10}
              editable={editable}
              onSave={(text) => onClassify({ ...current(), ...carry, scopeJustification: text })}
            />
          )}
          <label className="flex w-full items-center gap-2 text-xs text-ink-muted">
            <input
              type="checkbox"
              aria-label={`${assignment.activityType} proxy factor`}
              checked={assignment.proxy || proxyTicked}
              disabled={!editable}
              onChange={(event) => {
                setProxyTicked(event.target.checked)
                if (!event.target.checked && assignment.proxy)
                  onClassify({
                    ...current(),
                    ...carry,
                    proxy: false,
                    proxyJustification: undefined,
                  })
              }}
              className="h-4 w-4 accent-teal-deep"
            />
            Proxy factor: stands in for one that is not published or not yet approved
          </label>
          {(assignment.proxy || proxyTicked) && (
            <JustificationInput
              label={`${assignment.activityType} proxy justification`}
              value={assignment.proxyJustification}
              placeholder="What the factor stands in for (at least 5 characters)"
              minLength={5}
              editable={editable}
              onSave={(text) =>
                onClassify({ ...current(), ...carry, proxy: true, proxyJustification: text })
              }
            />
          )}
          {assignment.category && (
            <p className="w-full text-xs text-ink-muted">{categoryLabel(assignment.category)}</p>
          )}
        </div>
      )}
    </div>
  )
}
/** A short reason saved when the field loses focus and the text is long enough (spec 04.3). */
function JustificationInput({
  label,
  value,
  placeholder,
  minLength,
  editable,
  onSave,
}: {
  label: string
  value: string | null
  placeholder: string
  minLength: number
  editable: boolean
  onSave: (text: string) => void
}) {
  const [text, setText] = useState(value ?? '')
  const tooShort = text.trim().length > 0 && text.trim().length < minLength
  return (
    <div className="flex w-full flex-col gap-1">
      <input
        aria-label={label}
        value={text}
        placeholder={placeholder}
        maxLength={500}
        disabled={!editable}
        aria-invalid={tooShort}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => {
          if (text.trim().length >= minLength && text.trim() !== (value ?? '')) onSave(text.trim())
        }}
        className={`${selectClasses} w-full`}
      />
      {tooShort && (
        <p role="alert" className="text-xs font-medium text-red-600">
          At least {minLength} characters.
        </p>
      )}
    </div>
  )
}
/**
 * DR-03: exclusion is a deliberate decision, never a disguised dropdown. The
 * reason is chosen first; a reason the review cannot compute itself then asks
 * for the justification and the estimated magnitude Chapter 9 wants (spec
 * 04.4). Nothing changes until the form is submitted.
 *
 * This was a popover hanging off the row (spec 04.1). In the drawer it is a
 * tab with room to read the choices, so the reasons no longer have to fit a
 * 14rem menu.
 */
function ExcludePanel({
  assignment,
  units,
  onExclude,
}: {
  assignment: Assignment
  units: Unit[]
  onExclude: (input: ExcludeInput) => void
}) {
  const [chosen, setChosen] = useState<ExclusionReason | null>(null)
  const [justification, setJustification] = useState('')
  const [estimated, setEstimated] = useState('')
  // spec 04.8: the three states a preparer can answer with, so nobody types a false zero
  const [notEstimated, setNotEstimated] = useState(false)
  const [emitsNothing, setEmitsNothing] = useState(false)
  const [gas, setGas] = useState('')
  const montreal = chosen !== null && isOutsideScopesReason(chosen)
  const magnitudeAnswered = montreal || notEstimated || emitsNothing || estimated.trim() !== ''

  const reset = () => {
    setChosen(null)
    setJustification('')
    setEstimated('')
    setNotEstimated(false)
    setEmitsNothing(false)
    setGas('')
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!chosen) return
    onExclude(
      montreal
        ? { reason: chosen, justification: justification.trim(), gas: gas.trim() }
        : notEstimated
          ? { reason: chosen, justification: justification.trim(), notEstimated: true }
          : emitsNothing
            ? {
                reason: chosen,
                justification: justification.trim(),
                estimatedKgCo2e: 0,
                emitsNothing: true,
              }
            : {
                reason: chosen,
                justification: justification.trim(),
                estimatedKgCo2e: Number(estimated),
              },
    )
    reset()
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-muted">
        A record left out is still reported: the report totals what was excluded, per reason, so a
        reader can see the shape of what is missing.
      </p>
      <div
        role="group"
        aria-label={`Exclude ${assignment.activityType}: choose a reason`}
        className="flex flex-col overflow-hidden rounded-xl border border-teal/15"
      >
        {/* spec 04.8: the Montreal reason reports a mass of gas, so it needs a mass unit */}
        {manualExclusionReasons
          .filter(
            (value) =>
              !isOutsideScopesReason(value) || unitDimension(units, assignment.unit) === 'MASS',
          )
          .map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={chosen === value}
              onClick={() => {
                if (isAutomaticReason(value)) onExclude({ reason: value })
                else setChosen(value)
              }}
              className={`border-b border-teal/10 px-3 py-2 text-left text-sm text-dark-teal transition-colors last:border-0 hover:bg-teal/10 ${
                chosen === value ? 'bg-teal/10 font-medium' : ''
              }`}
            >
              {exclusionLabels[value]}
            </button>
          ))}
      </div>
      {chosen && (
        <form
          onSubmit={submit}
          aria-label={`Exclude ${assignment.activityType}: justification`}
          className="flex flex-col gap-3 rounded-xl border border-teal/15 bg-white/60 p-3"
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
          {montreal ? (
            <InputField
              label="Gas"
              placeholder="HCFC-22"
              value={gas}
              maxLength={60}
              required
              hint="The mass this record holds is reported in the block Gases outside the scopes (Montreal Protocol), never as CO₂e."
              onChange={(event) => setGas(event.target.value)}
            />
          ) : (
            <>
              <InputField
                label="Estimated emissions left out (kg CO₂e)"
                type="number"
                min="0"
                step="0.001"
                value={estimated}
                disabled={notEstimated || emitsNothing}
                hint="The report totals these per reason."
                onChange={(event) => setEstimated(event.target.value)}
              />
              <label className="flex items-center gap-2 text-xs text-ink-muted">
                <input
                  type="checkbox"
                  aria-label="This record emits nothing"
                  checked={emitsNothing}
                  disabled={notEstimated}
                  onChange={(event) => {
                    setEmitsNothing(event.target.checked)
                    if (event.target.checked) setEstimated('0')
                  }}
                  className="h-4 w-4 accent-teal-deep"
                />
                This record emits nothing
              </label>
              <label className="flex items-center gap-2 text-xs text-ink-muted">
                <input
                  type="checkbox"
                  aria-label="Not estimated"
                  checked={notEstimated}
                  disabled={emitsNothing}
                  onChange={(event) => {
                    setNotEstimated(event.target.checked)
                    if (event.target.checked) setEstimated('')
                  }}
                  className="h-4 w-4 accent-teal-deep"
                />
                Not estimated: there is no basis to size this record
              </label>
            </>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" className="px-2.5 py-1 text-xs" onClick={reset}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-2.5 py-1 text-xs"
              disabled={
                justification.trim().length < 10 ||
                !magnitudeAnswered ||
                (montreal && gas.trim() === '')
              }
            >
              Exclude
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
