import { describe, expect, it } from 'vitest'
import type { ApiContext } from '../contract.ts'
import { factorRef } from '../organizations.ts'
import { classifyRecord, excludeSelected } from '../verbs/classification.ts'
import { dialogButtonDisabled, recordView } from './classification.ts'

const noCtx = {} as ApiContext
const ctx = { pack: {} as never, actorName: (k: string) => k, actorAlias: (k: string) => k }

describe('the classification vocabulary', () => {
  it('reads a factor reference with or without its unit', () => {
    expect(factorRef('Gaseous fuels: LPG (/litre)')).toEqual({ name: 'Gaseous fuels: LPG', unit: 'litre' })
    expect(factorRef('R-410A (composition)')).toEqual({ name: 'R-410A (composition)', unit: undefined })
  })

  it('classifies through the drawer: picker, density, scope and the justifications', () => {
    const plan = classifyRecord.ui({
      organization: 'Adansi Foods Ltd',
      inventory: 'FY2025',
      record: 'ACT-0004',
      factor: 'Liquid fuels: Diesel (100% mineral diesel) (/litre)',
      density: 'Diesel (typical value)',
    })
    expect(plan).toContainEqual({ op: 'fill', label: 'Search factors for {activityType:Adansi Foods Ltd|ACT-0004}', value: 'Liquid fuels: Diesel (100% mineral diesel)' })
    expect(plan).toContainEqual({ op: 'pickOption', group: 'Classify {activityType:Adansi Foods Ltd|ACT-0004}', text: 'Liquid fuels: Diesel (100% mineral diesel) (/litre)' })
    expect(plan.at(-1)).toMatchObject({ op: 'choose', label: '{activityType:Adansi Foods Ltd|ACT-0004} density', byValue: true })
  })

  it('excludes several records under one reason and confirms the dialog', () => {
    const plan = excludeSelected.ui({ organization: 'Adansi Foods Ltd', inventory: 'FY2025', records: ['ACT-0007', 'ACT-0008'], reason: 'NOT_APPLICABLE', justification: 'Scratch: bulk exclusion' })
    expect(plan).toContainEqual({ op: 'click', button: 'Exclude 2 selected' })
    expect(plan.at(-1)).toMatchObject({ op: 'confirm', dialog: 'Exclude 2 records?', button: 'Exclude 2' })
  })

  it('narrates an excluded record as the chip prints it', () => {
    const text = recordView.narrate({ organization: 'o', inventory: 'i', record: 'ACT-0007', status: 'EXCLUDED', reason: 'OUTSIDE_BOUNDARY', detailContaining: 'member from 2025-07-01' }, ctx)
    expect(text).toBe('ACT-0007 reads "Excluded · Outside boundary" with "member from 2025-07-01".')
  })

  it('reads a disabled dialog button as the rule the API cites', async () => {
    const refused = { status: 422, ok: false, rule: 'ghg.inventory.reopen-reason', body: {} }
    expect((await dialogButtonDisabled.api(noCtx, { dialog: 'Reopen as a draft?', button: 'Reopen as draft', rule: 'ghg.inventory.reopen-reason' }, refused)).ok).toBe(true)
    expect((await dialogButtonDisabled.api(noCtx, { dialog: 'Reopen as a draft?', button: 'Reopen as draft', rule: 'ghg.inventory.reopen-reason' }, { status: 200, ok: true })).ok).toBe(false)
    expect(dialogButtonDisabled.expectsRefusal).toBe(true)
  })
})
