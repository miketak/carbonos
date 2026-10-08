import { describe, expect, test } from 'vitest'
import { dateFormatOptions, formatDate, formatDateRange, formatDateTime } from './dates'

/** Spec 01.10: the same day reads differently in Accra and in Austin, and the app says which it means. */
describe('formatDate', () => {
  test('puts the day first for DMY and the month first for MDY', () => {
    expect(formatDate('2026-04-03', 'DMY')).toBe('03/04/2026')
    expect(formatDate('2026-04-03', 'MDY')).toBe('04/03/2026')
  })

  test('reads a calendar date as that day, whatever the zone', () => {
    expect(formatDate('2026-01-01', 'DMY')).toBe('01/01/2026')
    expect(formatDate('2026-12-31', 'MDY')).toBe('12/31/2026')
  })

  test('reads an instant as the day it falls on in the viewer zone', () => {
    const lateEvening = new Date(2026, 11, 31, 23, 30).toISOString()
    expect(formatDate(lateEvening, 'MDY')).toBe('12/31/2026')
  })
})

describe('formatDateTime', () => {
  test('appends a 24-hour time in the viewer zone', () => {
    const at = new Date(2026, 3, 3, 8, 11).toISOString()
    expect(formatDateTime(at, 'DMY')).toBe('03/04/2026 08:11')
    expect(formatDateTime(at, 'MDY')).toBe('04/03/2026 08:11')
  })

  test('never writes 24:00 for midnight', () => {
    const at = new Date(2026, 3, 3, 0, 5).toISOString()
    expect(formatDateTime(at, 'DMY')).toBe('03/04/2026 00:05')
  })
})

describe('formatDateRange', () => {
  test('collapses a one-day span and arrows a longer one', () => {
    expect(formatDateRange('2026-04-03', '2026-04-03', 'DMY')).toBe('03/04/2026')
    expect(formatDateRange('2026-01-01', '2026-12-31', 'MDY')).toBe('01/01/2026 → 12/31/2026')
  })
})

test('the options carry today as their example', () => {
  expect(dateFormatOptions(new Date(2026, 11, 31))).toEqual([
    { value: 'DMY', label: 'Day/Month/Year (31/12/2026)' },
    { value: 'MDY', label: 'Month/Day/Year (12/31/2026)' },
  ])
})
