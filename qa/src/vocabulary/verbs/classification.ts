import { z } from 'zod'
import { defineVerb, type ApiContext, type ApiOutcome } from '../contract.ts'
import { assignment, density, instruments, inventory, recordExclusionLabels } from '../inventories.ts'
import { facility, factor, factorRef, orgArg, organization } from '../organizations.ts'
import { S } from '../ui/surface.ts'

/** Classification, exclusions, the method and the lifecycle of an inventory (specs 04.1 to 04.8, 05.5, 07.3, 07.6). */

const invArgs = { organization: orgArg, inventory: z.string() }
const scopeArg = z.enum(['SCOPE_1', 'SCOPE_2', 'SCOPE_3'])
const recordExclusionArg = z.enum(['NON_GHG', 'DUPLICATE', 'NOT_APPLICABLE', 'METHODOLOGY', 'OTHER', 'OUTSIDE_SCOPES_NON_KYOTO'])
const criterionArg = z.enum(['met', 'notMet', 'unanswered'])

const formOnly = (why: string): ApiOutcome => ({ status: 0, ok: true, na: why })
const typeOf = (org: string, record: string) => `{activityType:${org}|${record}}`

async function view(ctx: ApiContext, orgRef: string, inv: string, record: string) {
  const { org, inv: row } = await inventory(ctx, orgRef, inv)
  const a = await assignment(ctx.session(), row.id, record)
  return { org, inv: row, a }
}

/** The classification as the drawer sends it: the factor, the scope and category chosen (else the defaults), the extras. */
export const classifyRecord = defineVerb({
  name: 'classifyRecord',
  args: z
    .object({
      ...invArgs,
      record: z.string(),
      factor: z.string(),
      density: z.string().optional(),
      scope: scopeArg.optional(),
      category: z.string().optional(),
      scopeJustification: z.string().optional(),
      proxy: z.boolean().optional(),
      proxyJustification: z.string().optional(),
      showUnapproved: z.boolean().optional(),
    })
    .strict(),
  api: async (ctx, a) => {
    const { org, a: row } = await view(ctx, a.organization, a.inventory, a.record)
    const chosen = await factor(ctx.session(), org.id, a.factor)
    const dens = a.density ? await density(ctx.session(), org.id, a.density) : undefined
    return ctx.session().put(`/api/ghg/assignments/${row.id}/classify`, {
      emissionFactorId: chosen.id,
      scope: a.scope ?? null,
      category: a.category ?? null,
      scopeJustification: a.scopeJustification ?? null,
      proxy: a.proxy ?? false,
      proxyJustification: a.proxyJustification ?? null,
      densityId: dens?.id ?? null,
    })
  },
  ui: (a) => {
    const type = typeOf(a.organization, a.record)
    return [
      { op: 'inventoryPage', organization: a.organization, inventory: a.inventory, tab: 'Records' },
      { op: 'openRow', text: a.record },
      { op: 'clickAny', buttons: [S.cls.button.chooseFactor, S.cls.button.changeFactor] },
      ...(a.showUnapproved ? [{ op: 'tick', label: S.cls.field.showUnapproved, prefix: true } as const] : []),
      { op: 'fill', label: `Search factors for ${type}`, value: factorRef(a.factor).name },
      { op: 'pickOption', group: `Classify ${type}`, text: factorRef(a.factor).unit ? a.factor : `${a.factor} (/` },
      ...(a.density ? [{ op: 'choose', label: `${type} density`, option: `{densityId:${a.organization}|${a.density}}`, byValue: true } as const] : []),
      ...(a.scope ? [{ op: 'choose', label: `${type} scope`, option: a.scope, byValue: true } as const] : []),
      ...(a.category ? [{ op: 'choose', label: `${type} category`, option: a.category, byValue: true } as const] : []),
      ...(a.scopeJustification ? [{ op: 'fill', label: `${type} scope justification`, value: a.scopeJustification, blur: true } as const] : []),
      ...(a.proxy ? [{ op: 'tick', label: `${type} proxy factor` } as const] : []),
      ...(a.proxyJustification ? [{ op: 'fill', label: `${type} proxy justification`, value: a.proxyJustification, blur: true } as const] : []),
    ]
  },
  postconditions: (a) => [
    {
      outcome: 'recordView',
      args: {
        organization: a.organization,
        inventory: a.inventory,
        record: a.record,
        status: 'INCLUDED',
        factor: factorRef(a.factor).name,
        ...(a.scope ? { scope: a.scope } : {}),
        ...(a.category ? { category: a.category } : {}),
        ...(a.density ? { density: a.density } : {}),
      },
    },
  ],
  narrate: (a) => {
    const parts = [`Open ${a.record}${a.showUnapproved ? `, tick **${S.cls.field.showUnapproved}**` : ''} and choose **${a.factor}**`]
    if (a.density) parts.push(`choose the density "${a.density}"`)
    if (a.scope) parts.push(`set the scope to ${S.cls.option.scope[a.scope]}${a.category ? ` and the category to **${a.category}**` : ''}`)
    if (a.scopeJustification) parts.push(`give the scope justification "${a.scopeJustification}"`)
    if (a.proxy) parts.push(`tick **proxy factor**${a.proxyJustification ? ` and type "${a.proxyJustification}"` : ''}`)
    return parts.join(', ') + '.'
  },
})

/** A record's drawer, opened to read it. */
export const openRecord = defineVerb({
  name: 'openRecord',
  args: z.object({ ...invArgs, record: z.string() }).strict(),
  api: async (ctx, a) => {
    const { a: row } = await view(ctx, a.organization, a.inventory, a.record)
    return { status: 200, ok: true, body: row }
  },
  ui: (a) => [
    { op: 'inventoryPage', organization: a.organization, inventory: a.inventory, tab: 'Records' },
    { op: 'openRow', text: a.record },
  ],
  postconditions: () => [],
  narrate: (a) => `Open ${a.record}.`,
})

/** The factor the drawer suggests for the facility's grid, taken as offered. */
export const classifyWithSuggestion = defineVerb({
  name: 'classifyWithSuggestion',
  args: z.object({ ...invArgs, record: z.string() }).strict(),
  api: async (ctx, a) => {
    const { a: row } = await view(ctx, a.organization, a.inventory, a.record)
    if (!row.suggestedFactorId) return { status: 404, ok: false, body: { detail: `${a.record} has no suggested factor` } }
    return ctx.session().put(`/api/ghg/assignments/${row.id}/classify`, { emissionFactorId: row.suggestedFactorId, proxy: false })
  },
  ui: (a) => [
    { op: 'inventoryPage', organization: a.organization, inventory: a.inventory, tab: 'Records' },
    { op: 'openRow', text: a.record },
    { op: 'clickContaining', text: S.cls.text.suggested },
  ],
  postconditions: (a) => [{ outcome: 'recordView', args: { organization: a.organization, inventory: a.inventory, record: a.record, status: 'INCLUDED', scope: 'SCOPE_2' } }],
  narrate: (a) => `Open ${a.record} and click the suggestion "${S.cls.text.suggested}".`,
})

/** A factor picked without the density its unit needs: the drawer holds it and sends nothing (spec 02.2). */
export const pickFactorWithoutDensity = defineVerb({
  name: 'pickFactorWithoutDensity',
  args: z.object({ ...invArgs, record: z.string(), factor: z.string() }).strict(),
  api: async () => formOnly('the drawer keeps the factor in view and sends nothing until a density is chosen'),
  ui: (a) => {
    const type = typeOf(a.organization, a.record)
    return [
      { op: 'inventoryPage', organization: a.organization, inventory: a.inventory, tab: 'Records' },
      { op: 'openRow', text: a.record },
      { op: 'clickAny', buttons: [S.cls.button.chooseFactor, S.cls.button.changeFactor] },
      { op: 'fill', label: `Search factors for ${type}`, value: factorRef(a.factor).name },
      { op: 'pickOption', group: `Classify ${type}`, text: factorRef(a.factor).unit ? a.factor : `${a.factor} (/` },
    ]
  },
  postconditions: (a) => [{ outcome: 'recordView', args: { organization: a.organization, inventory: a.inventory, record: a.record, status: 'UNCLASSIFIED' } }],
  narrate: (a) => `Open ${a.record} and choose **${a.factor}**.`,
})

export const excludeRecord = defineVerb({
  name: 'excludeRecord',
  args: z
    .object({
      ...invArgs,
      record: z.string(),
      reason: recordExclusionArg,
      justification: z.string(),
      notEstimated: z.boolean().optional(),
      emitsNothing: z.boolean().optional(),
      estimatedKgCo2e: z.number().optional(),
      gas: z.string().optional(),
    })
    .strict(),
  api: async (ctx, a) => {
    const { a: row } = await view(ctx, a.organization, a.inventory, a.record)
    return ctx.session().put(`/api/ghg/assignments/${row.id}/exclude`, {
      reason: a.reason,
      justification: a.justification,
      estimatedKgCo2e: a.estimatedKgCo2e ?? (a.emitsNothing ? 0 : null),
      notEstimated: a.notEstimated ?? null,
      emitsNothing: a.emitsNothing ?? null,
      gas: a.gas ?? null,
    })
  },
  ui: (a) => {
    const type = typeOf(a.organization, a.record)
    return [
      { op: 'inventoryPage', organization: a.organization, inventory: a.inventory, tab: 'Records' },
      { op: 'openRow', text: a.record },
      { op: 'tab', name: S.cls.tab.exclude },
      { op: 'pickOption', group: `Exclude ${type}: choose a reason`, text: recordExclusionLabels[a.reason]! },
      { op: 'fill', label: S.cls.field.justification, value: a.justification },
      ...(a.gas ? [{ op: 'fill', label: S.cls.field.gas, value: a.gas } as const] : []),
      ...(a.estimatedKgCo2e !== undefined ? [{ op: 'fill', label: S.cls.field.estimated, value: String(a.estimatedKgCo2e) } as const] : []),
      ...(a.emitsNothing ? [{ op: 'tick', label: S.cls.field.emitsNothing } as const] : []),
      ...(a.notEstimated ? [{ op: 'tick', label: S.cls.field.notEstimated } as const] : []),
      { op: 'click', button: S.cls.button.exclude, within: '[role="dialog"]' },
    ]
  },
  postconditions: (a) => [
    {
      outcome: 'recordView',
      args: {
        organization: a.organization,
        inventory: a.inventory,
        record: a.record,
        status: 'EXCLUDED',
        reason: a.reason,
        justification: a.justification,
        ...(a.notEstimated ? { estimate: 'NOT_ESTIMATED' } : {}),
        ...(a.emitsNothing ? { estimate: 'EMITS_NOTHING' } : {}),
        ...(a.gas ? { gas: a.gas } : {}),
      },
    },
  ],
  narrate: (a) => {
    const extras = [a.gas ? `gas "${a.gas}"` : '', a.notEstimated ? `tick **${S.cls.field.notEstimated}**` : '', a.emitsNothing ? `tick **${S.cls.field.emitsNothing}**` : ''].filter(Boolean)
    return `Open ${a.record}, switch to **${S.cls.tab.exclude}**, choose **${recordExclusionLabels[a.reason]}**, type "${a.justification}"${extras.length ? ', ' + extras.join(', ') : ''}, and exclude.`
  },
})

export const includeRecord = defineVerb({
  name: 'includeRecord',
  args: z.object({ ...invArgs, record: z.string() }).strict(),
  api: async (ctx, a) => {
    const { a: row } = await view(ctx, a.organization, a.inventory, a.record)
    return ctx.session().put(`/api/ghg/assignments/${row.id}/include`)
  },
  ui: (a) => [
    { op: 'inventoryPage', organization: a.organization, inventory: a.inventory, tab: 'Records' },
    { op: 'openRow', text: a.record },
    { op: 'click', button: `Re-include ${typeOf(a.organization, a.record)}`, within: '[role="dialog"]' },
  ],
  postconditions: (a) => [{ outcome: 'recordView', args: { organization: a.organization, inventory: a.inventory, record: a.record, included: true } }],
  narrate: (a) => `Re-include ${a.record}.`,
})

/** Several records under one reason and one justification; no magnitude is asked (spec 04.8). */
export const excludeSelected = defineVerb({
  name: 'excludeSelected',
  args: z.object({ ...invArgs, records: z.array(z.string()).min(1), reason: recordExclusionArg, justification: z.string() }).strict(),
  api: async (ctx, a) => {
    let last: ApiOutcome = { status: 0, ok: true }
    for (const record of a.records) {
      const { a: row } = await view(ctx, a.organization, a.inventory, record)
      last = await ctx.session().put(`/api/ghg/assignments/${row.id}/exclude`, { reason: a.reason, justification: a.justification, notEstimated: true })
      if (!last.ok) return last
    }
    return last
  },
  ui: (a) => [
    { op: 'inventoryPage', organization: a.organization, inventory: a.inventory, tab: 'Records' },
    ...a.records.map((record) => ({ op: 'tick', label: `Select ${typeOf(a.organization, record)}` }) as const),
    { op: 'click', button: `Exclude ${a.records.length} selected` },
    { op: 'choose', label: S.cls.field.reason, option: recordExclusionLabels[a.reason]!, within: `Exclude ${a.records.length} records?` },
    { op: 'fill', label: S.cls.field.justification, value: a.justification, within: `Exclude ${a.records.length} records?` },
    { op: 'confirm', dialog: `Exclude ${a.records.length} records?`, button: `${S.cls.button.exclude} ${a.records.length}` },
  ],
  postconditions: (a) =>
    a.records.map((record) => ({
      outcome: 'recordView',
      args: { organization: a.organization, inventory: a.inventory, record, status: 'EXCLUDED', reason: a.reason, justification: a.justification, estimate: 'NOT_ESTIMATED' },
    })),
  narrate: (a) =>
    `Tick ${a.records.join(' and ')}, click **Exclude ${a.records.length} selected**, choose **${recordExclusionLabels[a.reason]}**, type "${a.justification}", and confirm.`,
})

/** The straddle treatment, through the inventory's form (spec 04.2). */
export const setStraddleTreatment = defineVerb({
  name: 'setStraddleTreatment',
  args: z.object({ ...invArgs, straddle: z.enum(['PRO_RATE', 'BLOCK']) }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    return ctx.session().put(`/api/ghg/inventories/${inv.id}`, {
      name: inv.name,
      periodStart: inv.periodStart,
      periodEnd: inv.periodEnd,
      purpose: (inv as unknown as { purpose?: string | null }).purpose ?? null,
      baseYear: (inv as unknown as { baseYear?: number | null }).baseYear ?? null,
      consolidationApproach: inv.consolidationApproach,
      gwpSet: inv.gwpSet,
      straddleTreatment: a.straddle,
    })
  },
  ui: (a) => [
    { op: 'inventoryPage', organization: a.organization, inventory: a.inventory },
    { op: 'click', button: S.inv.button.editInventory },
    { op: 'choose', label: S.inv.field.straddle, option: S.inv.option.straddle[a.straddle]!, within: S.inv.dialog.editInventory },
    { op: 'click', button: S.inv.button.saveChanges, within: S.inv.dialog.editInventory },
  ],
  postconditions: (a) => [{ outcome: 'inventoryStraddle', args: { organization: a.organization, inventory: a.inventory, straddle: a.straddle } }],
  narrate: (a) => `Click **${S.inv.button.editInventory}**, set the straddle treatment to **${S.inv.option.straddle[a.straddle]}** and save.`,
})

export const addUpstreamRule = defineVerb({
  name: 'addUpstreamRule',
  args: z.object({ ...invArgs, primary: z.string(), upstream: z.string(), kind: z.enum(['WELL_TO_TANK', 'TRANSMISSION_AND_DISTRIBUTION']).default('WELL_TO_TANK') }).strict(),
  api: async (ctx, a) => {
    const { org, inv } = await inventory(ctx, a.organization, a.inventory)
    const primary = await factor(ctx.session(), org.id, a.primary)
    const upstream = await factor(ctx.session(), org.id, a.upstream)
    return ctx.session().post(`/api/ghg/inventories/${inv.id}/upstream-rules`, { primaryFactorId: primary.id, upstreamFactorId: upstream.id, kind: a.kind })
  },
  ui: (a) => [
    { op: 'inventoryPage', organization: a.organization, inventory: a.inventory, tab: 'Method' },
    { op: 'fill', label: S.cls.field.narrowPrimary, value: factorRef(a.primary).name },
    { op: 'choose', label: S.cls.field.primaryFactor, option: a.primary, prefix: true },
    { op: 'fill', label: S.cls.field.narrowUpstream, value: factorRef(a.upstream).name.replace(/^Well-to-tank: /, '').split(' ')[0]! },
    { op: 'choose', label: S.cls.field.upstreamFactor, option: a.upstream, prefix: true },
    { op: 'choose', label: S.cls.field.kind, option: a.kind, byValue: true },
    { op: 'click', button: S.cls.button.addRule },
  ],
  postconditions: (a) => [{ outcome: 'upstreamRuleListed', args: { organization: a.organization, inventory: a.inventory, primary: factorRef(a.primary).name, upstream: factorRef(a.upstream).name } }],
  narrate: (a) =>
    `On **Method**, in **Add an upstream rule**, choose the primary factor **${a.primary}** and the upstream factor **${a.upstream}**, and add.`,
})

const criteriaArg = z.array(criterionArg).length(8)

function criteriaBody(criteria: Array<'met' | 'notMet' | 'unanswered'>): Array<boolean | null> {
  return criteria.map((c) => (c === 'met' ? true : c === 'notMet' ? false : null))
}

/** A market instrument for a facility with its eight criteria answered one at a time (specs 07.3, 07.6). */
export const addInstrument = defineVerb({
  name: 'addInstrument',
  args: z
    .object({
      ...invArgs,
      facility: z.string(),
      instrument: z.enum(['SUPPLIER_SPECIFIC', 'CONTRACT', 'CERTIFICATE', 'RESIDUAL_MIX']),
      kgCo2ePerKwh: z.number(),
      source: z.string(),
      coveredMwh: z.number(),
      reference: z.string().optional(),
      registry: z.string().optional(),
      vintage: z.number().int().optional(),
      criteria: criteriaArg,
    })
    .strict(),
  api: async (ctx, a) => {
    const { org, inv } = await inventory(ctx, a.organization, a.inventory)
    const site = await facility(ctx.session(), org.id, a.facility)
    return ctx.session().put(`/api/ghg/inventories/${inv.id}/market-factors/${site.id}`, {
      instrumentType: a.instrument,
      kgCo2ePerKwh: a.kgCo2ePerKwh,
      source: a.source,
      criteria: criteriaBody(a.criteria),
      certificateId: a.reference ?? null,
      registry: a.registry ?? null,
      vintage: a.vintage ?? null,
      coveredKwh: a.coveredMwh * 1000,
    })
  },
  ui: (a) => [
    { op: 'inventoryPage', organization: a.organization, inventory: a.inventory, tab: 'Method' },
    { op: 'choose', label: S.cls.field.facility, option: `{facilityId:${a.organization}|${a.facility}}`, byValue: true },
    { op: 'choose', label: S.cls.field.instrument, option: a.instrument, byValue: true },
    { op: 'fill', label: S.cls.field.kgPerKwh, value: String(a.kgCo2ePerKwh) },
    { op: 'fill', label: S.cls.field.source, value: a.source },
    { op: 'fill', label: S.cls.field.coveredMwh, value: String(a.coveredMwh) },
    ...(a.reference ? [{ op: 'fill', label: S.cls.field.reference, value: a.reference } as const] : []),
    ...(a.registry ? [{ op: 'fill', label: S.cls.field.registry, value: a.registry } as const] : []),
    ...(a.vintage ? [{ op: 'fill', label: S.cls.field.vintage, value: String(a.vintage) } as const] : []),
    ...a.criteria.map((c, i) => ({ op: 'choose', label: `Criterion ${i + 1}`, option: c === 'met' ? 'true' : c === 'notMet' ? 'false' : '', byValue: true }) as const),
    // the form adds a facility's first instrument and saves a change to it under the other caption
    { op: 'clickAny', buttons: [S.cls.button.addInstrument, S.cls.button.saveInstrument] },
  ],
  postconditions: (a) => [{ outcome: 'instrumentListed', args: { organization: a.organization, inventory: a.inventory, facility: a.facility } }],
  narrate: (a) => {
    const met = a.criteria.map((c, i) => (c === 'met' ? i + 1 : 0)).filter(Boolean)
    const open = a.criteria.map((c, i) => (c === 'unanswered' ? i + 1 : 0)).filter(Boolean)
    return `Under the instruments card, add for ${a.facility}: ${S.cls.option.instrument[a.instrument]!.toLowerCase()}, ${a.kgCo2ePerKwh} kg CO₂e per kWh, source "${a.source}", covered quantity ${a.coveredMwh} MWh${a.reference ? `, reference "${a.reference}"` : ''}${a.registry ? `, registry "${a.registry}"` : ''}${a.vintage ? `, vintage ${a.vintage}` : ''}, and answer criteria ${met.join(', ')} **Met**${open.length ? `, leaving ${open.join(', ')} at **Not yet answered**` : ''}.`
  },
})

/** The instrument's row edited: the answers or the covered quantity. */
export const editInstrument = defineVerb({
  name: 'editInstrument',
  args: z.object({ ...invArgs, facility: z.string(), criteria: criteriaArg.optional(), coveredMwh: z.number().optional() }).strict(),
  api: async (ctx, a) => {
    const { org, inv } = await inventory(ctx, a.organization, a.inventory)
    const site = await facility(ctx.session(), org.id, a.facility)
    const current = (await instruments(ctx.session(), inv.id)).find((i) => i.facilityId === site.id)
    if (!current) return { status: 404, ok: false, body: { detail: `${a.facility} has no instrument` } }
    return ctx.session().put(`/api/ghg/inventories/${inv.id}/market-factors/${site.id}`, {
      instrumentType: current.instrumentType,
      kgCo2ePerKwh: current.kgCo2ePerKwh,
      source: current.source,
      criteria: a.criteria ? criteriaBody(a.criteria) : current.criteria.map((c) => (c.answer === 'MET' ? true : c.answer === 'NOT_MET' ? false : null)),
      certificateId: current.certificateId,
      registry: current.registry,
      vintage: current.vintage,
      coveredKwh: a.coveredMwh !== undefined ? a.coveredMwh * 1000 : current.coveredKwh,
      periodStart: current.periodStart,
      periodEnd: current.periodEnd,
    })
  },
  ui: (a) => [
    { op: 'inventoryPage', organization: a.organization, inventory: a.inventory, tab: 'Method' },
    { op: 'click', button: `Edit instrument for ${a.facility}` },
    ...(a.criteria ?? []).map((c, i) => ({ op: 'choose', label: `Criterion ${i + 1}`, option: c === 'met' ? 'true' : c === 'notMet' ? 'false' : '', byValue: true }) as const),
    ...(a.coveredMwh !== undefined ? [{ op: 'fill', label: S.cls.field.coveredMwh, value: String(a.coveredMwh) } as const] : []),
    { op: 'click', button: S.cls.button.saveInstrument },
  ],
  postconditions: (a) => [{ outcome: 'instrumentListed', args: { organization: a.organization, inventory: a.inventory, facility: a.facility } }],
  narrate: (a) =>
    `Click **Edit** on the instrument's row${a.criteria ? `, answer the criteria (${a.criteria.map((c, i) => `${i + 1} ${c === 'met' ? 'Met' : c === 'notMet' ? 'Not met' : 'Not yet answered'}`).join(', ')})` : ''}${a.coveredMwh !== undefined ? `, set the covered quantity to ${a.coveredMwh}` : ''} and click **${S.cls.button.saveInstrument}**.`,
})

export const setResidualMix = defineVerb({
  name: 'setResidualMix',
  args: z.object({ ...invArgs, available: z.boolean(), kgCo2ePerKwh: z.number().optional() }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    return ctx.session().put(`/api/ghg/inventories/${inv.id}/residual-mix`, { available: a.available, kgCo2ePerKwh: a.kgCo2ePerKwh ?? null })
  },
  ui: (a) => [
    { op: 'inventoryPage', organization: a.organization, inventory: a.inventory, tab: 'Method' },
    { op: 'choose', label: S.cls.field.residualAvailable, option: String(a.available), byValue: true },
    ...(a.kgCo2ePerKwh !== undefined ? [{ op: 'fill', label: S.cls.field.residualFactor, value: String(a.kgCo2ePerKwh) } as const] : []),
    { op: 'click', button: S.cls.button.saveResidualMix },
  ],
  postconditions: (a) => [{ outcome: 'residualMix', args: { organization: a.organization, inventory: a.inventory, available: a.available } }],
  narrate: (a) => `Choose **${a.available ? S.cls.option.residual.yes : S.cls.option.residual.no}**${a.kgCo2ePerKwh !== undefined ? ` with ${a.kgCo2ePerKwh} kg CO₂e per kWh` : a.available ? ' with no factor' : ''} and save.`,
})

export const reopenInventory = defineVerb({
  name: 'reopenInventory',
  args: z.object({ ...invArgs, reason: z.string() }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    return ctx.session().post(`/api/ghg/inventories/${inv.id}/reopen`, { reason: a.reason })
  },
  ui: (a) => [
    { op: 'inventoryPage', organization: a.organization, inventory: a.inventory },
    { op: 'click', button: S.cls.button.reopen },
    { op: 'fill', label: S.cls.field.reason, value: a.reason, within: S.cls.dialog.reopen },
    { op: 'click', button: S.cls.button.reopen, within: S.cls.dialog.reopen, ifEnabled: true },
  ],
  postconditions: () => [],
  narrate: (a) => `Click **${S.cls.button.reopen}**, type "${a.reason}" and confirm.`,
})

export const classificationVerbs = [
  openRecord,
  classifyRecord,
  classifyWithSuggestion,
  pickFactorWithoutDensity,
  excludeRecord,
  includeRecord,
  excludeSelected,
  setStraddleTreatment,
  addUpstreamRule,
  addInstrument,
  editInstrument,
  setResidualMix,
  reopenInventory,
]
