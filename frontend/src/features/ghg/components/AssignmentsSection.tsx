import type { DateFormat } from '../../../lib/dates'
import { useDateFormat } from '../../../lib/dates'
import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '../../../components/Button'
import { Chip } from '../../../components/Chip'
import { InputField, SelectField } from '../../../components/Field'
import { FilterRow, FilterSelect, SearchField } from '../../../components/FilterRow'
import { Modal } from '../../../components/Modal'
import { Skeleton } from '../../../components/Skeleton'
import { SplitView, SummaryRow } from '../../../components/SplitView'
import { Table, TableFooter, Td, Th, TwoLine } from '../../../components/Table'
import { Tabs } from '../../../components/Tabs'
import { useToast } from '../../../components/toast'
import { refusalMessage } from '../../../lib/api'
import { useShortcuts } from '../../../lib/useShortcuts'
import { PAGE_SIZE, useInventoryFilters } from '../inventoryFilters'
import {
  categories,
  categoriesForScope,
  categoryLabel,
  exclusionLabels,
  formatPeriod,
  isAutomaticReason,
  isOutsideScopesReason,
  leaseLabels,
  manualExclusionReasons,
  scopeLabels,
} from '../format'
import { mayWrite, WRITE_TOOLTIP } from '../roles'
import { useSearchField } from '../useSearchField'
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
import { AssignmentDetail } from './AssignmentDetail'
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
    <kbd className="ml-1 rounded border border-hairline-strong px-1 text-[11px] text-ink-muted">
      {children}
    </kbd>
  )
}

/**
 * The classification a row carries, as text (spec 05.5). The editor is in the
 * detail; the row only has to say what was decided, which means the factor's
 * name, its unit, the packs that deliver it and whether anyone approved it.
 */
function FactorCell({
  assignment,
  factor,
}: {
  assignment: Assignment
  factor: EmissionFactor | undefined
}) {
  if (!assignment.included) return <span className="text-[13px] text-ink-muted">·</span>
  // ECO-7: the row carries its factor's name; the lookup only adds the unit, the packs and the
  // approval. A miss (the list still loading, a failed request) must not read as "no factor".
  if (!factor && assignment.emissionFactorId) return <span>{assignment.factorName}</span>
  if (!factor)
    return (
      <span className="text-[13px] text-warning">
        {assignment.suggestedFactorName
          ? `Suggested: ${assignment.suggestedFactorName}`
          : 'No factor chosen'}
      </span>
    )
  return (
    <div className="flex flex-col gap-0.5">
      <span>
        {factor.name}
        <span className="text-ink-muted"> (/{factor.unit})</span>
      </span>
      <span className="text-[13px] text-ink-muted">
        {factor.packs.join(', ')}
        {assignment.leaseType ? ` · ${leaseLabels[assignment.leaseType].toLowerCase()}` : ''}
        {assignment.proxy ? ' · proxy' : ''}
        {assignment.densityMaterial ? ` · via ${assignment.densityMaterial}` : ''}
      </span>
      {!factor.approved && (
        <Chip tone="warning" className="self-start">
          not approved
        </Chip>
      )}
    </div>
  )
}

/** The summary list's status tabs (spec 10); the same filter the select carries. */
type StatusTab = AssignmentStatus | ''

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
  const dateFormat = useDateFormat()
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
  const search = useSearchField(filters.q, (q) => set({ q }))

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
  // spec 10: a record open in the URL turns the register into the split
  const recordOpen = filters.record !== null
  const openAssignment = assignments?.find((assignment) => assignment.id === filters.record)

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
    // with a record open the cursor is the open record, so a step opens the neighbour
    if (openOnPage) set({ record: assignments[next].id })
    else setCursorId(assignments[next].id)
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

  const emptyState = (
    <>
      {assignmentsQuery.isPending && (
        <div aria-label="Loading assignments" className="flex flex-col gap-2 py-4">
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
      )}
      {assignments?.length === 0 && filtered && (
        <div className="py-8 text-center">
          <h3 className="font-semibold">No records match</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Clear the search or the filters to see the rest of the view.
          </p>
        </div>
      )}
      {assignments?.length === 0 && !filtered && (
        <div className="py-8 text-center">
          <h3 className="font-semibold">Nothing under review yet</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Hit "Review activity data" to pull in the organization's records.
          </p>
        </div>
      )}
    </>
  )

  const pager = pageCount > 1 && (
    <>
      <Button
        variant="ghost"
        size="sm"
        disabled={filters.page === 0}
        onClick={() => set({ page: filters.page - 1 })}
      >
        Previous
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={filters.page + 1 >= pageCount}
        onClick={() => set({ page: filters.page + 1 })}
      >
        Next
      </Button>
    </>
  )

  const countLine = (
    <>
      {(assignments?.length ?? 0).toLocaleString()} of {total.toLocaleString()} record
      {total === 1 ? '' : 's'}
      {pageCount > 1 ? `, page ${filters.page + 1} of ${pageCount}` : ''}
    </>
  )

  const statusTabs: { value: StatusTab; label: string; count?: number }[] = counts
    ? [
        { value: '', label: 'All', count: counts.included + counts.excluded + counts.unclassified },
        { value: 'UNCLASSIFIED', label: 'Unclassified', count: counts.unclassified },
        { value: 'INCLUDED', label: 'Included', count: counts.included },
        { value: 'EXCLUDED', label: 'Excluded', count: counts.excluded },
      ]
    : []

  return (
    <section>
      {!recordOpen ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.01em]">Activity view</h2>
              <p className="text-sm text-ink-muted">
                This inventory's accounting decisions about the facts. The records themselves are
                never modified.
              </p>
            </div>
            <RoleButton
              allowed={mayWrite(myRole)}
              tooltip={WRITE_TOOLTIP}
              variant="secondary"
              busy={sync.isPending}
              disabled={!editable}
              title={
                editable ? undefined : 'Reopen the inventory as a draft to review activity data'
              }
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
            <div className="flex flex-col gap-3">
              <FilterRow
                search={
                  <SearchField
                    ref={searchRef}
                    label="Search the view"
                    placeholder="Reference, activity, facility, emission source, factor, unit, evidence"
                    value={search.value}
                    onChange={(event) => search.onChange(event.target.value)}
                  />
                }
              >
                <FilterSelect
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
                </FilterSelect>
                <FilterSelect
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
                </FilterSelect>
                <FilterSelect
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
                </FilterSelect>
                <FilterSelect
                  label="Category"
                  value={filters.category}
                  onChange={(event) =>
                    set({ category: event.target.value as ActivityCategory | '' })
                  }
                >
                  <option value="">All categories</option>
                  {(filters.scope === '' ? categories : categoriesForScope(filters.scope)).map(
                    (entry) => (
                      <option key={entry.category} value={entry.category}>
                        {entry.label}
                      </option>
                    ),
                  )}
                </FilterSelect>
              </FilterRow>
              {/* the row holds four filters at most (spec 10); the stream and lease filters sit
                  under the last two, on the same columns */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-[minmax(220px,1.6fr)_repeat(4,minmax(0,1fr))]">
                <div aria-hidden="true" className="hidden lg:col-span-3 lg:block" />
                <FilterSelect
                  label="Emission source"
                  value={filters.stream}
                  onChange={(event) => set({ stream: event.target.value })}
                >
                  <option value="">All emission sources</option>
                  {(streamsQuery.data ?? []).map((stream) => (
                    <option key={stream.id} value={stream.id}>
                      {stream.facilityName} · {stream.name}
                    </option>
                  ))}
                </FilterSelect>
                <FilterSelect
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
                </FilterSelect>
              </div>
            </div>
          )}

          {emptyState}
          {assignments && assignments.length > 0 && (
            <Table>
              <thead>
                <tr>
                  {writable && (
                    <Th className="w-10 pr-0">
                      <TapCheckbox
                        label="Select all on this page"
                        checked={allSelected}
                        onChange={(checked) =>
                          setSelected(checked ? new Set(assignments.map((a) => a.id)) : new Set())
                        }
                      />
                    </Th>
                  )}
                  <Th>Fact</Th>
                  <Th>Facility / period</Th>
                  <Th align="right">Quantity</Th>
                  <Th>Factor</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => {
                  const cursor = assignment.id === effectiveCursorId
                  return (
                    <tr
                      key={assignment.id}
                      data-cursor={cursor || undefined}
                      onClick={() => set({ record: assignment.id })}
                      className={`cursor-pointer transition-colors duration-100 ${
                        cursor ? 'bg-selected' : 'hover:bg-surface-sunken'
                      }`}
                    >
                      {writable && (
                        <Td className="pr-0" onClick={(event) => event.stopPropagation()}>
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
                        </Td>
                      )}
                      <Td>
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            className="self-start text-left font-medium focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
                            onClick={(event) => {
                              event.stopPropagation()
                              set({ record: assignment.id })
                            }}
                          >
                            {assignment.activityType}
                          </button>
                          <span className="text-[13px] text-ink-muted">{assignment.recordRef}</span>
                          {assignment.changedSincePublication &&
                            assignment.changedSincePublication.length > 0 && (
                              <span className="text-[13px] text-warning">
                                Changed since publication:{' '}
                                {assignment.changedSincePublication.join(', ')}
                              </span>
                            )}
                        </div>
                      </Td>
                      <Td>
                        <TwoLine
                          primary={<span className="font-normal">{assignment.facilityName}</span>}
                          secondary={formatPeriod(
                            assignment.periodStart,
                            assignment.periodEnd,
                            dateFormat,
                          )}
                        />
                      </Td>
                      <Td align="right">
                        <TwoLine
                          align="right"
                          primary={assignment.quantity.toLocaleString()}
                          secondary={assignment.unit}
                        />
                      </Td>
                      <Td>
                        <FactorCell
                          assignment={assignment}
                          factor={factors.find(
                            (factor) => factor.id === assignment.emissionFactorId,
                          )}
                        />
                      </Td>
                      <Td>
                        <AssignmentStatusPills
                          assignment={assignment}
                          editable={writable}
                          onInclude={onInclude(assignment)}
                        />
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          )}

          {total > 0 && (
            <TableFooter
              pager={
                <>
                  {pager}
                  {selected.size > 0 ? (
                    <span className="flex items-center gap-2">
                      <span>{selected.size} selected</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDialog({ kind: 'bulkExclude', ids: [...selected] })}
                      >
                        Exclude {selected.size} selected
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                        Clear
                      </Button>
                    </span>
                  ) : (
                    <span className="text-ink-faint">
                      Select a row to classify
                      <Kbd>j</Kbd>
                      <Kbd>k</Kbd>
                      <Kbd>↵</Kbd>
                    </span>
                  )}
                </>
              }
            >
              {countLine}
            </TableFooter>
          )}
        </div>
      ) : (
        <SplitView
          listLabel="Activity view"
          detailLabel={openAssignment?.activityType ?? 'Not in this view'}
          list={
            <>
              <h2 className="text-xl font-semibold tracking-[-0.01em]">Activity view</h2>
              {counts && (
                <Tabs<StatusTab>
                  label="Status"
                  value={filters.status}
                  onChange={(status) => set({ status })}
                  tabs={statusTabs}
                />
              )}
              {emptyState}
              {assignments && assignments.length > 0 && (
                <div className="flex flex-col">
                  {assignments.map((assignment) => (
                    <SummaryRow
                      key={assignment.id}
                      title={assignment.activityType}
                      meta={summaryMeta(assignment, dateFormat)}
                      issue={
                        assignment.included && !assignment.classified ? 'Unclassified' : undefined
                      }
                      attention={assignment.included && !assignment.classified}
                      value={`${assignment.quantity.toLocaleString()} ${assignment.unit}`}
                      selected={assignment.id === filters.record}
                      onClick={() => set({ record: assignment.id })}
                    />
                  ))}
                </div>
              )}
              {total > 0 && <TableFooter pager={pager || undefined}>{countLine}</TableFooter>}
            </>
          }
          detail={
            <AssignmentDetail
              key={filters.record}
              organizationId={organizationId}
              assignmentId={filters.record ?? ''}
              pageItems={assignments ?? []}
              factors={factors}
              units={units}
              densities={densities}
              editable={writable}
              locked={!editable}
              period={period}
              onNavigate={(id) => set({ record: id })}
              onClose={() => set({ record: null })}
              onClassify={onClassify}
              onExclude={onExclude}
              onInclude={onInclude}
            />
          }
        />
      )}

      <CoverageMatrix rows={coverageQuery.data ?? []} />

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

/** The summary row's second line (spec 10): the facility with the scope and category, or with the period until classified. */
function summaryMeta(assignment: Assignment, dateFormat: DateFormat): ReactNode {
  if (assignment.included && assignment.classified && assignment.scope) {
    return `${assignment.facilityName} · ${scopeLabels[assignment.scope]}${
      assignment.category ? ` · ${categoryLabel(assignment.category)}` : ''
    }`
  }
  return `${assignment.facilityName} · ${formatPeriod(assignment.periodStart, assignment.periodEnd, dateFormat)}`
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
  // the automatic reasons are the review's own, never a preparer's; a gas outside the scopes
  // is named and weighed record by record (spec 04.8), so it has no place in a bulk form
  const reasons = manualExclusionReasons.filter(
    (reason) => !isAutomaticReason(reason) && !isOutsideScopesReason(reason),
  )
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
        <label className="flex items-start gap-2.5 text-[13px] text-ink-muted">
          <input
            type="checkbox"
            aria-label="These records emit nothing"
            checked={emitsNothing}
            onChange={(event) => setEmitsNothing(event.target.checked)}
            className="mt-0.5 size-4 accent-primary"
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
    <div className="mt-8 hidden md:block">
      <h3 className="text-base font-semibold">Period coverage</h3>
      <p className="text-[13px] text-ink-muted">
        Months of the reporting period with data from included records, per facility and emission
        source. A source with no data at all shows every month empty; a half circle is a draft still
        to be entered; a crossed circle is a documented zero.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table
          aria-label="Period coverage"
          className="w-full border-collapse text-left text-[13px]"
        >
          <thead>
            <tr>
              <Th className="px-2 py-2">Facility · emission source</Th>
              {months.map((month) => (
                <Th key={month} className="px-1 py-2 text-center">
                  {month.slice(5)}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.facilityId}:${row.streamId ?? row.activityType}`}>
                <td className="border-b border-hairline px-2 py-1.5 whitespace-nowrap">
                  <span className="text-ink-muted">{row.facilityName}</span> ·{' '}
                  {row.streamName ?? row.activityType}
                  {row.coveredMonths.length === 0 && row.zeroMonths.length === 0 && (
                    <Chip tone="warning" className="ml-2 h-[22px] text-xs">
                      no data
                    </Chip>
                  )}
                </td>
                {months.map((month) => {
                  const covered = row.coveredMonths.includes(month)
                  // spec 04.6: a draft's month is pending, data expected but not received
                  // spec 04.12: a month whose records are all documented zeros is its own state
                  const zero = !covered && row.zeroMonths.includes(month)
                  const pending = !covered && !zero && row.pendingMonths.includes(month)
                  return (
                    <td
                      key={month}
                      title={`${row.streamName ?? row.activityType}, ${month}: ${
                        covered
                          ? 'data'
                          : zero
                            ? 'documented zero'
                            : pending
                              ? 'draft on file, data expected'
                              : 'no data'
                      }`}
                      className={`border-b border-hairline px-1 py-1.5 text-center ${
                        covered
                          ? 'text-primary'
                          : zero
                            ? 'text-ink-muted'
                            : pending
                              ? 'text-warning'
                              : 'text-danger'
                      }`}
                    >
                      {covered ? '●' : zero ? '⊘' : pending ? '◐' : '○'}
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
