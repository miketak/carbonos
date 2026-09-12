import { expect, test } from 'vitest'
import { categoryLabel, formatCo2e, formatMonth, formatRecordPeriod, monthBounds } from './format'

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
  expect(formatRecordPeriod('2026-08-01', '2026-08-31')).toBe('Aug 2026')
  expect(formatRecordPeriod('2026-08-01', '2026-08-15')).toBe(
    formatRecordPeriod('2026-08-01', '2026-08-15'),
  )
  expect(formatRecordPeriod(null, null)).toBe('No period')
})
