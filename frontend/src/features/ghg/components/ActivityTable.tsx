import { Table, Td, Th, TwoLine } from '../../../components/Table'
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
      className="size-3.5"
    >
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  )
}

/**
 * The register's rows (spec 04.6): the fact, where and when, how much, and
 * how ready it is. No scope: that is an inventory decision. A row opens the
 * record's detail; the open record and the keyboard cursor are highlighted.
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
    <Table>
      <thead>
        <tr>
          {selectable && (
            <Th className="w-11 pr-0">
              <TapCheckbox
                label="Select all on this page"
                checked={allSelected}
                onChange={onToggleAll}
              />
            </Th>
          )}
          <Th>Activity</Th>
          <Th>Facility / period</Th>
          <Th align="right">Quantity</Th>
          <Th>Data status</Th>
          <Th align="right">
            <span className="sr-only">Attachments</span>
          </Th>
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
              data-record={activity.id}
              onClick={() => onOpen(activity)}
              className={`cursor-pointer transition-colors duration-100 ${
                open
                  ? 'bg-selected shadow-[inset_3px_0_0_var(--primary)]'
                  : cursor
                    ? 'bg-surface-sunken'
                    : 'hover:bg-surface-sunken'
              }`}
            >
              {selectable && (
                <Td className="pr-0" onClick={(event) => event.stopPropagation()}>
                  <TapCheckbox
                    label={`Select ${activity.recordRef}`}
                    checked={selected.has(activity.id)}
                    onChange={(checked) => onToggle(activity.id, checked)}
                  />
                </Td>
              )}
              <Td>
                <TwoLine
                  primary={
                    <button
                      type="button"
                      className="text-left font-medium hover:underline focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
                      onClick={(event) => {
                        event.stopPropagation()
                        onOpen(activity)
                      }}
                    >
                      {activity.activityType}
                    </button>
                  }
                  secondary={
                    <>
                      {activity.streamName ? `${activity.streamName} · ` : ''}
                      {activity.recordRef}
                    </>
                  }
                />
              </Td>
              <Td>
                <TwoLine
                  primary={<span className="font-normal">{activity.facilityName}</span>}
                  secondary={formatRecordPeriod(activity.periodStart, activity.periodEnd)}
                />
              </Td>
              <Td align="right">
                <TwoLine
                  align="right"
                  primary={
                    <span className={activity.quantity === null ? 'text-warning' : ''}>
                      {formatQuantity(activity.quantity)}
                    </span>
                  }
                  secondary={
                    activity.unit ?? (activity.quantity === null ? undefined : 'Unit needed')
                  }
                />
              </Td>
              <Td>
                <ActivityStatusPill activity={activity} />
              </Td>
              <Td align="right">
                <span
                  className={`inline-flex items-center gap-1 text-[13px] ${
                    activity.evidenceCount > 0 ? 'text-ink' : 'text-ink-muted'
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
              </Td>
            </tr>
          )
        })}
      </tbody>
    </Table>
  )
}
