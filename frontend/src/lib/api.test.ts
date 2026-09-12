import { describe, expect, test } from 'vitest'
import { ApiError, refusalMessage } from './api'

/** Spec 01.4: one sentence per refusal, so every page prints the same wording. */
describe('refusalMessage', () => {
  test('a 403 shows the role the server asked for', () => {
    const error = new ApiError(403, {
      detail: 'This action needs the PREPARER, REVIEWER or OWNER role in the organization.',
    })
    expect(refusalMessage(error, 'PREPARER')).toBe(
      'This action needs the PREPARER, REVIEWER or OWNER role in the organization.',
    )
  })

  test('a verifier is told their role is read-only before the server sentence', () => {
    const error = new ApiError(403, {
      detail: 'This action needs the PREPARER, REVIEWER or OWNER role in the organization.',
    })
    expect(refusalMessage(error, 'VERIFIER')).toBe(
      'Your role is read-only in this organization. This action needs the PREPARER, REVIEWER or OWNER role in the organization.',
    )
  })

  test('a 404 from a write is shown, never swallowed', () => {
    expect(refusalMessage(new ApiError(404), 'OWNER')).toBe(
      'The item was not found. It may have been removed by someone else.',
    )
    expect(
      refusalMessage(new ApiError(404, { detail: 'Activity record not found.' }), 'OWNER'),
    ).toBe(
      'The item was not found. It may have been removed by someone else. Activity record not found.',
    )
  })

  test('a 409 renders the rule the server names, as it stands', () => {
    const error = new ApiError(409, { detail: "'Asante Gold' needs at least one owner." })
    expect(refusalMessage(error, 'OWNER')).toBe("'Asante Gold' needs at least one owner.")
  })

  test('a 5xx and a network failure read the same', () => {
    expect(refusalMessage(new ApiError(500), 'OWNER')).toBe(
      'CarbonOS could not reach the server. Try again.',
    )
    expect(refusalMessage(new TypeError('Failed to fetch'), 'OWNER')).toBe(
      'CarbonOS could not reach the server. Try again.',
    )
  })
})
