import { api } from '../../lib/api'

export type FeedbackReason = 'NOT_ACCURATE' | 'NOT_CLEAR' | 'NOT_RELEVANT'

export interface FeedbackInput {
  pageSlug: string
  helpful: boolean
  reason?: FeedbackReason
  comment?: string
}

/** "Was this helpful?" on an article (spec 09). */
export function postFeedback(input: FeedbackInput): Promise<void> {
  return api<void>('/api/help/feedback', { method: 'POST', body: JSON.stringify(input) })
}

/** Every executed search, so the miss rate has a denominator; the query travels only on a miss. */
export function postSearchEvent(input: { hit: boolean; query?: string }): Promise<void> {
  return api<void>('/api/help/searches', { method: 'POST', body: JSON.stringify(input) })
}
