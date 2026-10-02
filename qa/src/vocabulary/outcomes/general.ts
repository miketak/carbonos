import { z } from 'zod'
import { defineOutcome, fail, notApplicable, pass } from '../contract.ts'
import { rule, ruleMessage } from '../rules/index.ts'

/** The two outcomes every procedure uses: a refusal by rule, and a sentence a human judges. */

export const refused = defineOutcome({
  name: 'refused',
  args: z.object({ rule: z.string(), with: z.record(z.string(), z.string()).optional() }).strict(),
  api: async (_ctx, { rule: id }, last) => {
    const entry = rule(id)
    if (!last) return fail('no action to be refused')
    if (last.na) return notApplicable(last.na)
    if (entry.module === 'frontend') return notApplicable('a refusal the page makes on its own')
    if (last.ok) return fail(`accepted with ${last.status}, expected the refusal ${id}`)
    if (last.status !== entry.status) return fail(`refused with ${last.status} (${String((last.body as { detail?: string })?.detail)}), expected ${entry.status} ${id}`)
    if (last.rule !== id) return fail(`refused by ${last.rule ?? 'an unnamed rule'} (${String((last.body as { detail?: string })?.detail)}), expected ${id}`)
    return pass(id)
  },
  ui: ({ rule: id, with: values }) => {
    const entry = rule(id)
    const text = ruleMessage(id, resolveWith(values))
    if (entry.status === 403 || entry.status === 404 || entry.status === 410) return [{ check: 'textVisible', text }]
    return [{ check: entry.field ? 'fieldError' : 'toast', label: entry.field ?? '', text }]
  },
  narrate: ({ rule: id, with: values }) => {
    const entry = rule(id)
    const text = ruleMessage(id, resolveWith(values))
    return entry.field ? `Refused inline: "${text}".` : `Refused: "${text}".`
  },
})

/** `with: { email: '{email:kofi}' }` keeps the token; the narrator and the executor resolve it. */
function resolveWith(values: Record<string, string> | undefined): Record<string, string> {
  return values ?? {}
}

export const observe = defineOutcome({
  name: 'observe',
  args: z.object({ text: z.string() }).strict(),
  api: async (_ctx, { text }) => ({ ok: true, manual: text }),
  ui: ({ text }) => [{ check: 'manual', text }],
  narrate: ({ text }) => text,
})

export const generalOutcomes = [refused, observe]
