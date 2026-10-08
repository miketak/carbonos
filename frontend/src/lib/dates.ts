import { useSession } from '../features/auth/useSession'

/**
 * The date form a reader uses (spec 01.10): day first, as in Ghana, or month
 * first, as in the United States. Every date the app prints goes through
 * here, so one preference moves them all; the lint rule keeps bare
 * `toLocaleDateString` calls out of the features.
 */
export type DateFormat = 'DMY' | 'MDY'

const locales: Record<DateFormat, string> = { DMY: 'en-GB', MDY: 'en-US' }

/** What the browser would do: month first only when its own locale puts the month first. */
export function browserDateFormat(): DateFormat {
  try {
    const parts = new Intl.DateTimeFormat(undefined, {
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(new Date(2000, 11, 25))
    const first = parts.find((part) => part.type === 'month' || part.type === 'day')
    return first?.type === 'month' ? 'MDY' : 'DMY'
  } catch {
    return 'DMY'
  }
}

/** The signed-in account's choice, else the browser's form. */
export function useDateFormat(): DateFormat {
  const session = useSession()
  return session.data?.dateFormat ?? browserDateFormat()
}

/**
 * A date-only value ("2026-04-03") is that calendar day wherever it is read;
 * an instant ("2026-04-03T23:30:00Z") is the day it falls on in the viewer's zone.
 */
function calendarDay(iso: string): Date {
  if (iso.includes('T')) return new Date(iso)
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function dayFormatter(format: DateFormat): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locales[format], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** A calendar date ("2026-04-03") as "03/04/2026" or "04/03/2026". */
export function formatDate(iso: string, format: DateFormat): string {
  return dayFormatter(format).format(calendarDay(iso))
}

/** An instant as "03/04/2026 08:11" in the viewer's zone, 24-hour clock. */
export function formatDateTime(iso: string, format: DateFormat): string {
  const at = new Date(iso)
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(at)
  return `${dayFormatter(format).format(at)} ${time}`
}

/** "03/04/2026" for a one-day span, else "01/01/2026 → 31/12/2026". */
export function formatDateRange(start: string, end: string, format: DateFormat): string {
  return start === end
    ? formatDate(start, format)
    : `${formatDate(start, format)} → ${formatDate(end, format)}`
}

/** The two choices as the profile page lists them, each with today's date as its example. */
export function dateFormatOptions(today = new Date()): { value: DateFormat; label: string }[] {
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return [
    { value: 'DMY', label: `Day/Month/Year (${formatDate(iso, 'DMY')})` },
    { value: 'MDY', label: `Month/Day/Year (${formatDate(iso, 'MDY')})` },
  ]
}
