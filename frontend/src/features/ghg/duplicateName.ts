import { ApiError } from '../../lib/api'

/** One organization that already carries a requested name (spec 01.8), from the 409's `duplicates`. */
export interface DuplicateOrganization {
  id: string
  name: string
  accountNo: number
}

/**
 * The organizations a refused name belongs to, when the refusal was the
 * warn-then-allow 409 of spec 01.8; undefined for any other failure. The
 * client detects the case by this property, never by the status alone.
 */
export function duplicateOrganizations(error: unknown): DuplicateOrganization[] | undefined {
  if (error instanceof ApiError && typeof error.problem === 'object' && error.problem !== null) {
    const duplicates = (error.problem as { duplicates?: unknown }).duplicates
    if (Array.isArray(duplicates)) return duplicates as DuplicateOrganization[]
  }
  return undefined
}
