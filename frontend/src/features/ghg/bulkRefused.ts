import { ApiError } from '../../lib/api'
import type { BulkRefusedRecord } from './api'

/**
 * The records a bulk act was refused for (spec 04.11), from the 409's
 * `refused`; undefined for any other failure. Nothing was applied, so the
 * analyst deselects them and tries again.
 */
export function bulkRefused(error: unknown): BulkRefusedRecord[] | undefined {
  if (error instanceof ApiError && typeof error.problem === 'object' && error.problem !== null) {
    const refused = (error.problem as { refused?: unknown }).refused
    if (Array.isArray(refused)) return refused as BulkRefusedRecord[]
  }
  return undefined
}
