import { z } from 'zod'
import { defineOutcome, fail, notApplicable, pass } from '../contract.ts'
import { boundaryEntity, categoryLabels, exclusionLabels, gateLabels, inventories, inventory, statusLabels, validation } from '../inventories.ts'
import { orgArg, organization } from '../organizations.ts'
import { S } from '../ui/surface.ts'

/** Statements about an inventory, its boundary view, its declaration and its gates (specs 03.2, 05, 05.5, 07.2, 07.6). */

const invArgs = { organization: orgArg, inventory: z.string() }

export const inventoryListed = defineOutcome({
  name: 'inventoryListed',
  args: z.object({ organization: orgArg, name: z.string(), status: z.enum(['DRAFT', 'FROZEN', 'FINAL', 'PUBLISHED']).optional() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const row = (await inventories(ctx.session(), org.id)).find((i) => i.name === a.name)
    if (!row) return fail(`no inventory named '${a.name}'`)
    if (a.status && row.status !== a.status) return fail(`'${a.name}' is ${row.status}, expected ${a.status}`)
    return pass(`${row.name} ${row.status}`)
  },
  ui: (a) => [{ check: 'textVisible', text: a.name }, ...(a.status ? [{ check: 'textVisible', text: statusLabels[a.status]! } as const] : [])],
  narrate: (a) => `The list shows "${a.name}"${a.status ? ` as ${statusLabels[a.status]!.toUpperCase()}` : ''} with **${S.inv.button.open}**.`,
})

export const inventoryStatus = defineOutcome({
  name: 'inventoryStatus',
  args: z.object({ ...invArgs, status: z.enum(['DRAFT', 'FROZEN', 'FINAL', 'PUBLISHED']) }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    return inv.status === a.status ? pass(inv.status) : fail(`'${a.inventory}' is ${inv.status}, expected ${a.status}`)
  },
  ui: (a) => [{ check: 'textVisible', text: statusLabels[a.status]! }],
  narrate: (a) => `The header reads ${statusLabels[a.status]!.toUpperCase()}.`,
})

/** The workbench's five tabs: a fact of the screen, not of the API. */
export const workbenchTabs = defineOutcome({
  name: 'workbenchTabs',
  readsScreenFirst: true,
  args: z.object({ tabs: z.array(z.string()) }).strict(),
  api: async (_ctx, a) => notApplicable(`the tabs ${a.tabs.join(', ')} are a fact of the screen`),
  ui: (a) => [{ check: 'tabsVisible', names: a.tabs }],
  narrate: (a) => `The workbench opens on **${a.tabs[0]}** with ${a.tabs.length} tabs: ${a.tabs.map((t) => `**${t}**`).join(', ')}.`,
})

/** A hint the form prints before saving, nothing stored. */
export const formHint = defineOutcome({
  name: 'formHint',
  readsScreenFirst: true,
  args: z.object({ text: z.string() }).strict(),
  api: async (_ctx, a) => notApplicable(`the form says "${a.text}"; nothing is saved`),
  ui: (a) => [{ check: 'textVisible', text: a.text }],
  narrate: (a) => `The form says "${a.text}".`,
})

export const formOffers = defineOutcome({
  name: 'formOffers',
  readsScreenFirst: true,
  args: z.object({ dialog: z.string(), fields: z.array(z.string()) }).strict(),
  api: async (_ctx, a) => notApplicable(`the form "${a.dialog}" offers ${a.fields.length} fields; nothing is saved`),
  ui: (a) => a.fields.map((label) => ({ check: 'fieldVisible', label, within: a.dialog }) as const),
  narrate: (a) => `The form offers ${a.fields.map((f) => `**${f}**`).join(', ')}.`,
})

export const boundaryRow = defineOutcome({
  name: 'boundaryRow',
  args: z
    .object({
      ...invArgs,
      entity: z.string(),
      inBoundary: z.boolean().optional(),
      facilities: z.record(z.string(), z.boolean()).optional(),
      memberFrom: z.string().optional(),
      memberUntil: z.string().optional(),
      share: z.number().optional(),
      shareUnderApproach: z.number().optional(),
      exclusion: z.enum(['NON_GHG', 'DUPLICATE', 'NOT_APPLICABLE', 'METHODOLOGY', 'OTHER', 'none']).optional(),
      cannotTick: z.boolean().optional(),
      readOnly: z.boolean().optional(),
      asksWhy: z.boolean().optional(),
    })
    .strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    const row = await boundaryEntity(ctx.session(), inv.id, a.entity)
    if (a.inBoundary !== undefined && row.inBoundary !== a.inBoundary) return fail(`${a.entity} is ${row.inBoundary ? 'in' : 'out of'} the boundary`)
    for (const [name, on] of Object.entries(a.facilities ?? {})) {
      const site = row.facilities.find((f) => f.facilityName === name)
      if (!site) return fail(`${a.entity} has no facility '${name}'`)
      if (site.inBoundary !== on) return fail(`${name} is ${site.inBoundary ? 'in' : 'out of'} the boundary`)
    }
    if (a.memberFrom !== undefined && row.effectiveFrom !== a.memberFrom) return fail(`${a.entity} member from ${row.effectiveFrom}, expected ${a.memberFrom}`)
    if (a.memberUntil !== undefined && row.effectiveTo !== a.memberUntil) return fail(`${a.entity} member until ${row.effectiveTo}, expected ${a.memberUntil}`)
    if (a.share !== undefined && Number(row.economicInterestPercent) !== a.share) return fail(`${a.entity} economic interest ${row.economicInterestPercent}, expected ${a.share}`)
    if (a.shareUnderApproach !== undefined && Number(row.shareUnderApproach) * 100 !== a.shareUnderApproach) return fail(`${a.entity} share under the approach ${row.shareUnderApproach}, expected ${a.shareUnderApproach}%`)
    if (a.exclusion === 'none' && row.exclusion) return fail(`${a.entity} is excluded as ${row.exclusion.reason}`)
    if (a.exclusion && a.exclusion !== 'none' && row.exclusion?.reason !== a.exclusion) return fail(`${a.entity} excluded as ${row.exclusion?.reason ?? 'nothing'}, expected ${a.exclusion}`)
    if (a.cannotTick && !(row.shareUnderApproach === 0 && !row.inBoundary)) return fail(`${a.entity} could be ticked in (share ${row.shareUnderApproach})`)
    if (a.asksWhy && (row.inBoundary || row.exclusion)) return fail(`${a.entity} is ${row.inBoundary ? 'in the boundary' : 'already excluded'}`)
    if (a.readOnly && inv.status === 'DRAFT') return fail('the inventory is a draft: its boundary is editable')
    return pass()
  },
  ui: (a) => [
    { check: 'atInventory', organization: a.organization, inventory: a.inventory, tab: 'Boundary' },
    ...(a.inBoundary !== undefined ? [{ check: 'ticked', label: `${a.entity} in boundary`, on: a.inBoundary, disabled: a.cannotTick || a.readOnly } as const] : []),
    ...(a.inBoundary === undefined && a.cannotTick ? [{ check: 'ticked', label: `${a.entity} in boundary`, on: false, disabled: true } as const] : []),
    ...Object.entries(a.facilities ?? {}).map(([name, on]) => ({ check: 'ticked', label: `${name} in boundary`, on }) as const),
    ...(a.memberFrom !== undefined ? [{ check: 'fieldValue', label: `${a.entity} member from`, value: a.memberFrom } as const] : []),
    ...(a.memberUntil !== undefined ? [{ check: 'fieldValue', label: `${a.entity} member until`, value: a.memberUntil } as const] : []),
    ...(a.share !== undefined ? [{ check: 'fieldValue', label: `${a.entity} economic interest percent`, value: String(a.share) } as const] : []),
    ...(a.shareUnderApproach === 0 ? [{ check: 'textVisible', text: S.inv.text.outsideUnder } as const] : []),
    ...(a.exclusion && a.exclusion !== 'none' ? [{ check: 'fieldValue', label: `${a.entity} left out because`, value: exclusionLabels[a.exclusion]! } as const] : []),
    // the reason control is on the row only while the entity is out of the boundary; back in, the API cross-check reads the absence
    ...(a.asksWhy || (a.exclusion === 'none' && a.inBoundary === false) ? [{ check: 'fieldValue', label: `${a.entity} left out because`, value: S.inv.option.whyLeftOut } as const] : []),
  ],
  narrate: (a) => {
    const parts: string[] = []
    if (a.inBoundary !== undefined) parts.push(`${a.entity} is ${a.inBoundary ? 'in' : 'out of'} the boundary`)
    for (const [name, on] of Object.entries(a.facilities ?? {})) parts.push(`${name} is ${on ? 'in' : 'out'}`)
    if (a.shareUnderApproach === 0) parts.push(`it reads "${S.inv.text.outsideUnder} operational control" at 0% from its Table 1 row`)
    if (a.cannotTick) parts.push('its checkbox is disabled')
    if (a.readOnly) parts.push('its checkbox is disabled, the boundary is frozen')
    if (a.asksWhy) parts.push(`its row asks "${S.inv.option.whyLeftOut}"`)
    if (a.memberFrom !== undefined) parts.push(`**Member from** reads ${a.memberFrom}`)
    if (a.memberUntil !== undefined) parts.push(`**Member until** reads ${a.memberUntil}`)
    if (a.share !== undefined) parts.push(`the economic interest reads ${a.share}`)
    if (a.exclusion === 'none') parts.push('no reason is recorded')
    else if (a.exclusion) parts.push(`the row reads left out: **${exclusionLabels[a.exclusion]}**`)
    return parts.join('; ').replace(/^./, (c) => c.toUpperCase()) + '.'
  },
})

export const facilityInBoundary = defineOutcome({
  name: 'facilityInBoundary',
  args: z.object({ ...invArgs, facility: z.string(), on: z.boolean() }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    const out = await ctx.session().get(`/api/ghg/inventories/${inv.id}/boundary`)
    if (!out.ok) return fail(`the boundary answered ${out.status}`)
    const site = (out.body as Array<{ facilities: Array<{ facilityName: string; inBoundary: boolean }> }>).flatMap((e) => e.facilities).find((f) => f.facilityName === a.facility)
    if (!site) return fail(`no facility '${a.facility}' in the boundary view`)
    return site.inBoundary === a.on ? pass() : fail(`${a.facility} is ${site.inBoundary ? 'in' : 'out of'} the boundary`)
  },
  ui: (a) => [{ check: 'atInventory', organization: a.organization, inventory: a.inventory, tab: 'Boundary' }, { check: 'ticked', label: `${a.facility} in boundary`, on: a.on }],
  narrate: (a) => `${a.facility} ${a.on ? 'is in' : 'leaves'} the boundary.`,
})

const gateArg = z.enum(['BOUNDARY', 'COMPLETENESS', 'CLASSIFICATION', 'EMISSION_FACTOR', 'BASE_YEAR'])

/** A finding of a pre-flight gate (or its absence), read from the validation report and on the panel. */
export const gateFinding = defineOutcome({
  name: 'gateFinding',
  args: z.object({ ...invArgs, gate: gateArg, severity: z.enum(['ERROR', 'WARNING', 'INFO']).optional(), containing: z.string(), absent: z.boolean().optional() }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    const report = await validation(ctx.session(), inv.id)
    const gate = report.gates.find((g) => g.gate === a.gate)
    if (!gate) return fail(`no ${a.gate} gate in the report`)
    const hits = gate.findings.filter((f) => f.message.includes(a.containing) && (!a.severity || f.severity === a.severity))
    if (a.absent) return hits.length === 0 ? pass() : fail(`the ${gateLabels[a.gate]} gate still says "${hits[0]!.message}"`)
    if (hits.length === 0) {
      const seen = gate.findings.map((f) => `${f.severity}: ${f.message}`).join(' | ') || 'no findings'
      return fail(`the ${gateLabels[a.gate]} gate has no ${a.severity ?? 'finding'} containing "${a.containing}"; it says: ${seen}`)
    }
    return pass(hits[0]!.message)
  },
  ui: (a) => [{ check: 'gateFinding', organization: a.organization, inventory: a.inventory, gate: gateLabels[a.gate]!, severity: a.severity, containing: a.containing, absent: a.absent }],
  narrate: (a) => {
    const kind = a.severity === 'ERROR' ? 'An error' : a.severity === 'WARNING' ? 'A warning' : 'A finding'
    if (a.absent) return `The **${gateLabels[a.gate]}** gate no longer says "${a.containing}".`
    return `${kind} on the **${gateLabels[a.gate]}** gate: "${a.containing}".`
  },
})

export const declarationHas = defineOutcome({
  name: 'declarationHas',
  args: z.object({ ...invArgs, category: z.string(), covered: z.boolean(), reason: z.string().optional() }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    const covered = inv.scope3Categories.includes(a.category)
    if (covered !== a.covered) return fail(`${categoryLabels[a.category]} is ${covered ? 'declared' : 'not declared'}`)
    const entry = inv.scope3NotQuantified.find((n) => n.category === a.category)
    if (a.reason !== undefined && entry?.reason !== a.reason) return fail(`${categoryLabels[a.category]} not quantified because "${entry?.reason ?? ''}", expected "${a.reason}"`)
    if (a.reason === undefined && a.covered && entry) return fail(`${categoryLabels[a.category]} is marked as not quantified ("${entry.reason}")`)
    return pass()
  },
  ui: (a) => [
    { check: 'atInventory', organization: a.organization, inventory: a.inventory, tab: 'Boundary' },
    { check: 'ticked', label: categoryLabels[a.category]!, on: a.covered },
    ...(a.reason !== undefined ? [{ check: 'fieldValue', label: `${categoryLabels[a.category]}: why not quantified this year`, value: a.reason } as const] : []),
  ],
  narrate: (a) =>
    a.covered
      ? `**${categoryLabels[a.category]}** is declared as covered${a.reason !== undefined ? `, not quantified this year: "${a.reason}"` : ''}.`
      : `**${categoryLabels[a.category]}** stays unticked.`,
})

/** The freeze refused by the gates: the API's 409 with the records, the dialog's summary and its disabled button. */
export const freezeBlocked = defineOutcome({
  name: 'freezeBlocked',
  expectsRefusal: true,
  args: z.object({ notClassified: z.number().int() }).strict(),
  api: async (_ctx, a, last) => {
    if (!last) return fail('no freeze to be refused')
    if (last.ok) return fail(`the freeze went through (${last.status})`)
    if (last.rule !== 'ghg.inventory.freeze-blocked') return fail(`refused by ${last.rule ?? 'an unnamed rule'}, expected ghg.inventory.freeze-blocked`)
    const records = ((last.body as { errors?: { records?: Array<{ problem: string }> } }).errors?.records ?? [])
    const unclassified = records.filter((r) => r.problem === 'is not classified').length
    if (unclassified !== a.notClassified) return fail(`${unclassified} records are not classified (${records.length} block the freeze), expected ${a.notClassified}`)
    return pass(`${records.length} records block the freeze`)
  },
  ui: (a) => {
    const n = a.notClassified
    const text = `${n} record${n === 1 ? ' is' : 's are'} not classified; classify or exclude ${n === 1 ? 'it' : 'them'} first`
    return [
      { check: 'textVisible', text, within: `[role="dialog"]` },
      { check: 'buttonDisabled', button: S.inv.button.freezeInventory, within: S.inv.dialog.freeze },
    ]
  },
  narrate: (a) =>
    `The dialog "${S.inv.dialog.freeze}" shows the gate summary first and refuses with "${a.notClassified} records are not classified; classify or exclude them first". Its **${S.inv.button.freezeInventory}** button is disabled.`,
})

export const inventoryOutcomes = [inventoryListed, inventoryStatus, workbenchTabs, formHint, formOffers, boundaryRow, facilityInBoundary, gateFinding, declarationHas, freezeBlocked]
