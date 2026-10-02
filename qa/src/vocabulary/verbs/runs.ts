import { z } from 'zod'
import { defineVerb } from '../contract.ts'
import { inventory } from '../inventories.ts'
import { facility, factor, orgArg, organization } from '../organizations.ts'
import { run, runLabel, runs } from '../runs.ts'
import { S } from '../ui/surface.ts'

/** Runs, the final designation, publication, the correction and the report header (specs 05.1, 05.2, 05.3, 07.4). */

const invArgs = { organization: orgArg, inventory: z.string() }
const runArg = z.union([z.string(), z.number().int()])

export const launchRun = defineVerb({
  name: 'launchRun',
  args: z.object({ ...invArgs, label: z.string().optional() }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    const existing = await runs(ctx.session(), inv.id)
    const label = a.label ?? runLabel(existing.length + 1)
    return ctx.session().post(`/api/ghg/inventories/${inv.id}/runs`, { label })
  },
  ui: (a) => [
    { op: 'inventoryPage', organization: a.organization, inventory: a.inventory, tab: 'Runs' },
    ...(a.label ? [{ op: 'fill', label: S.run.field.runLabel, value: a.label } as const] : []),
    { op: 'click', button: S.run.button.launch },
    { op: 'settle' },
  ],
  postconditions: () => [],
  narrate: () => `On **Runs**, click **${S.run.button.launch}**.`,
})

export const openRun = defineVerb({
  name: 'openRun',
  args: z.object({ ...invArgs, run: runArg }).strict(),
  api: async (ctx, a) => {
    const { run: r } = await run(ctx, a.organization, a.inventory, a.run)
    return ctx.session().get(`/api/ghg/runs/${r.id}`)
  },
  ui: (a) => [
    { op: 'inventoryPage', organization: a.organization, inventory: a.inventory, tab: 'Runs' },
    { op: 'click', button: typeof a.run === 'number' ? runLabel(a.run) : a.run },
  ],
  postconditions: () => [],
  narrate: (a) => `Open ${typeof a.run === 'number' ? runLabel(a.run) : a.run}.`,
})

export const voidRun = defineVerb({
  name: 'voidRun',
  args: z.object({ ...invArgs, run: runArg, reason: z.string() }).strict(),
  api: async (ctx, a) => {
    const { run: r } = await run(ctx, a.organization, a.inventory, a.run)
    return ctx.session().post(`/api/ghg/runs/${r.id}/void`, { reason: a.reason })
  },
  ui: (a) => {
    const label = typeof a.run === 'number' ? runLabel(a.run) : a.run
    return [
      { op: 'inventoryPage', organization: a.organization, inventory: a.inventory, tab: 'Runs' },
      { op: 'row', text: label, button: S.run.button.voidEllipsis },
      { op: 'fill', label: S.cls.field.reason, value: a.reason, within: `Void ${label}?` },
      { op: 'click', button: S.run.button.voidRun, within: `Void ${label}?`, ifEnabled: true },
    ]
  },
  postconditions: (a) => [{ outcome: 'runListed', args: { organization: a.organization, inventory: a.inventory, run: a.run, voided: true, voidReason: a.reason } }],
  narrate: (a) => `Click **${S.run.button.voidEllipsis}** on ${typeof a.run === 'number' ? runLabel(a.run) : a.run}, give "${a.reason}" and confirm.`,
})

export const markFinal = defineVerb({
  name: 'markFinal',
  args: z.object({ ...invArgs, run: runArg, note: z.string().optional() }).strict(),
  api: async (ctx, a) => {
    const { run: r } = await run(ctx, a.organization, a.inventory, a.run)
    return ctx.session().post(`/api/ghg/runs/${r.id}/finalize`, { note: a.note ?? null })
  },
  ui: (a) => {
    const label = typeof a.run === 'number' ? runLabel(a.run) : a.run
    return [
      { op: 'inventoryPage', organization: a.organization, inventory: a.inventory, tab: 'Runs' },
      { op: 'row', text: label, button: S.run.button.markFinal, ifEnabled: true },
      ...(a.note ? [{ op: 'fill', label: S.run.field.reviewNote, value: a.note, within: `Mark ${label} as final?` } as const] : []),
      { op: 'click', button: S.run.button.markFinal, within: `Mark ${label} as final?`, ifEnabled: true },
    ]
  },
  postconditions: () => [],
  narrate: (a) => `Click **${S.run.button.markFinal}** on ${typeof a.run === 'number' ? runLabel(a.run) : a.run}${a.note ? `, type the review note "${a.note}"` : ''} and confirm.`,
})

export const withdrawFinal = defineVerb({
  name: 'withdrawFinal',
  args: z.object({ ...invArgs, reason: z.string() }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    return ctx.session().post(`/api/ghg/inventories/${inv.id}/withdraw-final`, { reason: a.reason })
  },
  ui: (a) => [
    { op: 'inventoryPage', organization: a.organization, inventory: a.inventory },
    { op: 'click', button: S.run.button.withdrawFinal },
    ...(a.reason ? [{ op: 'fill', label: S.cls.field.reason, value: a.reason, within: S.run.dialog.withdraw } as const] : []),
    { op: 'click', button: S.run.button.withdrawConfirm, within: S.run.dialog.withdraw, ifEnabled: true },
  ],
  postconditions: () => [],
  narrate: (a) => `Click **${S.run.button.withdrawFinal}**${a.reason ? `, give "${a.reason}"` : ' with no reason'} and confirm.`,
})

export const publishInventory = defineVerb({
  name: 'publishInventory',
  args: z.object({ ...invArgs }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    return ctx.session().post(`/api/ghg/inventories/${inv.id}/publish`)
  },
  ui: (a) => [
    { op: 'inventoryPage', organization: a.organization, inventory: a.inventory },
    { op: 'click', button: S.run.button.publish, ifEnabled: true },
    { op: 'click', button: S.run.button.publish, within: S.run.dialog.publish, ifEnabled: true },
  ],
  postconditions: () => [],
  narrate: () => `Click **${S.run.button.publish}** and confirm.`,
})

export const createCorrection = defineVerb({
  name: 'createCorrection',
  args: z.object({ ...invArgs, reason: z.string(), name: z.string().optional() }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    return ctx.session().post(`/api/ghg/inventories/${inv.id}/supersede`, { name: a.name ?? null, reason: a.reason })
  },
  ui: (a) => [
    { op: 'inventoryPage', organization: a.organization, inventory: a.inventory },
    { op: 'click', button: S.run.button.createCorrection },
    ...(a.name ? [{ op: 'fill', label: S.inv.field.name, value: a.name, within: S.run.dialog.correction } as const] : []),
    { op: 'fill', label: S.run.field.correctionReason, value: a.reason, within: S.run.dialog.correction },
    { op: 'click', button: S.run.button.createCorrection, within: S.run.dialog.correction, ifEnabled: true },
  ],
  postconditions: () => [],
  narrate: (a) => `Click **${S.run.button.createCorrection}** and type the reason "${a.reason}".`,
})

export const saveReportHeader = defineVerb({
  name: 'saveReportHeader',
  args: z
    .object({
      ...invArgs,
      approvedBy: z.string().optional(),
      uncertaintyStatement: z.string().optional(),
      denominators: z.array(z.object({ name: z.string(), value: z.number(), unit: z.string() }).strict()).optional(),
    })
    .strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    return ctx.session().put(`/api/ghg/inventories/${inv.id}/report-metadata`, {
      approvedBy: a.approvedBy ?? null,
      assuranceLevel: 'UNVERIFIED',
      assuranceProvider: null,
      assuranceStatement: null,
      uncertaintyStatement: a.uncertaintyStatement ?? null,
      intensityMetrics: (a.denominators ?? []).map((d) => ({ name: d.name, value: d.value, unit: d.unit })),
    })
  },
  ui: (a) => [
    { op: 'inventoryPage', organization: a.organization, inventory: a.inventory, tab: 'Report' },
    ...(a.approvedBy ? [{ op: 'fill', label: S.run.field.approvedBy, value: a.approvedBy } as const] : []),
    ...(a.uncertaintyStatement ? [{ op: 'fill', label: S.run.field.uncertainty, value: a.uncertaintyStatement } as const] : []),
    ...(a.denominators ?? []).flatMap((d) => [
      { op: 'fill', label: S.run.field.denominator, value: d.name } as const,
      { op: 'fill', label: S.run.field.value, value: String(d.value) } as const,
      { op: 'fill', label: S.org.field.unit, value: d.unit } as const,
      { op: 'click', button: S.run.button.addDenominator } as const,
    ]),
    { op: 'click', button: S.run.button.saveHeader },
  ],
  postconditions: (a) => [{ outcome: 'reportHeaderSaved', args: { organization: a.organization, inventory: a.inventory, approvedBy: a.approvedBy, denominators: a.denominators } }],
  narrate: (a) => {
    const parts: string[] = []
    if (a.approvedBy) parts.push(`fill in **${S.run.field.approvedBy}** "${a.approvedBy}"`)
    if (a.uncertaintyStatement) parts.push(`the uncertainty statement "${a.uncertaintyStatement}"`)
    for (const d of a.denominators ?? []) parts.push(`type the denominator "${d.name}", value ${d.value}, unit \`${d.unit}\`, then click **${S.run.button.addDenominator}**`)
    return `On **Report**, ${parts.join(', ')}. Click **${S.run.button.saveHeader}**.`
  },
})

export const setGwpSet = defineVerb({
  name: 'setGwpSet',
  args: z.object({ ...invArgs, gwpSet: z.enum(['AR5', 'AR6']) }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    const full = inv as unknown as { purpose?: string | null; baseYear?: number | null }
    return ctx.session().put(`/api/ghg/inventories/${inv.id}`, {
      name: inv.name,
      periodStart: inv.periodStart,
      periodEnd: inv.periodEnd,
      purpose: full.purpose ?? null,
      baseYear: full.baseYear ?? null,
      consolidationApproach: inv.consolidationApproach,
      gwpSet: a.gwpSet,
      straddleTreatment: inv.straddleTreatment,
    })
  },
  ui: (a) => [
    { op: 'inventoryPage', organization: a.organization, inventory: a.inventory },
    { op: 'click', button: S.inv.button.editInventory },
    { op: 'choose', label: S.inv.field.gwpSet, option: S.inv.option.gwpSet[a.gwpSet]!, within: S.inv.dialog.editInventory },
    { op: 'click', button: S.inv.button.saveChanges, within: S.inv.dialog.editInventory },
  ],
  postconditions: (a) => [{ outcome: 'inventoryGwpSet', args: { organization: a.organization, inventory: a.inventory, gwpSet: a.gwpSet } }],
  narrate: (a) => `Click **${S.inv.button.editInventory}**, set the GWP set to ${a.gwpSet}, and save.`,
})

export const unapproveFactor = defineVerb({
  name: 'unapproveFactor',
  args: z.object({ organization: orgArg, factor: z.string() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const row = await factor(ctx.session(), org.id, a.factor)
    return ctx.session().post(`/api/ghg/emission-factors/${row.id}/unapprove`)
  },
  ui: (a) => [
    { op: 'orgPage', organization: a.organization, section: S.org.sections.factors },
    { op: 'fill', label: S.org.field.searchFactors, value: a.factor },
    { op: 'row', text: a.factor, button: S.run.button.unapprove },
  ],
  postconditions: (a) => [{ outcome: 'factorListed', args: { organization: a.organization, name: a.factor, approved: false } }],
  narrate: (a) => `Open **${S.org.sections.factors}** and click **${S.run.button.unapprove}** on "${a.factor}".`,
})

/** A record entered whole: the figures, the period and the source in one go (spec 04.4). */
export const recordActivity = defineVerb({
  name: 'recordActivity',
  args: z
    .object({
      organization: orgArg,
      facility: z.string(),
      activityType: z.string(),
      quantity: z.number(),
      unit: z.string(),
      periodStart: z.string(),
      periodEnd: z.string(),
      dataSource: z.string().optional(),
    })
    .strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const site = await facility(ctx.session(), org.id, a.facility)
    return ctx.session().post(`/api/ghg/organizations/${org.id}/activities`, {
      draft: false,
      facilityId: site.id,
      activityType: a.activityType,
      quantity: a.quantity,
      unit: a.unit,
      periodStart: a.periodStart,
      periodEnd: a.periodEnd,
      dataSource: a.dataSource ?? null,
      dataQuality: 'MEASURED',
    })
  },
  ui: (a) => [
    { op: 'orgPage', organization: a.organization, section: S.org.sections.activity },
    { op: 'click', button: S.act.button.addActivity },
    { op: 'fill', label: S.act.field.activityType, value: a.activityType },
    { op: 'choose', label: S.act.field.facility, option: `{facilityId:${a.organization}|${a.facility}}`, byValue: true },
    { op: 'fill', label: S.act.field.quantity, value: String(a.quantity) },
    { op: 'choose', label: S.org.field.unit, option: a.unit, byValue: true },
    { op: 'fill', label: S.act.field.periodStart, value: a.periodStart },
    { op: 'fill', label: S.act.field.periodEnd, value: a.periodEnd },
    ...(a.dataSource ? [{ op: 'fill', label: S.run.field.dataSource, value: a.dataSource } as const] : []),
    { op: 'click', button: S.act.button.save },
  ],
  postconditions: (a) => [{ outcome: 'activityExists', args: { organization: a.organization, record: a.activityType, draft: false, quantity: a.quantity, unit: a.unit } }],
  narrate: (a) =>
    `Add the record "${a.activityType}" at ${a.facility}: ${a.quantity} ${a.unit}, ${a.periodStart} to ${a.periodEnd}${a.dataSource ? `, source "${a.dataSource}"` : ''}.`,
})

/** The disclosure at the top of a copied inventory, opened to read where it came from (spec 05.4). */
export const showInheritance = defineVerb({
  name: 'showInheritance',
  args: z.object({ ...invArgs }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    return ctx.session().get(`/api/ghg/inventories/${inv.id}/inheritance`)
  },
  ui: (a) => [
    { op: 'inventoryPage', organization: a.organization, inventory: a.inventory },
    { op: 'clickText', text: S.run.text.cameFrom },
  ],
  postconditions: () => [],
  narrate: () => `Open **${S.run.text.cameFrom}** at the top of the workbench.`,
})

export const runVerbs = [showInheritance, launchRun, openRun, voidRun, markFinal, withdrawFinal, publishInventory, createCorrection, saveReportHeader, setGwpSet, unapproveFactor, recordActivity]
