import { ApiError } from '../../lib/api'
import type { ActivityCategory, GhgScope, StreamKind } from './api'

/** One emission source the facility already has under a name like the one typed (spec 04.10), from the 409's `candidates`. */
export interface SimilarSource {
  id: string
  name: string
  kind: StreamKind
  defaultScope: GhgScope
  defaultCategory: ActivityCategory
}

/**
 * The sources a refused name is close to, when the refusal was the reconcile
 * 409 of spec 04.10 (`ghg.stream.name-similar`, or `ghg.stream.name-duplicate`
 * for the exact name); undefined for any other failure. The client detects the
 * case by the `candidates` property, never by the status alone.
 */
export function similarSources(error: unknown): SimilarSource[] | undefined {
  if (error instanceof ApiError && typeof error.problem === 'object' && error.problem !== null) {
    const candidates = (error.problem as { candidates?: unknown }).candidates
    if (Array.isArray(candidates)) return candidates as SimilarSource[]
  }
  return undefined
}

/** True when one candidate carries the typed name itself (case aside): the name is taken, so there is no "anyway". */
export function exactSourceMatch(candidates: SimilarSource[], typed: string): boolean {
  const wanted = typed.trim().toLowerCase()
  return candidates.some((candidate) => candidate.name.trim().toLowerCase() === wanted)
}
