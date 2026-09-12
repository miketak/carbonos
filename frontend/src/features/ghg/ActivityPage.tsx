import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { InputField, SelectField } from '../../components/Field'
import { GlassCard } from '../../components/GlassCard'
import { MonthField } from '../../components/MonthField'
import { Skeleton } from '../../components/Skeleton'
import { Tabs } from '../../components/Tabs'
import { useToast } from '../../components/toast'
import { problemDetail } from '../../lib/api'
import { useShortcuts } from '../../lib/useShortcuts'
import { PAGE_SIZE, useActivityFilters } from './activityFilters'
import type { ActivitySort, ActivityTab } from './activityFilters'
import { ActivityDrawer } from './components/ActivityDrawer'
import { ActivityHistoryModal } from './components/ActivityHistoryModal'
import { ActivityTable } from './components/ActivityTable'
import { Breadcrumb } from './components/Breadcrumb'
import { CompletenessBanner } from './components/CompletenessBanner'
import { ImportActivitiesModal } from './components/ImportActivitiesModal'
import { RemoveDialog } from './components/RemoveDialog'
import {
  useActivityPageQuery,
  useDeleteActivity,
  useFacilitiesQuery,
  useStreamsQuery,
} from './useGhg'
import type { Activity } from './api'

type Dialog =
  | { kind: 'import' }
  | { kind: 'remove'; activity: Activity }
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
    <kbd className="ml-1 rounded border border-current/30 px-1 font-mono text-[10px] opacity-70">
      {children}
    </kbd>
  )
}

/**
 * The data-collection register (spec 04.6): what happened, how ready each
 * record is for review, and a drawer to work through them without leaving
 * the list. Scope, factors and accounting treatment are decided per
 * inventory, never here (spec 02). Filters live in the URL.
 */
export function ActivityPage() {
  const { organizationId = '' } = useParams()
  const { filters, set, query } = useActivityFilters()
  const activitiesQuery = useActivityPageQuery(organizationId, query)
  const facilitiesQuery = useFacilitiesQuery(organizationId)
  const streamsQuery = useStreamsQuery(organizationId)
  const deleteActivity = useDeleteActivity(organizationId)
  const toast = useToast()
  const [dialog, setDialog] = useState<Dialog>(null)
  const [cursorId, setCursorId] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

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
  const drawerOpen = filters.record !== null

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

  useShortcuts(
    {
      n: () => facilities.length > 0 && set({ record: 'new' }),
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

  return (
    <section className={drawerOpen ? 'transition-[padding] duration-200 md:pr-[36rem]' : ''}>
      <Breadcrumb items={[{ label: 'Data collection' }, { label: 'Activity data' }]} />
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl">Activity data</h1>
          <p className="text-sm text-ink-muted">
            A clear record of what your business consumes and produces. Each inventory decides
            separately how it is accounted for.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="px-4 py-1.5 text-sm"
            onClick={() => setDialog({ kind: 'import' })}
            disabled={facilities.length === 0}
            title={facilities.length === 0 ? 'Add a facility first' : undefined}
          >
            Import CSV
          </Button>
          <Button
            className="px-4 py-1.5 text-sm"
            onClick={() => set({ record: 'new' })}
            disabled={facilities.length === 0}
            title={facilities.length === 0 ? 'Add a facility first' : 'Press N'}
          >
            + Add activity
            <Kbd>N</Kbd>
          </Button>
        </div>
      </div>

      {counts && <CompletenessBanner counts={counts} onResolve={() => set({ tab: 'attention' })} />}

      <GlassCard className="animate-fade-up">
        <div className="px-4 pt-2">
          <Tabs<ActivityTab>
            label="Readiness"
            tabs={tabs}
            value={filters.tab}
            onChange={(tab) => set({ tab })}
          />
        </div>
        {/* wraps rather than squeezes when the drawer takes the right third of the page */}
        <div className="flex flex-wrap items-end gap-2 border-b border-teal/10 px-4 py-3 [&>*]:min-w-[10rem] [&>*]:flex-1">
          <div className="min-w-[16rem] flex-[3]">
            <InputField
              ref={searchRef}
              label="Search"
              placeholder="Find an activity, facility, stream, reference or ACT-0001"
              value={filters.q}
              onChange={(event) => set({ q: event.target.value })}
            />
          </div>
          <SelectField
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
          </SelectField>
          <SelectField
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
          </SelectField>
          <div className="min-w-[15rem]">
            <MonthField label="Period" value={filters.month} onChange={(month) => set({ month })} />
          </div>
          <SelectField
            label="Sort by"
            value={filters.sort}
            onChange={(event) => set({ sort: event.target.value as ActivitySort })}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
          <Button
            type="button"
            variant="ghost"
            className="!min-w-0 !flex-none px-3 py-2 text-sm"
            aria-label={filters.dir === 'desc' ? 'Sort ascending' : 'Sort descending'}
            onClick={() => set({ dir: filters.dir === 'desc' ? 'asc' : 'desc' })}
          >
            {filters.dir === 'desc' ? '↓' : '↑'}
          </Button>
        </div>

        <div className="overflow-x-auto">
          {activitiesQuery.isPending && (
            <div aria-label="Loading activities" className="flex flex-col gap-2 p-4">
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
          )}
          {activities?.length === 0 && (filtered || filters.tab !== 'all') && (
            <div className="p-8 text-center">
              <h2 className="font-semibold">
                {filters.tab === 'attention' && !filtered
                  ? 'Nothing needs attention'
                  : 'No records match'}
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                {filters.tab === 'attention' && !filtered
                  ? 'Every record has its figures, a stream, a source and evidence.'
                  : 'Clear the search, the filters or the tab.'}
              </p>
            </div>
          )}
          {activities?.length === 0 && !filtered && filters.tab === 'all' && (
            <div className="p-8 text-center">
              <h2 className="font-semibold">No activity data yet</h2>
              <p className="mt-1 text-sm text-ink-muted">
                {facilities.length === 0
                  ? 'Add a facility, then record what happened there.'
                  : 'Record the first fact: fuel burned, electricity bought, kilometres travelled. Or import a spreadsheet.'}
              </p>
            </div>
          )}
          {activities && activities.length > 0 && (
            <ActivityTable
              activities={activities}
              openId={filters.record}
              cursorId={effectiveCursorId}
              onOpen={(activity) => set({ record: activity.id })}
            />
          )}
        </div>
        {total > 0 && (
          <div className="flex items-center justify-between border-t border-teal/10 px-4 py-2 text-xs text-ink-muted">
            <span>
              {(activities?.length ?? 0).toLocaleString()} of {total.toLocaleString()} record
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
              {!drawerOpen && (
                <span>
                  Select a row to edit
                  <Kbd>j</Kbd>
                  <Kbd>k</Kbd>
                  <Kbd>↵</Kbd>
                </span>
              )}
            </span>
          </div>
        )}
      </GlassCard>
      <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-ink-muted">
        <span>Activity records can support more than one inventory.</span>
        <span>Review status reflects completeness, not assurance.</span>
      </div>

      {drawerOpen && (
        <ActivityDrawer
          key={filters.record}
          organizationId={organizationId}
          activityId={filters.record ?? 'new'}
          pageItems={activities ?? []}
          facilities={facilities}
          defaultFacilityId={filters.facility || undefined}
          onNavigate={(id) => set({ record: id })}
          onClose={() => set({ record: null })}
          onSaved={(message) => toast(message)}
          onHistory={(activity) => setDialog({ kind: 'history', activity })}
          onRemove={(activity) => setDialog({ kind: 'remove', activity })}
        />
      )}
      {dialog?.kind === 'import' && (
        <ImportActivitiesModal
          organizationId={organizationId}
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
                  toast(problemDetail(error) ?? 'Could not remove the activity.', 'error')
                },
              },
            )
          }
        />
      )}
      {dialog?.kind === 'history' && (
        <ActivityHistoryModal activity={dialog.activity} onClose={() => setDialog(null)} />
      )}
    </section>
  )
}
