import { describe, expect, it } from 'vitest'
import { outcomes, procedureSchema, verbs } from './index.ts'
import { rule, ruleIds } from './rules/index.ts'

describe('the vocabulary', () => {
  it('registers every verb and outcome with both projections', () => {
    for (const verb of verbs.values()) {
      expect(typeof verb.api).toBe('function')
      expect(typeof verb.ui).toBe('function')
      expect(typeof verb.postconditions).toBe('function')
    }
    for (const outcome of outcomes.values()) {
      expect(typeof outcome.api).toBe('function')
      expect(typeof outcome.ui).toBe('function')
      expect(typeof outcome.narrate).toBe('function')
    }
  })

  it('refuses an unknown verb and a misspelt argument', () => {
    const base = { procedure: 9, slug: 'x', title: 'X', covers: [], docs: { version: 1, estimatedMinutes: 5, objective: 'o' } }
    const unknown = procedureSchema.safeParse({
      ...base,
      sections: [{ id: 'A', title: 'A', cases: [{ id: 'A1', title: 'a', steps: [{ as: 'x', do: { teleport: {} } }] }] }],
    })
    expect(unknown.success).toBe(false)
    expect(JSON.stringify(unknown.error?.issues)).toContain("unknown verb 'teleport'")
    const misspelt = procedureSchema.safeParse({
      ...base,
      sections: [{ id: 'A', title: 'A', cases: [{ id: 'A1', title: 'a', steps: [{ as: 'x', do: { signIn: { usr: 'x' } } }] }] }],
    })
    expect(misspelt.success).toBe(false)
  })

  it('names every rule the postconditions and refusals rely on', () => {
    expect(ruleIds()).toContain('user.password.weak')
    expect(rule('platform.reason-too-short').field).toBe('reason')
    expect(rule('ui.password-confirmation-mismatch').module).toBe('frontend')
  })
})
