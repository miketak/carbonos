import { expect, test } from 'vitest'
import { checkNumber, collectErrors } from './validate'

test('a percentage outside 0 to 100 gets a range message', () => {
  expect(checkNumber('150', { label: 'Economic interest', min: 0, max: 100 })).toBe(
    'Economic interest must be between 0 and 100.',
  )
  expect(checkNumber('-1', { label: 'Economic interest', min: 0, max: 100 })).toBe(
    'Economic interest must be between 0 and 100.',
  )
  expect(checkNumber('100', { label: 'Economic interest', min: 0, max: 100 })).toBeUndefined()
})

test('negatives and zero are named separately', () => {
  expect(checkNumber('-0.1', { label: 'Factor', min: 0 })).toBe('Factor must be 0 or more.')
  expect(checkNumber('0', { label: 'Quantity', positive: true })).toBe(
    'Quantity must be greater than 0.',
  )
  expect(checkNumber('abc', { label: 'Quantity' })).toBe('Quantity must be a number.')
})

test('empty values are errors only when required', () => {
  expect(checkNumber('', { label: 'Vintage', min: 1990 })).toBeUndefined()
  expect(checkNumber('  ', { label: 'Quantity', required: true })).toBe('Enter quantity.')
})

test('collectErrors drops the fields that pass', () => {
  expect(collectErrors({ a: undefined, b: 'Bad' })).toEqual({ b: 'Bad' })
  expect(collectErrors({ a: undefined })).toBeUndefined()
})
