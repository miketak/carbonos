import { describe, expect, it } from 'vitest'
import type { ApiContext } from '../contract.ts'
import { declareScope3, freezeInventory } from '../verbs/inventories.ts'
import { freezeBlocked, gateFinding } from './inventories.ts'

const noCtx = {} as ApiContext

describe('the inventory vocabulary', () => {
  it('reads the freeze refusal from the records the server lists', async () => {
    const refused = {
      status: 409,
      ok: false,
      rule: 'ghg.inventory.freeze-blocked',
      body: { errors: { records: [{ problem: 'is not classified' }, { problem: 'is not classified' }, { problem: 'is a draft with data outstanding' }] } },
    }
    expect((await freezeBlocked.api(noCtx, { notClassified: 2 }, refused)).ok).toBe(true)
    expect((await freezeBlocked.api(noCtx, { notClassified: 3 }, refused)).ok).toBe(false)
    expect((await freezeBlocked.api(noCtx, { notClassified: 2 }, { status: 200, ok: true })).ok).toBe(false)
    expect(freezeBlocked.ui({ notClassified: 8 })[0]).toMatchObject({ check: 'textVisible', text: '8 records are not classified; classify or exclude them first' })
  })

  it('opens the freeze dialog and clicks its button only when the gates allow', () => {
    const plan = freezeInventory.ui({ organization: 'Adansi Foods Ltd', inventory: 'FY2025' })
    expect(plan.at(-1)).toMatchObject({ op: 'click', button: 'Freeze inventory', within: 'Freeze the inventory?', ifEnabled: true })
  })

  it('declares the categories by their report labels and saves', () => {
    const plan = declareScope3.ui({ organization: 'Adansi Foods Ltd', inventory: 'FY2025', categories: ['INVESTMENTS'], notQuantified: [{ category: 'INVESTMENTS', reason: 'Minority holding' }] })
    expect(plan).toContainEqual({ op: 'tick', label: '15. Investments', on: true })
    expect(plan).toContainEqual({ op: 'tick', label: '6. Business travel', on: false })
    expect(plan).toContainEqual({ op: 'fill', label: '15. Investments: why not quantified this year', value: 'Minority holding' })
    expect(plan.at(-1)).toMatchObject({ op: 'click', button: 'Save declaration' })
  })

  it('narrates a gate finding with the gate as the panel names it', () => {
    const ctx = { pack: {} as never, actorName: (k: string) => k, actorAlias: (k: string) => k }
    const args = { organization: 'Adansi Foods Ltd', inventory: 'FY2025', gate: 'BOUNDARY' as const, severity: 'ERROR' as const, containing: 'is neither in the boundary' }
    expect(gateFinding.narrate(args, ctx)).toBe('An error on the **Reporting boundary** gate: "is neither in the boundary".')
    expect(gateFinding.narrate({ ...args, absent: true }, ctx)).toContain('no longer says')
  })
})
