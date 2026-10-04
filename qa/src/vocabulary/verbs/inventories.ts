import { z } from 'zod'
import { defineVerb, type ApiOutcome } from '../contract.ts'
import { categoryLabels, exclusionLabels, inventory } from '../inventories.ts'
import { entity, facility, orgArg, organization } from '../organizations.ts'
import { S } from '../ui/surface.ts'

/** Inventories, their boundary, the declaration and the freeze (specs 03.2, 03.4, 05, 05.5, 07.2, 07.6). */

const approachArg = z.enum(['EQUITY_SHARE', 'FINANCIAL_CONTROL', 'OPERATIONAL_CONTROL'])
const gwpArg = z.enum(['AR5', 'AR6'])
const straddleArg = z.enum(['PRO_RATE', 'BLOCK'])
const exclusionArg = z.enum(['NON_GHG', 'DUPLICATE', 'NOT_APPLICABLE', 'METHODOLOGY', 'OTHER'])
const scope3 = Object.keys(categoryLabels).filter((c) => /^\d/.test(categoryLabels[c]!))
const categoryArg = z.string().refine((c) => scope3.includes(c), { message: 'a scope 3 category' })

/** The form alone, nothing saved: the drivers report the step as not applicable through the API. */
const formOnly = (why: string): ApiOutcome => ({ status: 0, ok: true, na: why })

export const createInventory = defineVerb({
  name: 'createInventory',
  args: z
    .object({
      organization: orgArg,
      name: z.string(),
      periodStart: z.string(),
      periodEnd: z.string(),
      approach: approachArg,
      gwpSet: gwpArg.default('AR5'),
      straddle: straddleArg.default('PRO_RATE'),
      prefillBoundary: z.boolean().default(true),
      copyFrom: z.string().optional(),
    })
    .strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const source = a.copyFrom ? (await inventory(ctx, a.organization, a.copyFrom)).inv : undefined
    return ctx.session().post(`/api/ghg/organizations/${org.id}/inventories`, {
      name: a.name,
      periodStart: a.periodStart,
      periodEnd: a.periodEnd,
      consolidationApproach: a.approach,
      gwpSet: a.gwpSet,
      straddleTreatment: a.straddle,
      prefillBoundary: source ? false : a.prefillBoundary,
      copyFromInventoryId: source?.id ?? null,
    })
  },
  ui: (a) => {
    const d = S.inv.dialog.newInventory
    return [
      { op: 'orgPage', organization: a.organization, section: S.org.sections.inventories },
      { op: 'click', button: S.inv.button.newInventory },
      { op: 'fill', label: S.inv.field.name, value: a.name, within: d },
      { op: 'fill', label: S.inv.field.periodStart, value: a.periodStart, within: d },
      { op: 'fill', label: S.inv.field.periodEnd, value: a.periodEnd, within: d },
      { op: 'choose', label: S.inv.field.straddle, option: S.inv.option.straddle[a.straddle]!, within: d },
      { op: 'choose', label: S.inv.field.approach, option: S.inv.option.approach[a.approach]!, within: d },
      { op: 'choose', label: S.inv.field.gwpSet, option: S.inv.option.gwpSet[a.gwpSet]!, within: d },
      ...(a.copyFrom ? [{ op: 'choose', label: S.inv.field.copyFrom, option: `${a.copyFrom} (`, within: d, prefix: true } as const] : [{ op: 'tick', label: S.inv.field.prefillBoundary, within: d, on: a.prefillBoundary } as const]),
      { op: 'click', button: S.inv.button.createInventory, within: d },
    ]
  },
  // the save lands on the new inventory's workbench (spec 08, form surfaces), so the header, not the list, is what the tester reads
  postconditions: (a) => [{ outcome: 'inventoryStatus', args: { organization: a.organization, inventory: a.name, status: 'DRAFT' } }],
  narrate: (a) =>
    `Open **${S.org.sections.inventories}** and click **${S.inv.button.newInventory}**. Name "${a.name}", period ${a.periodStart} to ${a.periodEnd}, consolidation approach ${S.inv.option.approach[a.approach]!.toLowerCase()}, GWP set ${a.gwpSet}, straddling records **${S.inv.option.straddle[a.straddle]}**, and ${a.copyFrom ? `**${S.inv.field.copyFrom}** ${a.copyFrom}` : `**${S.inv.field.prefillBoundary}** ${a.prefillBoundary ? 'ticked' : 'unticked'}`}. Click **${S.inv.button.createInventory}**. The inventory opens on its workbench.`,
})

/** The form read before saving (the period hint); nothing is created. */
export const startNewInventory = defineVerb({
  name: 'startNewInventory',
  args: z.object({ organization: orgArg, periodStart: z.string(), periodEnd: z.string() }).strict(),
  api: async () => formOnly('a hint of the form, read on screen'),
  ui: (a) => {
    const d = S.inv.dialog.newInventory
    return [
      { op: 'orgPage', organization: a.organization, section: S.org.sections.inventories },
      { op: 'click', button: S.inv.button.newInventory },
      { op: 'fill', label: S.inv.field.periodStart, value: a.periodStart, within: d },
      { op: 'fill', label: S.inv.field.periodEnd, value: a.periodEnd, within: d },
    ]
  },
  postconditions: () => [],
  narrate: (a) => `Click **${S.inv.button.newInventory}**, set the period ${a.periodStart} to ${a.periodEnd}, and read the form before saving.`,
})

export const cancelDialog = defineVerb({
  name: 'cancelDialog',
  args: z.object({ dialog: z.string() }).strict(),
  api: async () => formOnly('a dialog closed without saving'),
  ui: ({ dialog }) => [{ op: 'click', button: S.inv.button.cancel, within: dialog }],
  postconditions: () => [],
  narrate: ({ dialog }) => `Click **${S.inv.button.cancel}** in "${dialog}".`,
})

export const openInventory = defineVerb({
  name: 'openInventory',
  args: z.object({ organization: orgArg, inventory: z.string(), tab: z.enum(['Records', 'Boundary', 'Method', 'Runs', 'Report']).optional() }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    return ctx.session().get(`/api/ghg/inventories/${inv.id}`)
  },
  ui: (a) => [{ op: 'inventoryPage', organization: a.organization, inventory: a.inventory, tab: a.tab }],
  postconditions: () => [],
  narrate: (a) => (a.tab ? `On the inventory "${a.inventory}", open **${a.tab}**.` : `Open the inventory "${a.inventory}" (**${S.inv.button.open}**).`),
})

export const setFacilityInBoundary = defineVerb({
  name: 'setFacilityInBoundary',
  args: z.object({ organization: orgArg, inventory: z.string(), facility: z.string(), on: z.boolean() }).strict(),
  api: async (ctx, a) => {
    const { org, inv } = await inventory(ctx, a.organization, a.inventory)
    const site = await facility(ctx.session(), org.id, a.facility)
    return a.on
      ? ctx.session().put(`/api/ghg/inventories/${inv.id}/boundary/${site.id}`, {})
      : ctx.session().delete(`/api/ghg/inventories/${inv.id}/boundary/${site.id}`)
  },
  ui: (a) => [
    { op: 'inventoryPage', organization: a.organization, inventory: a.inventory, tab: 'Boundary' },
    { op: 'tick', label: `${a.facility} in boundary`, on: a.on },
  ],
  postconditions: (a) => [{ outcome: 'facilityInBoundary', args: { organization: a.organization, inventory: a.inventory, facility: a.facility, on: a.on } }],
  narrate: (a) => `On **Boundary**, ${a.on ? 'tick' : 'untick'} **${a.facility} in boundary**.`,
})

export const excludeEntity = defineVerb({
  name: 'excludeEntity',
  args: z.object({ organization: orgArg, inventory: z.string(), entity: z.string(), reason: exclusionArg, detail: z.string().optional() }).strict(),
  api: async (ctx, a) => {
    const { org, inv } = await inventory(ctx, a.organization, a.inventory)
    const row = await entity(ctx.session(), org.id, a.entity)
    return ctx.session().put(`/api/ghg/inventories/${inv.id}/boundary/entities/${row.id}/exclude`, { reason: a.reason, detail: a.detail ?? null })
  },
  ui: (a) => [
    { op: 'inventoryPage', organization: a.organization, inventory: a.inventory, tab: 'Boundary' },
    { op: 'choose', label: `${a.entity} left out because`, option: exclusionLabels[a.reason]! },
    ...(a.detail ? [{ op: 'fill', label: `${a.entity} left out because detail`, value: a.detail, blur: true } as const] : []),
  ],
  postconditions: (a) => [{ outcome: 'boundaryRow', args: { organization: a.organization, inventory: a.inventory, entity: a.entity, exclusion: a.reason } }],
  narrate: (a) => `On ${a.entity}'s row, choose **${exclusionLabels[a.reason]}**${a.detail ? ` with the detail "${a.detail}"` : ''}.`,
})

export const setEntityShare = defineVerb({
  name: 'setEntityShare',
  args: z.object({ organization: orgArg, inventory: z.string(), entity: z.string(), economicInterest: z.number() }).strict(),
  api: async (ctx, a) => {
    const { org, inv } = await inventory(ctx, a.organization, a.inventory)
    const row = await entity(ctx.session(), org.id, a.entity)
    return ctx.session().put(`/api/ghg/inventories/${inv.id}/boundary/entities/${row.id}`, { economicInterestPercent: a.economicInterest })
  },
  ui: (a) => [
    { op: 'inventoryPage', organization: a.organization, inventory: a.inventory, tab: 'Boundary' },
    { op: 'fill', label: `${a.entity} economic interest percent`, value: String(a.economicInterest), blur: true },
  ],
  postconditions: (a) => [{ outcome: 'boundaryRow', args: { organization: a.organization, inventory: a.inventory, entity: a.entity, share: a.economicInterest } }],
  narrate: (a) => `On ${a.entity}'s row, change the economic interest to ${a.economicInterest}.`,
})

export const setMembershipWindow = defineVerb({
  name: 'setMembershipWindow',
  args: z.object({ organization: orgArg, inventory: z.string(), entity: z.string(), from: z.string().optional(), until: z.string().optional() }).strict(),
  api: async (ctx, a) => {
    const { org, inv } = await inventory(ctx, a.organization, a.inventory)
    const row = await entity(ctx.session(), org.id, a.entity)
    return ctx.session().put(`/api/ghg/inventories/${inv.id}/boundary/entities/${row.id}`, { effectiveFrom: a.from ?? null, effectiveTo: a.until ?? null })
  },
  ui: (a) => [
    { op: 'inventoryPage', organization: a.organization, inventory: a.inventory, tab: 'Boundary' },
    ...(a.from ? [{ op: 'fill', label: `${a.entity} member from`, value: a.from, blur: true } as const] : []),
    ...(a.until ? [{ op: 'fill', label: `${a.entity} member until`, value: a.until, blur: true } as const] : []),
  ],
  postconditions: (a) => [{ outcome: 'boundaryRow', args: { organization: a.organization, inventory: a.inventory, entity: a.entity, memberFrom: a.from, memberUntil: a.until } }],
  narrate: (a) =>
    [a.from ? `set **Member from** to ${a.from}` : '', a.until ? `set **Member until** to ${a.until}` : ''].filter(Boolean).join(' and ').replace(/^./, (c) => c.toUpperCase()) + ` on ${a.entity}'s row.`,
})

export const declareScope3 = defineVerb({
  name: 'declareScope3',
  args: z
    .object({
      organization: orgArg,
      inventory: z.string(),
      categories: z.array(categoryArg),
      notQuantified: z.array(z.object({ category: categoryArg, reason: z.string() }).strict()).optional(),
    })
    .strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    return ctx.session().put(`/api/ghg/inventories/${inv.id}/operational-boundary`, {
      scope3Categories: a.categories,
      exclusionsRationale: null,
      notQuantified: a.notQuantified ?? [],
    })
  },
  ui: (a) => [
    { op: 'inventoryPage', organization: a.organization, inventory: a.inventory, tab: 'Boundary' },
    ...scope3.map((c) => ({ op: 'tick', label: categoryLabels[c]!, on: a.categories.includes(c) }) as const),
    ...(a.notQuantified ?? []).map((n) => ({ op: 'fill', label: `${categoryLabels[n.category]}: why not quantified this year`, value: n.reason }) as const),
    { op: 'click', button: S.inv.button.saveDeclaration },
  ],
  postconditions: (a) =>
    a.categories.map((c) => ({
      outcome: 'declarationHas',
      args: { organization: a.organization, inventory: a.inventory, category: c, covered: true, reason: a.notQuantified?.find((n) => n.category === c)?.reason },
    })),
  narrate: (a) => {
    const ticked = a.categories.map((c) => `**${categoryLabels[c]}**`).join(', ')
    const reasons = (a.notQuantified ?? []).map((n) => `in the reason for not quantifying ${categoryLabels[n.category]} this year, type "${n.reason}"`).join('; ')
    return `In the operational boundary declaration, tick ${ticked || 'nothing'}${reasons ? `, ${reasons}` : ''}, and click **${S.inv.button.saveDeclaration}**.`
  },
})

export const reviewActivityData = defineVerb({
  name: 'reviewActivityData',
  args: z.object({ organization: orgArg, inventory: z.string() }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    return ctx.session().post(`/api/ghg/inventories/${inv.id}/assignments/sync`)
  },
  ui: (a) => [
    { op: 'inventoryPage', organization: a.organization, inventory: a.inventory, tab: 'Records' },
    { op: 'click', button: S.inv.button.reviewActivityData },
  ],
  postconditions: () => [],
  narrate: () => `Click **${S.inv.button.reviewActivityData}**.`,
})

/** The freeze: through the API the request itself; on screen the dialog, whose button stays disabled while the gates refuse. */
export const freezeInventory = defineVerb({
  name: 'freezeInventory',
  args: z.object({ organization: orgArg, inventory: z.string() }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    return ctx.session().post(`/api/ghg/inventories/${inv.id}/freeze`)
  },
  ui: (a) => [
    { op: 'inventoryPage', organization: a.organization, inventory: a.inventory },
    { op: 'click', button: S.inv.button.freezeInventory },
    { op: 'click', button: S.inv.button.freezeInventory, within: S.inv.dialog.freeze, ifEnabled: true },
  ],
  postconditions: () => [],
  narrate: () => `Click **${S.inv.button.freezeInventory}**.`,
})

export const openInventoryForm = defineVerb({
  name: 'openInventoryForm',
  args: z.object({ organization: orgArg, inventory: z.string() }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    return ctx.session().get(`/api/ghg/inventories/${inv.id}`)
  },
  ui: (a) => [
    { op: 'inventoryPage', organization: a.organization, inventory: a.inventory },
    { op: 'click', button: S.inv.button.editInventory },
  ],
  postconditions: () => [],
  narrate: () => `Click **${S.inv.button.editInventory}**.`,
})

export const inventoryVerbs = [
  createInventory,
  startNewInventory,
  cancelDialog,
  openInventory,
  setFacilityInBoundary,
  excludeEntity,
  setEntityShare,
  setMembershipWindow,
  declareScope3,
  reviewActivityData,
  freezeInventory,
  openInventoryForm,
]

