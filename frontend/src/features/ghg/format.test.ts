import { expect, test } from 'vitest'
import { categoryLabel, formatCo2e } from './format'

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
