import { expect, test } from 'vitest'
import {
  categoryLabel,
  describeFreeze,
  describeWindow,
  formatCo2e,
  formatDateTime,
  formatMonth,
  formatRecordPeriod,
  monthBounds,
} from './format'

test('formats small amounts in kg and large amounts in tonnes', () => {
  expect(formatCo2e(0)).toBe('0 kg CO₂e')
  expect(formatCo2e(352.8)).toBe('352.8 kg CO₂e')
  expect(formatCo2e(3012.8)).toBe('3.01 t CO₂e')
  expect(formatCo2e(1500000)).toBe('1,500 t CO₂e')
})

test('turns category constants into sentence case', () => {
  expect(categoryLabel('PURCHASED_ELECTRICITY')).toBe('Purchased electricity')
  expect(categoryLabel('MOBILE_COMBUSTION')).toBe('Mobile combustion')
})

test('a month has bounds, a name, and a record period reads as the month when it is one (spec 04.6)', () => {
  expect(monthBounds('2026-02')).toEqual({ from: '2026-02-01', to: '2026-02-28' })
  expect(monthBounds('2024-02')).toEqual({ from: '2024-02-01', to: '2024-02-29' })
  expect(formatMonth('2026-08')).toBe('Aug 2026')
  expect(formatRecordPeriod('2026-08-01', '2026-08-31', 'DMY')).toBe('Aug 2026')
  expect(formatRecordPeriod('2026-08-01', '2026-08-15', 'DMY')).toBe('01/08/2026 → 15/08/2026')
  expect(formatRecordPeriod('2026-08-01', '2026-08-15', 'MDY')).toBe('08/01/2026 → 08/15/2026')
  expect(formatRecordPeriod(null, null, 'DMY')).toBe('No period')
})

/** Spec 01.10: every date the register prints follows the reader's day/month order. */
test('instants, freezes and membership windows take the reader form', () => {
  const at = new Date(2026, 8, 2, 10, 14).toISOString()
  expect(formatDateTime(at, 'DMY')).toBe('02/09/2026 10:14')
  expect(describeFreeze({ frozenAt: at, frozenBy: 'ama@ecoriv.test' } as never, 'MDY')).toBe(
    'frozen 09/02/2026 10:14 by ama@ecoriv.test',
  )
  expect(describeWindow('2025-07-01', null, 'DMY')).toBe('member from 01/07/2025')
  expect(describeWindow(null, '2025-07-01', 'MDY')).toBe('member until 07/01/2025')
  expect(describeWindow('2025-01-01', '2025-07-01', 'DMY')).toBe(
    'member from 01/01/2025 until 01/07/2025',
  )
  expect(describeWindow(null, null, 'DMY')).toBeNull()
})
