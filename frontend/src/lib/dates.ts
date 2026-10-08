/**
 * Every date the app prints goes through here, so one place decides the form.
 * The form is ISO (ECO-134): "2026-04-03" for a calendar day and "2026-04-03 08:11"
 * for an instant, in the viewer's zone. No reader misorders it, and a downloaded
 * file reads the same as the screen. Date pickers stay native: the browser already
 * shows them in the reader's own form and sends ISO.
 */

/**
 * A date-only value ("2026-04-03") is that calendar day wherever it is read;
 * an instant ("2026-04-03T23:30:00Z") is the day it falls on in the viewer's zone.
 */
function calendarDay(iso: string): Date {
  if (iso.includes('T')) return new Date(iso)
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const pad = (n: number) => String(n).padStart(2, '0')

function isoDay(at: Date): string {
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`
}

/** A calendar date ("2026-04-03") or an instant as "2026-04-03". */
export function formatDate(iso: string): string {
  return isoDay(calendarDay(iso))
}

/** An instant as "2026-04-03 08:11" in the viewer's zone, 24-hour clock. */
export function formatDateTime(iso: string): string {
  const at = new Date(iso)
  return `${isoDay(at)} ${pad(at.getHours())}:${pad(at.getMinutes())}`
}

/** "2026-04-03" for a one-day span, else "2026-01-01 → 2026-12-31". */
export function formatDateRange(start: string, end: string): string {
  return start === end ? formatDate(start) : `${formatDate(start)} → ${formatDate(end)}`
}
