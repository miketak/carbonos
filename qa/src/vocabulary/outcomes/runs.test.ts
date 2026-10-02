import { describe, expect, it } from 'vitest'
import { csvRows, runLabel } from '../runs.ts'
import { voidRun } from '../verbs/runs.ts'
import { roleDisabled } from './runs.ts'
import type { ApiContext } from '../contract.ts'

describe('the run vocabulary', () => {
  it('numbers runs as the product labels them', () => {
    expect(runLabel(1)).toBe('Run 001')
    expect(runLabel(12)).toBe('Run 012')
  })

  it('reads a CSV export with quoted cells', () => {
    const rows = csvRows('record_ref,estimate_state,note\nACT-0009,NOT_ESTIMATED,"a, quoted ""note"""\nACT-0007,,\n')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({ record_ref: 'ACT-0009', estimate_state: 'NOT_ESTIMATED', note: 'a, quoted "note"' })
    expect(rows[1]!.estimate_state).toBe('')
  })

  it('voids a run through its row and the named dialog', () => {
    const plan = voidRun.ui({ organization: 'Adansi Foods Ltd', inventory: 'FY2025', run: 1, reason: 'Scratch run for the void case' })
    expect(plan).toContainEqual({ op: 'row', text: 'Run 001', button: 'Void…' })
    expect(plan.at(-1)).toMatchObject({ op: 'click', button: 'Void run', within: 'Void Run 001?', ifEnabled: true })
  })

  it('reads a role refusal as the disabled control it is on screen', async () => {
    const out = await roleDisabled.api({} as ApiContext, { button: 'Publish', tooltip: 'Needs the Reviewer or Owner role.' }, { status: 403, ok: false, rule: 'ghg.role.required' })
    expect(out.ok).toBe(true)
    expect(roleDisabled.ui({ button: 'Publish', tooltip: 'Needs the Reviewer or Owner role.' })[0]).toMatchObject({ check: 'buttonDisabled', button: 'Publish' })
  })
})
