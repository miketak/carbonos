import type { Activity } from '../api'
import { formatQuantity, formatRecordPeriod } from '../format'
import { ActivityStatusPill } from './badges'
import { TapCheckbox } from './TapCheckbox'

function Paperclip() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-3.5 w-3.5"
    >
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  )
}

/**
 * The register's rows (spec 04.6): the fact, where and when, how much, and
 * how ready it is. No scope: that is an inventory decision. A row opens the
 * drawer; the open record and the keyboard cursor are highlighted.
 */
export function ActivityTable({
  activities,
  openId,
  cursorId,
  selected,
  onToggle,
  onToggleAll,
  onOpen,
  selectable = true,
}: {
  activities: Activity[]
  openId: string | null
  cursorId: string | null
  /** The ids ticked for a bulk action (spec 04.6). */
  selected: Set<string>
  onToggle: (id: string, checked: boolean) => void
  onToggleAll: (checked: boolean) => void
  onOpen: (activity: Activity) => void
  /** Selection exists only to feed the bulk Remove action (spec 01.4): hidden for a role that cannot write. */
  selectable?: boolean
}) {
  const allSelected = activities.length > 0 && activities.every((a) => selected.has(a.id))
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
          {selectable && (
            <th className="w-10 py-2 pl-2">
              <TapCheckbox
                label="Select all on this page"
                checked={allSelected}
                onChange={onToggleAll}
              />
            </th>
          )}
          <th className="px-4 py-3 font-semibold">Activity</th>
          <th className="px-4 py-3 font-semibold">Facility / period</th>
          <th className="px-4 py-3 text-right font-semibold">Quantity</th>
          <th className="px-4 py-3 font-semibold">Data status</th>
          <th className="px-4 py-3">
            <span className="sr-only">Attachments</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {activities.map((activity) => {
          const open = activity.id === openId
          const cursor = activity.id === cursorId
          const referenceOnly = activity.issues.includes('EVIDENCE_REFERENCE_ONLY')
          return (
            <tr
              key={activity.id}
              aria-selected={open}
              data-cursor={cursor || undefined}
              onClick={() => onOpen(activity)}
              className={`cursor-pointer border-b border-teal/5 transition-colors duration-100 last:border-0 ${
                open ? 'bg-teal/10' : cursor ? 'bg-teal/5' : 'hover:bg-teal/5'
              }`}
            >
              {selectable && (
                <td className="py-2 pl-2" onClick={(event) => event.stopPropagation()}>
                  <TapCheckbox
                    label={`Select ${activity.recordRef}`}
                    checked={selected.has(activity.id)}
                    onChange={(checked) => onToggle(activity.id, checked)}
                  />
                </td>
              )}
              <td className="px-4 py-3">
                <button
                  type="button"
                  className="text-left font-medium text-dark-teal focus-visible:ring-2 focus-visible:ring-bright-teal focus-visible:outline-none"
                  onClick={(event) => {
                    event.stopPropagation()
                    onOpen(activity)
                  }}
                >
                  {activity.activityType}
                </button>
                <span className="block text-xs text-ink-muted">
                  {activity.streamName ? `${activity.streamName} · ` : ''}
                  {activity.recordRef}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="block">{activity.facilityName}</span>
                <span className="block text-xs text-ink-muted">
                  {formatRecordPeriod(activity.periodStart, activity.periodEnd)}
                </span>
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <span
                  className={`block font-medium ${activity.quantity === null ? 'text-amber-700' : ''}`}
                >
                  {formatQuantity(activity.quantity)}
                </span>
                <span className="block text-xs text-ink-muted">
                  {activity.unit ?? (activity.quantity === null ? '' : 'Unit needed')}
                </span>
              </td>
              <td className="px-4 py-3">
                <ActivityStatusPill activity={activity} />
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <span
                  className={`inline-flex items-center gap-1 text-xs ${
                    activity.evidenceCount > 0 ? 'text-dark-teal' : 'text-ink-muted'
                  }`}
                  title={
                    activity.evidenceCount > 0
                      ? `${activity.evidenceCount} attached`
                      : referenceOnly
                        ? `Reference ${activity.evidenceRef ?? ''}, nothing attached`
                        : 'Nothing attached'
                  }
                >
                  <Paperclip />
                  {activity.evidenceCount > 0
                    ? activity.evidenceCount
                    : referenceOnly
                      ? 'ref'
                      : '–'}
                </span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
