import { expect, test } from 'vitest'
import { accountLabel, organizationLabel } from './organizationLabel'

test('pads the account number to four digits and grows beyond them (spec 01.8)', () => {
  expect(accountLabel(1)).toBe('ORG-0001')
  expect(accountLabel(42)).toBe('ORG-0042')
  expect(accountLabel(9999)).toBe('ORG-9999')
  expect(accountLabel(10000)).toBe('ORG-10000')
})

test('names an organization with its number', () => {
  expect(organizationLabel({ name: 'Adansi Foods Ltd', accountNo: 12 })).toBe(
    'Adansi Foods Ltd (ORG-0012)',
  )
})
