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

/** How an import file writes its dates (spec 04.11, ECO-138); the API's names. */
export type ImportDateFormat =
  | 'DAY_FIRST'
  | 'DAY_FIRST_DASH'
  | 'MONTH_FIRST'
  | 'MONTH_FIRST_DASH'
  | 'ISO'
  | 'ISO_SLASH'

/** The Date format options in dropdown order: each order with slashes, then with dashes. */
export const IMPORT_DATE_FORMATS: ReadonlyArray<{ value: ImportDateFormat; label: string }> = [
  { value: 'DAY_FIRST', label: 'Day / Month / Year (31/03/2025)' },
  { value: 'DAY_FIRST_DASH', label: 'Day - Month - Year (31-03-2025)' },
  { value: 'MONTH_FIRST', label: 'Month / Day / Year (03/31/2025)' },
  { value: 'MONTH_FIRST_DASH', label: 'Month - Day - Year (03-31-2025)' },
  { value: 'ISO_SLASH', label: 'Year / Month / Day (2025/03/31)' },
  { value: 'ISO', label: 'Year - Month - Day (2025-03-31)' },
]

/**
 * The import's default date format from the browser's language: month-first for
 * United States English, day-first everywhere else (Ghana, the UK, the rest of the
 * world), slashes in both cases. The preparer can change it on the import page;
 * 2025-03-31 is read under every setting.
 */
export function browserImportDateFormat(
  language: string = typeof navigator === 'undefined' ? '' : navigator.language,
): ImportDateFormat {
  const region = language.split(/[-_]/)[1]?.toUpperCase()
  return region === 'US' ? 'MONTH_FIRST' : 'DAY_FIRST'
}
