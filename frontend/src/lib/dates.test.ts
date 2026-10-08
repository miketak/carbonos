import { describe, expect, test } from 'vitest'
import { formatDate, formatDateRange, formatDateTime } from './dates'

/** ECO-134: every date reads ISO, which no reader misorders. */
describe('formatDate', () => {
  test('reads a calendar date as that day, whatever the zone', () => {
    expect(formatDate('2026-04-03')).toBe('2026-04-03')
    expect(formatDate('2026-01-01')).toBe('2026-01-01')
    expect(formatDate('2026-12-31')).toBe('2026-12-31')
  })

  test('reads an instant as the day it falls on in the viewer zone', () => {
    const lateEvening = new Date(2026, 11, 31, 23, 30).toISOString()
    expect(formatDate(lateEvening)).toBe('2026-12-31')
  })
})

describe('formatDateTime', () => {
  test('appends a 24-hour time in the viewer zone', () => {
    const at = new Date(2026, 3, 3, 8, 11).toISOString()
    expect(formatDateTime(at)).toBe('2026-04-03 08:11')
  })

  test('never writes 24:00 for midnight', () => {
    const at = new Date(2026, 3, 3, 0, 5).toISOString()
    expect(formatDateTime(at)).toBe('2026-04-03 00:05')
  })
})

describe('formatDateRange', () => {
  test('collapses a one-day span and arrows a longer one', () => {
    expect(formatDateRange('2026-04-03', '2026-04-03')).toBe('2026-04-03')
    expect(formatDateRange('2026-01-01', '2026-12-31')).toBe('2026-01-01 → 2026-12-31')
  })
})
