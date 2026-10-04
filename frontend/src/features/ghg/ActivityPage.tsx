import { useEffect, useId, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { controlClasses } from '../../components/Field'
import { FilterRow, FilterSelect, SearchField } from '../../components/FilterRow'
import { PageHeader } from '../../components/PageHeader'
import { Skeleton } from '../../components/Skeleton'
import { SplitView, SummaryRow } from '../../components/SplitView'
import { TableFooter } from '../../components/Table'
import { Tabs } from '../../components/Tabs'
import { useToast } from '../../components/toast'
import { refusalMessage } from '../../lib/api'
import { useShortcuts } from '../../lib/useShortcuts'
import { PAGE_SIZE, useActivityFilters } from './activityFilters'
import type { ActivitySort, ActivityTab } from './activityFilters'
import { ActivityDrawer } from './components/ActivityDrawer'
import { ActivityHistoryModal } from './components/ActivityHistoryModal'
import { ActivityTable } from './components/ActivityTable'
import { CompletenessBanner } from './components/CompletenessBanner'
import { ImportActivitiesModal } from './components/ImportActivitiesModal'
import { RemoveDialog } from './components/RemoveDialog'
import { useSearchField } from './useSearchField'
import { RoleButton } from './components/RoleButton'
import { ViewSwitch } from './components/ViewSwitch'
import { activityIssueLabels, formatQuantity, formatRecordPeriod } from './format'
import { mayWrite, WRITE_TOOLTIP } from './roles'
import {
  useActivityPageQuery,
  useDeleteActivity,
  useFacilitiesQuery,
  useOrganizationQuery,
  useStreamsQuery,
} from './useGhg'
import type { Activity } from './api'

type Dialog =
  | { kind: 'import' }
  | { kind: 'remove'; activity: Activity }
  | { kind: 'bulkRemove'; ids: string[] }
  | { kind: 'history'; activity: Activity }
  | null

const sortOptions: { value: ActivitySort; label: string }[] = [
  { value: 'periodEnd', label: 'Period' },
  { value: 'recordNo', label: 'Record number' },
  { value: 'facility', label: 'Facility' },
  { value: 'activityType', label: 'Activity' },
  { value: 'quantity', label: 'Quantity' },
  { value: 'createdAt', label: 'Entered' },
]

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="ml-1 rounded border border-hairline-strong px-1 text-[10px] text-ink-muted">
      {children}
    </kbd>
  )
}

/**
 * A month on the filter row (spec 10): a native month input with its label
 * for screen readers, so it sits level with the selects. The kit's
 * MonthField carries a visible label and step arrows and is built for a form.
 */
function MonthFilter({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="month"
        value={value}
        placeholder="All periods"
        onChange={(event) => onChange(event.target.value)}
        className={controlClasses}
      />
    </div>
  )
}

/**
 * The data-collection register (spec 04.6) as the split register of spec 10:
 * the full table with its stat strip, tabs, filter row and footer, until a
 * record is opened; then the register as a summary list beside the record's
 * detail. Scope, factors and accounting treatment are decided per inventory,
 * never here (spec 02). Filters and the open record live in the URL.
 */
export function ActivityPage() {
  const { organizationId = '' } = useParams()
  const { filters, set, query } = useActivityFilters()
  const activitiesQuery = useActivityPageQuery(organizationId, query)
  const facilitiesQuery = useFacilitiesQuery(organizationId)
  const streamsQuery = useStreamsQuery(organizationId)
  const deleteActivity = useDeleteActivity(organizationId)
  const organizationQuery = useOrganizationQuery(organizationId)
  const myRole = organizationQuery.data?.myRole
  const toast = useToast()
  const [dialog, setDialog] = useState<Dialog>(null)
  const [cursorId, setCursorId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [removing, setRemoving] = useState(false)
  // the record whose row takes the focus back when its detail closes
  const returnTo = useRef<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const search = useSearchField(filters.q, (q) => set({ q }))

  const activities = activitiesQuery.data?.items
  const counts = activitiesQuery.data?.counts
  const total = activitiesQuery.data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const filtered =
    query.q !== undefined ||
    filters.facility !== '' ||
    filters.stream !== '' ||
    filters.month !== ''
  const facilities = facilitiesQuery.data ?? []
  const streams = (streamsQuery.data ?? []).filter(
    (stream) => filters.facility === '' || stream.facilityId === filters.facility,
  )
  const detailOpen = filters.record !== null

  // the keyboard cursor follows the open record, and never points outside the page
  const openOnPage =
    filters.record && filters.record !== 'new' && activities?.some((a) => a.id === filters.record)
  const effectiveCursorId = openOnPage
    ? filters.record
    : cursorId && activities?.some((a) => a.id === cursorId)
      ? cursorId
      : null

  const move = (step: 1 | -1) => {
    if (!activities || activities.length === 0) return
    const index = activities.findIndex((a) => a.id === effectiveCursorId)
    const next = index < 0 ? (step === 1 ? 0 : activities.length - 1) : index + step
    if (next < 0 || next >= activities.length) return
    setCursorId(activities[next].id)
    // jsdom has no scrollIntoView; browsers keep the cursor row in view
    document.querySelector<HTMLElement>('[data-cursor]')?.scrollIntoView?.({ block: 'nearest' })
  }

  const closeDetail = () => {
    returnTo.current = filters.record
    setCursorId(filters.record)
    set({ record: null })
  }

  // the table is back: focus returns to the row of the record that was open
  useEffect(() => {
    if (filters.record !== null || returnTo.current === null) return
    document.querySelector<HTMLElement>(`[data-record="${returnTo.current}"] button`)?.focus()
    returnTo.current = null
  }, [filters.record])

  useShortcuts(
    {
      n: () => facilities.length > 0 && mayWrite(myRole) && set({ record: 'new' }),
      '/': () => searchRef.current?.focus(),
      j: () => move(1),
      k: () => move(-1),
      ArrowDown: () => move(1),
      ArrowUp: () => move(-1),
      Enter: () => effectiveCursorId && set({ record: effectiveCursorId }),
    },
    dialog === null,
  )

  const tabs: { value: ActivityTab; label: string; count?: number }[] = [
    { value: 'all', label: 'All records', count: counts?.total },
    { value: 'attention', label: 'Needs attention', count: counts?.needsAttention },
    { value: 'ready', label: 'Ready', count: counts?.ready },
  ]
  if ((counts?.drafts ?? 0) > 0 || filters.tab === 'drafts') {
    tabs.push({ value: 'drafts', label: 'Drafts', count: counts?.drafts })
  }

  const readinessTabs = (
    <Tabs<ActivityTab>
      label="Readiness"
      tabs={tabs}
      value={filters.tab}
      onChange={(tab) => set({ tab })}
    />
  )

  const countLine = total > 0 && (
    <>
      {(activities?.length ?? 0).toLocaleString()} of {total.toLocaleString()} record
      {total === 1 ? '' : 's'}
      {pageCount > 1 ? `, page ${filters.page + 1} of ${pageCount}` : ''}
    </>
  )

  const emptyState = activities?.length === 0 && (
    <div className="px-6 py-12 text-center">
      <h2 className="font-medium">
        {filtered || filters.tab !== 'all'
          ? filters.tab === 'attention' && !filtered
            ? 'Nothing needs attention'
            : 'No records match'
          : 'No activity data yet'}
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        {filtered || filters.tab !== 'all'
          ? filters.tab === 'attention' && !filtered
            ? 'Every record has its figures, a stream, a source and evidence.'
            : 'Clear the search, the filters or the tab.'
          : facilities.length === 0
            ? 'Add a facility, then record what happened there.'
            : 'Record the first fact: fuel burned, electricity bought, kilometres travelled. Or import a spreadsheet.'}
      </p>
    </div>
  )

  const loading = activitiesQuery.isPending && (
    <div aria-label="Loading activities" className="flex flex-col gap-2">
      <Skeleton className="h-12" />
      <Skeleton className="h-12" />
    </div>
  )

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        back={{ to: `/app/ghg/${organizationId}` }}
        crumbs={[{ label: 'Data collection' }, { label: 'Activity data' }]}
        title="Activity data"
        subtitle="A clear record of what your business consumes and produces. Each inventory decides separately how it is accounted for."
        actions={
          <>
            <ViewSwitch organizationId={organizationId} />
            <RoleButton
              allowed={mayWrite(myRole)}
              tooltip={WRITE_TOOLTIP}
              variant="secondary"
              onClick={() => setDialog({ kind: 'import' })}
              disabled={facilities.length === 0}
              title={facilities.length === 0 ? 'Add a facility first' : undefined}
            >
              Import CSV
            </RoleButton>
            <RoleButton
              allowed={mayWrite(myRole)}
              tooltip={WRITE_TOOLTIP}
              onClick={() => set({ record: 'new' })}
              disabled={facilities.length === 0}
              title={facilities.length === 0 ? 'Add a facility first' : 'Press N'}
            >
              + Add activity
              <Kbd>N</Kbd>
            </RoleButton>
          </>
        }
      />

      {!detailOpen && (
        <>
          {counts && (
            <CompletenessBanner counts={counts} onResolve={() => set({ tab: 'attention' })} />
          )}
          {readinessTabs}
          <FilterRow
            filters={4}
            search={
              <SearchField
                ref={searchRef}
                label="Search"
                placeholder="Find an activity, facility, stream, reference or ACT-0001"
                value={search.value}
                onChange={(event) => search.onChange(event.target.value)}
              />
            }
          >
            <FilterSelect
              label="Facility"
              value={filters.facility}
              onChange={(event) => set({ facility: event.target.value, stream: '' })}
            >
              <option value="">All facilities</option>
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              label="Stream"
              value={filters.stream}
              onChange={(event) => set({ stream: event.target.value })}
            >
              <option value="">All streams</option>
              {streams.map((stream) => (
                <option key={stream.id} value={stream.id}>
                  {stream.name}
                  {filters.facility === '' ? ` (${stream.facilityName})` : ''}
                </option>
              ))}
            </FilterSelect>
            <MonthFilter
              label="Period"
              value={filters.month}
              onChange={(month) => set({ month })}
            />
            <div className="flex items-center gap-1">
              <FilterSelect
                label="Sort by"
                className="min-w-0 flex-1"
                value={filters.sort}
                onChange={(event) => set({ sort: event.target.value as ActivitySort })}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </FilterSelect>
              <Button
                type="button"
                variant="ghost"
                className="shrink-0 px-3"
                aria-label={filters.dir === 'desc' ? 'Sort ascending' : 'Sort descending'}
                onClick={() => set({ dir: filters.dir === 'desc' ? 'asc' : 'desc' })}
              >
                {filters.dir === 'desc' ? '↓' : '↑'}
              </Button>
            </div>
          </FilterRow>

          {loading}
          {emptyState}
          {activities && activities.length > 0 && (
            <ActivityTable
              activities={activities}
              openId={filters.record}
              cursorId={effectiveCursorId}
              selected={selected}
              selectable={mayWrite(myRole)}
              onToggle={(id, checked) =>
                setSelected((current) => {
                  const next = new Set(current)
                  if (checked) next.add(id)
                  else next.delete(id)
                  return next
                })
              }
              onToggleAll={(checked) =>
                setSelected(checked ? new Set(activities.map((a) => a.id)) : new Set())
              }
              onOpen={(activity) => set({ record: activity.id })}
            />
          )}
          {total > 0 && (
            <TableFooter
              pager={
                pageCount > 1 ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={filters.page === 0}
                      onClick={() => set({ page: filters.page - 1 })}
                    >
                      Previous
                    </Button>
                    <span aria-hidden="true" className="mx-2 h-5 w-px bg-hairline" />
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={filters.page + 1 >= pageCount}
                      onClick={() => set({ page: filters.page + 1 })}
                    >
                      Next
                    </Button>
                  </>
                ) : undefined
              }
            >
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{countLine}</span>
                {selected.size > 0 ? (
                  <span className="flex items-center gap-2">
                    <span>{selected.size} selected</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger"
                      onClick={() => setDialog({ kind: 'bulkRemove', ids: [...selected] })}
                    >
                      Remove {selected.size} selected
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                      Clear
                    </Button>
                  </span>
                ) : (
                  <span className="text-ink-faint">
                    Select a row to edit
                    <Kbd>j</Kbd>
                    <Kbd>k</Kbd>
                    <Kbd>↵</Kbd>
                  </span>
                )}
              </span>
            </TableFooter>
          )}
        </>
      )}

      {detailOpen && (
        <SplitView
          listLabel="Activity"
          detailLabel="Record"
          list={
            <>
              {readinessTabs}
              {loading}
              {emptyState}
              {activities && activities.length > 0 && (
                <div className="flex flex-col">
                  {activities.map((activity) => {
                    const blocking = activity.issues.filter(
                      (issue) => issue !== 'EVIDENCE_REFERENCE_ONLY',
                    )
                    const attention = activity.status === 'NEEDS_ATTENTION'
                    return (
                      <SummaryRow
                        key={activity.id}
                        title={activity.activityType}
                        meta={`${activity.facilityName} · ${formatRecordPeriod(activity.periodStart, activity.periodEnd)}`}
                        issue={
                          attention && blocking[0] ? activityIssueLabels[blocking[0]] : undefined
                        }
                        value={`${formatQuantity(activity.quantity)}${activity.unit ? ` ${activity.unit}` : ''}`}
                        selected={activity.id === filters.record}
                        attention={attention}
                        onClick={() => set({ record: activity.id })}
                      />
                    )
                  })}
                </div>
              )}
              {total > 0 && <p className="text-[13px] text-ink-muted">{countLine}</p>}
            </>
          }
          detail={
            <ActivityDrawer
              key={filters.record}
              organizationId={organizationId}
              activityId={filters.record ?? 'new'}
              pageItems={activities ?? []}
              facilities={facilities}
              defaultFacilityId={filters.facility || undefined}
              myRole={myRole}
              onNavigate={(id) => set({ record: id })}
              onClose={closeDetail}
              onSaved={(message) => toast(message)}
              onHistory={(activity) => setDialog({ kind: 'history', activity })}
              onRemove={(activity) => setDialog({ kind: 'remove', activity })}
            />
          }
        />
      )}

      <div className="flex flex-wrap justify-between gap-2 text-[13px] text-ink-muted">
        <span>Activity records can support more than one inventory.</span>
        <span>Review status reflects completeness, not assurance.</span>
      </div>

      {dialog?.kind === 'import' && (
        <ImportActivitiesModal
          organizationId={organizationId}
          myRole={myRole}
          onClose={() => setDialog(null)}
          onImported={(count) => {
            setDialog(null)
            toast(`${count} record${count === 1 ? '' : 's'} imported.`)
          }}
        />
      )}
      {dialog?.kind === 'remove' && (
        <RemoveDialog
          title={`Remove ${dialog.activity.activityType}?`}
          description="The record stays on file as removed, with your name, the date and the reason; inventories that reviewed it exclude it on their next review. A record a run calculated cannot be removed."
          busy={deleteActivity.isPending}
          onClose={() => setDialog(null)}
          onConfirm={(reason) =>
            deleteActivity.mutate(
              { id: dialog.activity.id, reason },
              {
                onSuccess: () => {
                  setDialog(null)
                  if (filters.record === dialog.activity.id) set({ record: null })
                  toast('Activity removed.')
                },
                onError: (error) => {
                  setDialog(null)
                  toast(refusalMessage(error, myRole), 'error')
                },
              },
            )
          }
        />
      )}
      {dialog?.kind === 'bulkRemove' && (
        <RemoveDialog
          title={`Remove ${dialog.ids.length} record${dialog.ids.length === 1 ? '' : 's'}?`}
          description="Each record stays on file as removed, with your name, the date and this one reason. A record a run calculated cannot be removed and is left in place."
          busy={removing}
          onClose={() => setDialog(null)}
          onConfirm={async (reason) => {
            setRemoving(true)
            const failed: string[] = []
            for (const id of dialog.ids) {
              try {
                await deleteActivity.mutateAsync({ id, reason })
              } catch (error) {
                const record = activities?.find((a) => a.id === id)
                failed.push(`${record?.recordRef ?? id}: ${refusalMessage(error, myRole)}`)
              }
            }
            setRemoving(false)
            setDialog(null)
            setSelected(new Set())
            if (
              filters.record &&
              dialog.ids.includes(filters.record) &&
              !failed.some((f) => f.startsWith(filters.record ?? ''))
            ) {
              set({ record: null })
            }
            const removed = dialog.ids.length - failed.length
            if (failed.length === 0) toast(`${removed} record${removed === 1 ? '' : 's'} removed.`)
            else toast(`${removed} removed. Not removed: ${failed.join('; ')}`, 'error')
          }}
        />
      )}
      {dialog?.kind === 'history' && (
        <ActivityHistoryModal activity={dialog.activity} onClose={() => setDialog(null)} />
      )}
    </section>
  )
}
