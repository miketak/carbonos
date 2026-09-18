import { useRef, useState } from 'react'
import { Button } from '../../../components/Button'
import { InputField, SelectField } from '../../../components/Field'
import { GlassCard } from '../../../components/GlassCard'
import { Modal } from '../../../components/Modal'
import { Skeleton } from '../../../components/Skeleton'
import { useToast } from '../../../components/toast'
import { refusalMessage } from '../../../lib/api'
import { useShortcuts } from '../../../lib/useShortcuts'
import { PAGE_SIZE, useInventoryFilters } from '../inventoryFilters'
import {
  categories,
  categoriesForScope,
  exclusionLabels,
  formatPeriod,
  isAutomaticReason,
  leaseLabels,
  manualExclusionReasons,
  scopeLabels,
} from '../format'
import { mayWrite, WRITE_TOOLTIP } from '../roles'
import type { MyRole } from '../roles'
import {
  useAssignmentPageQuery,
  useClassifyAssignment,
  useCoverageQuery,
  useDensitiesQuery,
  useEmissionFactorsByIdQuery,
  useFacilitiesQuery,
  useExcludeAssignment,
  useIncludeAssignment,
  useStreamsQuery,
  useSyncAssignments,
  useUnitsQuery,
} from '../useGhg'
import { AssignmentDrawer } from './AssignmentDrawer'
import { AssignmentStatusPills } from './badges'
import { RoleButton } from './RoleButton'
import { TapCheckbox } from './TapCheckbox'
import type {
  ActivityCategory,
  Assignment,
  AssignmentStatus,
  ClassifyInput,
  CoverageRow,
  EmissionFactor,
  ExcludeInput,
  ExclusionReason,
  GhgScope,
  LeaseType,
} from '../api'

type Dialog = { kind: 'bulkExclude'; ids: string[] } | null

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="ml-1 rounded border border-current/30 px-1 font-mono text-[10px] opacity-70">
      {children}
    </kbd>
  )
}

/**
 * The classification a row carries, as text (spec 05.5). The editor is in the
 * drawer; the row only has to say what was decided, which means the factor's
 * name, its unit, the packs that deliver it and whether anyone approved it.
 */
function FactorCell({
  assignment,
  factor,
}: {
  assignment: Assignment
  factor: EmissionFactor | undefined
}) {
  if (!assignment.included) return <span className="text-xs text-ink-muted">·</span>
  if (!factor)
    return (
      <span className="text-xs text-amber-700">
        {assignment.suggestedFactorName
          ? `Suggested: ${assignment.suggestedFactorName}`
          : 'No factor chosen'}
      </span>
    )
  return (
    <>
      <span className="block">
        {factor.name}
        <span className="text-ink-muted"> (/{factor.unit})</span>
      </span>
      <span className="block text-xs text-ink-muted">
        {factor.packs.join(', ')}
        {assignment.leaseType ? ` · ${leaseLabels[assignment.leaseType].toLowerCase()}` : ''}
        {assignment.proxy ? ' · proxy' : ''}
        {assignment.densityMaterial ? ` · via ${assignment.densityMaterial}` : ''}
      </span>
      {!factor.approved && (
        <span className="mt-0.5 inline-block rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-800">
          not approved
        </span>
      )}
    </>
  )
}

/** The activity view: this inventory's accounting decisions about the facts (spec 04, 04.1, 05). */
export function AssignmentsSection({
  organizationId,
  inventoryId,
  editable,
  myRole,
  period,
}: {
  organizationId: string
  inventoryId: string
  editable: boolean
  myRole?: MyRole | null
  /** The inventory's reporting period, so the picker offers the versions live in it (spec 02.6). */
  period?: { start: string; end: string }
}) {
  const writable = editable && mayWrite(myRole)
  const { filters, set, query } = useInventoryFilters()
  const assignmentsQuery = useAssignmentPageQuery(inventoryId, query)
  const facilitiesQuery = useFacilitiesQuery(organizationId)
  const streamsQuery = useStreamsQuery(organizationId)
  const coverageQuery = useCoverageQuery(inventoryId)
  const densitiesQuery = useDensitiesQuery(organizationId)
  const unitsQuery = useUnitsQuery(organizationId)
  const sync = useSyncAssignments(inventoryId)
  const classify = useClassifyAssignment(inventoryId)
  const exclude = useExcludeAssignment(inventoryId)
  const include = useIncludeAssignment(inventoryId)
  const toast = useToast()
  const [dialog, setDialog] = useState<Dialog>(null)
  const [cursorId, setCursorId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [excluding, setExcluding] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const assignments = assignmentsQuery.data?.items
  const counts = assignmentsQuery.data
  const total = counts?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const filtered =
    query.q !== undefined ||
    filters.facility !== '' ||
    filters.status !== '' ||
    filters.scope !== '' ||
    filters.category !== '' ||
    filters.stream !== '' ||
    filters.lease !== ''
  // FU-03: the rows need the factors they already reference, not the library. A page of 50
  // records references at most 100 factors, asked for by identifier.
  const referencedFactorIds = (assignments ?? []).flatMap((assignment) =>
    [assignment.emissionFactorId, assignment.suggestedFactorId].filter(
      (id): id is string => id !== null,
    ),
  )
  const factorsQuery = useEmissionFactorsByIdQuery(organizationId, referencedFactorIds)
  const factors = factorsQuery.data?.items ?? []
  const densities = densitiesQuery.data ?? []
  const units = unitsQuery.data ?? []
  const drawerOpen = filters.record !== null

  const onClassify = (assignment: Assignment) => (input: ClassifyInput) =>
    classify.mutate(
      { id: assignment.id, input },
      { onError: (error) => toast(refusalMessage(error, myRole), 'error') },
    )
  const onExclude = (assignment: Assignment) => (input: ExcludeInput) =>
    exclude.mutate(
      { id: assignment.id, input },
      { onError: (error) => toast(refusalMessage(error, myRole), 'error') },
    )
  const onInclude = (assignment: Assignment) => () =>
    include.mutate(assignment.id, {
      onError: (error) => toast(refusalMessage(error, myRole), 'error'),
    })

  // the keyboard cursor follows the open record, and never points outside the page
  const openOnPage = filters.record && assignments?.some((a) => a.id === filters.record)
  const effectiveCursorId = openOnPage
    ? filters.record
    : cursorId && assignments?.some((a) => a.id === cursorId)
      ? cursorId
      : null

  const move = (step: 1 | -1) => {
    if (!assignments || assignments.length === 0) return
    const index = assignments.findIndex((a) => a.id === effectiveCursorId)
    const next = index < 0 ? (step === 1 ? 0 : assignments.length - 1) : index + step
    if (next < 0 || next >= assignments.length) return
    setCursorId(assignments[next].id)
    // jsdom has no scrollIntoView; browsers keep the cursor row in view
    document.querySelector<HTMLElement>('[data-cursor]')?.scrollIntoView?.({ block: 'nearest' })
  }

  useShortcuts(
    {
      '/': () => searchRef.current?.focus(),
      j: () => move(1),
      k: () => move(-1),
      ArrowDown: () => move(1),
      ArrowUp: () => move(-1),
      Enter: () => effectiveCursorId && set({ record: effectiveCursorId }),
    },
    dialog === null,
  )

  const allSelected =
    (assignments?.length ?? 0) > 0 && (assignments ?? []).every((a) => selected.has(a.id))

  return (
    <section className={drawerOpen ? 'transition-[padding] duration-200 md:pr-[36rem]' : ''}>
      <GlassCard>
        <div className="flex flex-wrap items-end justify-between gap-3 px-4 pt-5">
          <div>
            <h2 className="text-xl">Activity view</h2>
            <p className="text-sm text-ink-muted">
              This inventory's accounting decisions about the facts. The records themselves are
              never modified.
            </p>
          </div>
          <RoleButton
            allowed={mayWrite(myRole)}
            tooltip={WRITE_TOOLTIP}
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
                onError: (error) => toast(refusalMessage(error, myRole), 'error'),
              })
            }
          >
            Review activity data
          </RoleButton>
        </div>

        {counts && counts.included + counts.excluded + counts.unclassified > 0 && (
          /* wraps rather than squeezes when the drawer takes the right third of the page */
          <div className="mt-4 flex flex-wrap items-end gap-2 border-b border-teal/10 px-4 pb-3 [&>*]:min-w-[10rem] [&>*]:flex-1">
            <div className="min-w-[16rem] flex-[3]">
              <InputField
                ref={searchRef}
                label="Search the view"
                placeholder="Reference, activity, facility, stream, factor, unit, evidence"
                value={filters.q}
                onChange={(event) => set({ q: event.target.value })}
              />
            </div>
            <SelectField
              label="Facility"
              value={filters.facility}
              onChange={(event) => set({ facility: event.target.value })}
            >
              <option value="">All facilities</option>
              {(facilitiesQuery.data ?? []).map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Status"
              value={filters.status}
              onChange={(event) => set({ status: event.target.value as AssignmentStatus | '' })}
            >
              <option value="">
                All ({counts.included + counts.excluded + counts.unclassified})
              </option>
              <option value="UNCLASSIFIED">Unclassified ({counts.unclassified})</option>
              <option value="INCLUDED">Included and classified ({counts.included})</option>
              <option value="EXCLUDED">Excluded ({counts.excluded})</option>
            </SelectField>
            <SelectField
              label="Scope"
              value={filters.scope}
              onChange={(event) => {
                const scope = event.target.value as GhgScope | ''
                const keepCategory =
                  filters.category === '' ||
                  scope === '' ||
                  categoriesForScope(scope).some((entry) => entry.category === filters.category)
                set({ scope, ...(keepCategory ? {} : { category: '' }) })
              }}
            >
              <option value="">All scopes</option>
              {(Object.keys(scopeLabels) as GhgScope[]).map((value) => (
                <option key={value} value={value}>
                  {scopeLabels[value]}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Category"
              value={filters.category}
              onChange={(event) => set({ category: event.target.value as ActivityCategory | '' })}
            >
              <option value="">All categories</option>
              {(filters.scope === '' ? categories : categoriesForScope(filters.scope)).map(
                (entry) => (
                  <option key={entry.category} value={entry.category}>
                    {entry.label}
                  </option>
                ),
              )}
            </SelectField>
            <SelectField
              label="Stream"
              value={filters.stream}
              onChange={(event) => set({ stream: event.target.value })}
            >
              <option value="">All streams</option>
              {(streamsQuery.data ?? []).map((stream) => (
                <option key={stream.id} value={stream.id}>
                  {stream.facilityName} · {stream.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Lease"
              value={filters.lease}
              onChange={(event) => set({ lease: event.target.value as LeaseType | '' })}
            >
              <option value="">Any lease treatment</option>
              {Object.entries(leaseLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectField>
          </div>
        )}

        <div className="overflow-x-auto">
          {assignmentsQuery.isPending && (
            <div aria-label="Loading assignments" className="flex flex-col gap-2 p-4">
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
          )}
          {assignments?.length === 0 && filtered && (
            <div className="p-8 text-center">
              <h3 className="font-semibold">No records match</h3>
              <p className="mt-1 text-sm text-ink-muted">
                Clear the search or the filters to see the rest of the view.
              </p>
            </div>
          )}
          {assignments?.length === 0 && !filtered && (
            <div className="p-8 text-center">
              <h3 className="font-semibold">Nothing under review yet</h3>
              <p className="mt-1 text-sm text-ink-muted">
                Hit "Review activity data" to pull in the organization's records.
              </p>
            </div>
          )}
          {assignments && assignments.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
                  {writable && (
                    <th className="w-10 py-2 pl-2">
                      <TapCheckbox
                        label="Select all on this page"
                        checked={allSelected}
                        onChange={(checked) =>
                          setSelected(checked ? new Set(assignments.map((a) => a.id)) : new Set())
                        }
                      />
                    </th>
                  )}
                  <th className="px-3 py-3 font-semibold">Fact</th>
                  <th className="px-3 py-3 font-semibold">Facility / period</th>
                  <th className="px-3 py-3 text-right font-semibold">Quantity</th>
                  <th className="px-3 py-3 font-semibold">Factor</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => {
                  const open = assignment.id === filters.record
                  const cursor = assignment.id === effectiveCursorId
                  return (
                    <tr
                      key={assignment.id}
                      aria-selected={open}
                      data-cursor={cursor || undefined}
                      onClick={() => set({ record: assignment.id })}
                      className={`cursor-pointer border-b border-teal/5 transition-colors duration-100 last:border-0 ${
                        open ? 'bg-teal/10' : cursor ? 'bg-teal/5' : 'hover:bg-teal/5'
                      }`}
                    >
                      {writable && (
                        <td className="py-2 pl-2" onClick={(event) => event.stopPropagation()}>
                          <TapCheckbox
                            label={`Select ${assignment.activityType}`}
                            checked={selected.has(assignment.id)}
                            onChange={(checked) =>
                              setSelected((current) => {
                                const next = new Set(current)
                                if (checked) next.add(assignment.id)
                                else next.delete(assignment.id)
                                return next
                              })
                            }
                          />
                        </td>
                      )}
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          className="text-left font-medium text-dark-teal focus-visible:ring-2 focus-visible:ring-bright-teal focus-visible:outline-none"
                          onClick={(event) => {
                            event.stopPropagation()
                            set({ record: assignment.id })
                          }}
                        >
                          {assignment.activityType}
                        </button>
                        <span className="ml-2 font-mono text-xs text-ink-muted">
                          {assignment.recordRef}
                        </span>
                        {assignment.changedSincePublication &&
                          assignment.changedSincePublication.length > 0 && (
                            <span className="block text-xs text-amber-700">
                              Changed since publication:{' '}
                              {assignment.changedSincePublication.join(', ')}
                            </span>
                          )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="block">{assignment.facilityName}</span>
                        <span className="block text-xs text-ink-muted">
                          {formatPeriod(assignment.periodStart, assignment.periodEnd)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums">
                        {assignment.quantity.toLocaleString()}
                        <span className="block text-xs text-ink-muted">{assignment.unit}</span>
                      </td>
                      <td className="px-3 py-3">
                        <FactorCell
                          assignment={assignment}
                          factor={factors.find(
                            (factor) => factor.id === assignment.emissionFactorId,
                          )}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <AssignmentStatusPills
                          assignment={assignment}
                          editable={writable}
                          onInclude={onInclude(assignment)}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {total > 0 && (
          <div className="flex items-center justify-between border-t border-teal/10 px-4 py-2 text-xs text-ink-muted">
            <span>
              {(assignments?.length ?? 0).toLocaleString()} of {total.toLocaleString()} record
              {total === 1 ? '' : 's'}
              {pageCount > 1 ? `, page ${filters.page + 1} of ${pageCount}` : ''}
            </span>
            <span className="flex items-center gap-2">
              {pageCount > 1 && (
                <>
                  <Button
                    variant="ghost"
                    className="px-2 py-1 text-xs"
                    disabled={filters.page === 0}
                    onClick={() => set({ page: filters.page - 1 })}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-2 py-1 text-xs"
                    disabled={filters.page + 1 >= pageCount}
                    onClick={() => set({ page: filters.page + 1 })}
                  >
                    Next
                  </Button>
                </>
              )}
              {selected.size > 0 ? (
                <span className="flex items-center gap-2">
                  <span>{selected.size} selected</span>
                  <Button
                    variant="ghost"
                    className="px-2 py-1 text-xs"
                    onClick={() => setDialog({ kind: 'bulkExclude', ids: [...selected] })}
                  >
                    Exclude {selected.size} selected
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-2 py-1 text-xs"
                    onClick={() => setSelected(new Set())}
                  >
                    Clear
                  </Button>
                </span>
              ) : (
                !drawerOpen && (
                  <span>
                    Select a row to classify
                    <Kbd>j</Kbd>
                    <Kbd>k</Kbd>
                    <Kbd>↵</Kbd>
                  </span>
                )
              )}
            </span>
          </div>
        )}
      </GlassCard>

      <CoverageMatrix rows={coverageQuery.data ?? []} />

      {drawerOpen && (
        <AssignmentDrawer
          key={filters.record}
          organizationId={organizationId}
          assignmentId={filters.record ?? ''}
          pageItems={assignments ?? []}
          factors={factors}
          units={units}
          densities={densities}
          editable={writable}
          period={period}
          onNavigate={(id) => set({ record: id })}
          onClose={() => set({ record: null })}
          onClassify={onClassify}
          onExclude={onExclude}
          onInclude={onInclude}
        />
      )}

      {dialog?.kind === 'bulkExclude' && (
        <BulkExcludeDialog
          count={dialog.ids.length}
          busy={excluding}
          onClose={() => setDialog(null)}
          onConfirm={async (input) => {
            setExcluding(true)
            const failed: string[] = []
            for (const id of dialog.ids) {
              try {
                await exclude.mutateAsync({ id, input })
              } catch (error) {
                const record = assignments?.find((a) => a.id === id)
                failed.push(`${record?.activityType ?? id}: ${refusalMessage(error, myRole)}`)
              }
            }
            setExcluding(false)
            setDialog(null)
            setSelected(new Set())
            const excluded = dialog.ids.length - failed.length
            if (failed.length === 0)
              toast(`${excluded} record${excluded === 1 ? '' : 's'} excluded.`)
            else toast(`${excluded} excluded. Not excluded: ${failed.join('; ')}`, 'error')
          }}
        />
      )}
    </section>
  )
}

/**
 * Leaves a page's worth of records out under one reason and one justification
 * (spec 05.6). A run of records excluded for the same reason is the case the
 * register meets most: a stream that is out of the boundary, a facility that
 * reports its own inventory.
 *
 * The magnitude is deliberately not asked for here. Chapter 9 wants a size per
 * record, and one number typed once cannot be it, so the bulk form takes only
 * the answers that are honestly shared: what the records are not estimated at,
 * or that they emit nothing.
 */
function BulkExcludeDialog({
  count,
  busy,
  onClose,
  onConfirm,
}: {
  count: number
  busy: boolean
  onClose: () => void
  onConfirm: (input: ExcludeInput) => void
}) {
  // the automatic reasons are the review's own, never a preparer's
  const reasons = manualExclusionReasons.filter((reason) => !isAutomaticReason(reason))
  const [reason, setReason] = useState<ExclusionReason>(reasons[0])
  const [justification, setJustification] = useState('')
  const [emitsNothing, setEmitsNothing] = useState(false)
  const valid = justification.trim().length >= 10

  return (
    <Modal title={`Exclude ${count} record${count === 1 ? '' : 's'}?`} onClose={onClose}>
      <p className="text-sm text-ink-muted">
        One reason and one justification are recorded against every record selected. A record a
        published run already counted is left in place and named in the result.
      </p>
      <div className="mt-4 flex flex-col gap-3">
        <SelectField
          label="Reason"
          value={reason}
          onChange={(event) => setReason(event.target.value as ExclusionReason)}
        >
          {reasons.map((value) => (
            <option key={value} value={value}>
              {exclusionLabels[value]}
            </option>
          ))}
        </SelectField>
        <InputField
          label="Justification"
          placeholder="Why these records are left out"
          value={justification}
          minLength={10}
          maxLength={500}
          required
          onChange={(event) => setJustification(event.target.value)}
        />
        <label className="flex items-center gap-2 text-xs text-ink-muted">
          <input
            type="checkbox"
            aria-label="These records emit nothing"
            checked={emitsNothing}
            onChange={(event) => setEmitsNothing(event.target.checked)}
            className="h-4 w-4 accent-teal-deep"
          />
          These records emit nothing. Leave it unticked and each is recorded as not estimated (spec
          04.8), which is the honest answer when nobody has sized them.
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!valid}
          busy={busy}
          onClick={() =>
            onConfirm(
              emitsNothing
                ? {
                    reason,
                    justification: justification.trim(),
                    estimatedKgCo2e: 0,
                    emitsNothing: true,
                  }
                : { reason, justification: justification.trim(), notEstimated: true },
            )
          }
        >
          Exclude {count}
        </Button>
      </div>
    </Modal>
  )
}

/**
 * Period coverage (spec 04.2, 04.5): which months of the inventory period have
 * data from included records, per facility and stream (or activity type for
 * records without a stream), so a missing quarter or a silent stream is
 * visible before the run.
 */
function CoverageMatrix({ rows }: { rows: CoverageRow[] }) {
  if (rows.length === 0) return null
  const months = rows[0].months
  return (
    <div className="mt-6 hidden md:block">
      <h3 className="text-sm font-semibold">Period coverage</h3>
      <p className="text-xs text-ink-muted">
        Months of the reporting period with data from included records, per facility and stream. A
        stream with no data at all shows every month empty; a half circle is a draft still to be
        entered.
      </p>
      <div className="mt-2 overflow-x-auto">
        <table aria-label="Period coverage" className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-teal/10 text-ink-muted uppercase">
              <th className="px-2 py-1 font-semibold">Facility · stream</th>
              {months.map((month) => (
                <th key={month} className="px-1 py-1 text-center font-semibold">
                  {month.slice(5)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.facilityId}:${row.streamId ?? row.activityType}`}
                className="border-b border-teal/5"
              >
                <td className="px-2 py-1 whitespace-nowrap">
                  <span className="text-ink-muted">{row.facilityName}</span> ·{' '}
                  {row.streamName ?? row.activityType}
                  {row.coveredMonths.length === 0 && (
                    <span className="ml-1 rounded-full bg-red-100 px-1.5 text-red-700">
                      no data
                    </span>
                  )}
                </td>
                {months.map((month) => {
                  const covered = row.coveredMonths.includes(month)
                  // spec 04.6: a draft's month is pending, data expected but not received
                  const pending = !covered && row.pendingMonths.includes(month)
                  return (
                    <td
                      key={month}
                      title={`${row.streamName ?? row.activityType}, ${month}: ${
                        covered ? 'data' : pending ? 'draft on file, data expected' : 'no data'
                      }`}
                      className={`px-1 py-1 text-center ${
                        covered ? 'text-dark-teal' : pending ? 'text-amber-600' : 'text-red-500'
                      }`}
                    >
                      {covered ? '●' : pending ? '◐' : '○'}
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
