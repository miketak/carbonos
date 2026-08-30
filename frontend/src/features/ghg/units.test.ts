import { expect, test } from 'vitest'
import type { Unit } from './api'
import { convertQuantity, findUnit, groupUnits, unitDimension } from './units'

const units: Unit[] = [
  { code: 'kWh', label: 'Kilowatt-hour', dimension: 'ENERGY', toCanonical: 1 },
  { code: 'MWh', label: 'Megawatt-hour', dimension: 'ENERGY', toCanonical: 1000 },
  { code: 'litre', label: 'Litre', dimension: 'VOLUME', toCanonical: 0.001 },
  { code: 'US-gallon', label: 'US gallon', dimension: 'VOLUME', toCanonical: 0.003785411784 },
  { code: 'kg', label: 'Kilogram', dimension: 'MASS', toCanonical: 1 },
]

test('findUnit matches by code, case-insensitively', () => {
  expect(findUnit(units, 'litre')?.code).toBe('litre')
  expect(findUnit(units, 'US-GALLON')?.code).toBe('US-gallon')
  expect(findUnit(units, 'widgets')).toBeUndefined()
})

test('unitDimension resolves the dimension, null for custom units', () => {
  expect(unitDimension(units, 'kWh')).toBe('ENERGY')
  expect(unitDimension(units, 'widgets')).toBeNull()
})

test('convertQuantity mirrors the backend for same-dimension units', () => {
  // 10,000 US-gallon -> litre = 10,000 x 3.785411784
  expect(convertQuantity(units, 10000, 'US-gallon', 'litre')).toBeCloseTo(37854.11784, 5)
  // 2 MWh -> kWh = 2000
  expect(convertQuantity(units, 2, 'MWh', 'kWh')).toBe(2000)
  // identity
  expect(convertQuantity(units, 5, 'litre', 'litre')).toBe(5)
})

test('convertQuantity refuses cross-dimension and custom units', () => {
  expect(convertQuantity(units, 1, 'litre', 'kg')).toBeNull()
  expect(convertQuantity(units, 1, 'widgets', 'litre')).toBeNull()
})

test('groupUnits groups by dimension in display order, dropping empty groups', () => {
  const groups = groupUnits(units)
  expect(groups.map((group) => group.dimension)).toEqual(['ENERGY', 'VOLUME', 'MASS'])
  expect(groups[0].units.map((unit) => unit.code)).toEqual(['kWh', 'MWh'])
})
