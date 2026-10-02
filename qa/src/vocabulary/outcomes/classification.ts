import { z } from 'zod'
import { defineOutcome, fail, notApplicable, pass } from '../contract.ts'
import { assignment, assignments, boundaryVersions, categoryLabels, instruments, inventory, recordExclusionLabels, scopeLabels, upstreamRules, validation } from '../inventories.ts'
import { orgArg } from '../organizations.ts'
import { rule } from '../rules/index.ts'
import { S } from '../ui/surface.ts'

/** Statements about the view's records, the method and the lifecycle (specs 04.1 to 04.8, 05.5, 07.3, 07.6). */

const invArgs = { organization: orgArg, inventory: z.string() }

/** A record as the view holds it: its status, decision and the words recorded with it. */
export const recordView = defineOutcome({
  name: 'recordView',
  args: z
    .object({
      ...invArgs,
      record: z.string(),
      status: z.enum(['UNCLASSIFIED', 'INCLUDED', 'EXCLUDED']).optional(),
      included: z.boolean().optional(),
      scope: z.enum(['SCOPE_1', 'SCOPE_2', 'SCOPE_3']).optional(),
      category: z.string().optional(),
      factor: z.string().optional(),
      density: z.string().optional(),
      proxy: z.boolean().optional(),
      reason: z.string().optional(),
      detailContaining: z.string().optional(),
      justification: z.string().optional(),
      estimate: z.enum(['NOT_ESTIMATED', 'EMITS_NOTHING', 'ESTIMATED']).optional(),
      gas: z.string().optional(),
      changedSincePublication: z.array(z.string()).optional(),
    })
    .strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    const row = await assignment(ctx.session(), inv.id, a.record)
    const changed = (row as unknown as { changedSincePublication: string[] | null }).changedSincePublication ?? []
    if (a.changedSincePublication && changed.join(',') !== a.changedSincePublication.join(',')) return fail(`${a.record} changed since publication: ${changed.join(', ') || 'nothing'}`)
    const status = !row.included ? 'EXCLUDED' : row.classified ? 'INCLUDED' : 'UNCLASSIFIED'
    if (a.status && status !== a.status) return fail(`${a.record} is ${status}${row.exclusionReason ? ` (${row.exclusionReason}${row.exclusionDetail ? `: ${row.exclusionDetail}` : ''})` : ''}, expected ${a.status}`)
    if (a.included !== undefined && row.included !== a.included) return fail(`${a.record} is ${row.included ? 'included' : 'excluded'}`)
    if (a.scope && row.scope !== a.scope) return fail(`${a.record} is in ${row.scope}, expected ${a.scope}`)
    if (a.category && row.category !== a.category) return fail(`${a.record} is in ${row.category}, expected ${a.category}`)
    if (a.factor && row.factorName !== a.factor) return fail(`${a.record} uses '${row.factorName}', expected '${a.factor}'`)
    if (a.density && !(row.densityMaterial && a.density.startsWith(row.densityMaterial))) return fail(`${a.record} converts through '${row.densityMaterial}', expected '${a.density}'`)
    if (a.proxy !== undefined && row.proxy !== a.proxy) return fail(`${a.record} proxy is ${row.proxy}`)
    if (a.reason && row.exclusionReason !== a.reason) return fail(`${a.record} is excluded as ${row.exclusionReason}, expected ${a.reason}`)
    if (a.detailContaining && !(row.exclusionDetail ?? '').includes(a.detailContaining)) return fail(`${a.record}'s exclusion detail is "${row.exclusionDetail}"`)
    if (a.justification && row.exclusionJustification !== a.justification) return fail(`${a.record}'s justification is "${row.exclusionJustification}"`)
    if (a.estimate && row.estimateState !== a.estimate) return fail(`${a.record}'s estimate state is ${row.estimateState}`)
    if (a.gas && row.gas !== a.gas) return fail(`${a.record}'s gas is ${row.gas}`)
    return pass(status)
  },
  ui: (a) => {
    const cells: string[] = []
    if (a.status === 'EXCLUDED' || a.reason) cells.push(`Excluded · ${a.reason ? recordExclusionLabels[a.reason] : ''}`.trim())
    if (a.status === 'INCLUDED') cells.push(S.cls.text.included)
    if (a.status === 'UNCLASSIFIED') cells.push(S.cls.text.unclassified)
    if (a.scope) cells.push(scopeLabels[a.scope]!)
    if (a.detailContaining) cells.push(a.detailContaining)
    if (a.justification) cells.push(a.justification)
    if (a.estimate === 'NOT_ESTIMATED') cells.push('not estimated')
    if (a.estimate === 'EMITS_NOTHING') cells.push('emits nothing')
    if (a.gas) cells.push(`${a.gas}, outside the scopes`)
    if (a.changedSincePublication) cells.push(`${S.run.text.changedSincePublication} ${a.changedSincePublication.join(', ')}`)
    return [
      { check: 'atInventory', organization: a.organization, inventory: a.inventory, tab: 'Records' },
      { check: 'rowHas', text: a.record, cells },
    ]
  },
  narrate: (a) => {
    const parts: string[] = []
    if (a.status === 'EXCLUDED' || a.reason) parts.push(`${a.record} reads "Excluded · ${a.reason ? recordExclusionLabels[a.reason] : ''}"${a.detailContaining ? ` with "${a.detailContaining}"` : ''}`)
    else if (a.status === 'INCLUDED') parts.push(`${a.record} reads included${a.scope ? `, ${scopeLabels[a.scope]!.toLowerCase()}` : ''}${a.category ? `, **${categoryLabels[a.category] ?? a.category}**` : ''}`)
    else if (a.status === 'UNCLASSIFIED') parts.push(`${a.record} is still unclassified`)
    else if (a.included) parts.push(`${a.record} is included again`)
    if (a.factor) parts.push(`uses **${a.factor}**${a.density ? ` through the density "${a.density}"` : ''}`)
    if (a.justification) parts.push(`with "${a.justification}"`)
    if (a.estimate === 'NOT_ESTIMATED') parts.push('"; not estimated"')
    if (a.estimate === 'EMITS_NOTHING') parts.push('"; emits nothing"')
    if (a.gas) parts.push(`"; ${a.gas}, outside the scopes"`)
    if (a.changedSincePublication) parts.push(`${a.record} is marked "${S.run.text.changedSincePublication} ${a.changedSincePublication.join(', ')}"`)
    return parts.join(', ').replace(/^./, (c) => c.toUpperCase()) + '.'
  },
})

export const recordCounts = defineOutcome({
  name: 'recordCounts',
  args: z.object({ ...invArgs, total: z.number().int().optional(), unclassified: z.number().int().optional(), excluded: z.number().int().optional() }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    const rows = await assignments(ctx.session(), inv.id)
    const unclassified = rows.filter((r) => r.included && !r.classified).length
    const excluded = rows.filter((r) => !r.included).length
    if (a.total !== undefined && rows.length !== a.total) return fail(`${rows.length} records in the view, expected ${a.total}`)
    if (a.unclassified !== undefined && unclassified !== a.unclassified) return fail(`${unclassified} unclassified, expected ${a.unclassified}`)
    if (a.excluded !== undefined && excluded !== a.excluded) return fail(`${excluded} excluded, expected ${a.excluded}`)
    return pass(`${rows.length} records, ${unclassified} unclassified, ${excluded} excluded`)
  },
  ui: (a) => [
    { check: 'atInventory', organization: a.organization, inventory: a.inventory, tab: 'Records' },
    ...(a.unclassified !== undefined ? [{ check: 'optionListed', label: S.cls.field.status, option: `Unclassified (${a.unclassified})` } as const] : []),
    ...(a.excluded !== undefined ? [{ check: 'optionListed', label: S.cls.field.status, option: `Excluded (${a.excluded})` } as const] : []),
  ],
  narrate: (a) => {
    const parts: string[] = []
    if (a.total !== undefined) parts.push(`${a.total} records`)
    if (a.unclassified !== undefined) parts.push(`${a.unclassified} are unclassified`)
    if (a.excluded !== undefined) parts.push(`${a.excluded} are excluded`)
    return parts.join('; ').replace(/^./, (c) => c.toUpperCase()) + '.'
  },
})

/** A line the screen prints and the API does not: a preview of the arithmetic, a drawer's sentence. */
export const screenReads = defineOutcome({
  name: 'screenReads',
  readsScreenFirst: true,
  args: z.object({ text: z.string() }).strict(),
  api: async (_ctx, a) => notApplicable(`the screen reads "${a.text}"`),
  ui: (a) => [{ check: 'textVisible', text: a.text }],
  narrate: (a) => `The screen reads "${a.text}".`,
})

export const inventoryStraddle = defineOutcome({
  name: 'inventoryStraddle',
  args: z.object({ ...invArgs, straddle: z.enum(['PRO_RATE', 'BLOCK']) }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    return inv.straddleTreatment === a.straddle ? pass() : fail(`the straddle treatment is ${inv.straddleTreatment}`)
  },
  ui: () => [],
  narrate: (a) => `The straddle treatment is **${S.inv.option.straddle[a.straddle]}**.`,
})

export const upstreamRuleListed = defineOutcome({
  name: 'upstreamRuleListed',
  args: z.object({ ...invArgs, primary: z.string(), upstream: z.string() }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    const hit = (await upstreamRules(ctx.session(), inv.id)).find((r) => r.primaryFactorName === a.primary && r.upstreamFactorName === a.upstream)
    return hit ? pass(`${hit.matchingLines} lines`) : fail(`no rule from '${a.primary}' to '${a.upstream}'`)
  },
  ui: (a) => [
    { check: 'atInventory', organization: a.organization, inventory: a.inventory, tab: 'Method' },
    { check: 'rowHas', text: a.primary, cells: [a.upstream] },
  ],
  narrate: (a) => `The rule **${a.primary}** to **${a.upstream}** is listed.`,
})

export const instrumentListed = defineOutcome({
  name: 'instrumentListed',
  args: z.object({ ...invArgs, facility: z.string(), notApplied: z.union([z.string(), z.literal(false)]).optional() }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    const hit = (await instruments(ctx.session(), inv.id)).find((i) => i.facilityName === a.facility)
    if (!hit) return fail(`no instrument for ${a.facility}`)
    if (a.notApplied === false && !hit.meetsQualityCriteria) return fail(`the instrument is not applied (${hit.notMetCount} not met, ${hit.unansweredCount} unanswered)`)
    if (typeof a.notApplied === 'string' && hit.meetsQualityCriteria) return fail('the instrument is applied')
    return pass(hit.meetsQualityCriteria ? 'applied' : `${hit.notMetCount} not met, ${hit.unansweredCount} unanswered`)
  },
  ui: (a) => [
    { check: 'atInventory', organization: a.organization, inventory: a.inventory, tab: 'Method' },
    ...(typeof a.notApplied === 'string' ? [{ check: 'rowHas' as const, text: a.facility, cells: [a.notApplied] }] : []),
    ...(a.notApplied === false ? [{ check: 'rowLacks' as const, text: a.facility, cell: S.cls.text.notApplied }] : []),
  ],
  narrate: (a) =>
    typeof a.notApplied === 'string' ? `The row reads "${a.notApplied}".` : a.notApplied === false ? `The row no longer reads "${S.cls.text.notApplied}".` : `The instrument for ${a.facility} is listed.`,
})

export const residualMix = defineOutcome({
  name: 'residualMix',
  args: z.object({ ...invArgs, available: z.boolean() }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    const value = (inv as unknown as { residualMixAvailable: boolean | null }).residualMixAvailable
    return value === a.available ? pass() : fail(`the residual mix availability is ${value}`)
  },
  ui: (a) => [
    { check: 'atInventory', organization: a.organization, inventory: a.inventory, tab: 'Method' },
    { check: 'fieldValue', label: S.cls.field.residualAvailable, value: a.available ? S.cls.option.residual.yes : S.cls.option.residual.no },
  ],
  narrate: (a) => `The inventory records that ${a.available ? 'a residual mix is available' : 'no residual mix is available'}.`,
})

/** No gate error other than the draft's own ("Freeze it to enable a run"). */
export const noGateErrors = defineOutcome({
  name: 'noGateErrors',
  args: z.object({ ...invArgs, warnings: z.number().int().optional() }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    const report = await validation(ctx.session(), inv.id)
    const findings = report.gates.flatMap((g) => g.findings)
    const errors = findings.filter((f) => f.severity === 'ERROR' && !f.message.startsWith('The inventory is a draft'))
    if (errors.length > 0) return fail(`errors remain: ${errors.map((e) => e.message).join(' | ')}`)
    const warnings = findings.filter((f) => f.severity === 'WARNING')
    if (a.warnings !== undefined && warnings.length !== a.warnings) return fail(`${warnings.length} warnings, expected ${a.warnings}: ${warnings.map((w) => w.message).join(' | ')}`)
    return pass(`${warnings.length} warnings`)
  },
  ui: () => [{ check: 'na', why: 'the gate findings are read from the validation report; the panel marks the draft itself as the one error' }],
  narrate: (a) => `No error remains on the pre-flight${a.warnings !== undefined ? `; ${a.warnings} warnings do` : ''}.`,
})

export const boundaryVersion = defineOutcome({
  name: 'boundaryVersion',
  args: z.object({ ...invArgs, versionNo: z.number().int(), count: z.number().int().optional(), reopenReason: z.string().optional() }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    const versions = await boundaryVersions(ctx.session(), inv.id)
    if (a.count !== undefined && versions.length !== a.count) return fail(`${versions.length} versions, expected ${a.count}`)
    const hit = versions.find((v) => v.versionNo === a.versionNo)
    if (!hit) return fail(`no version ${a.versionNo}`)
    if (a.reopenReason !== undefined && hit.reopenReason !== a.reopenReason) return fail(`version ${a.versionNo} reopen reason is "${hit.reopenReason}"`)
    if (a.reopenReason === undefined && inv.currentBoundaryVersionNo !== a.versionNo && inv.status !== 'DRAFT') return fail(`the current version is ${inv.currentBoundaryVersionNo}`)
    return pass()
  },
  ui: (a) =>
    a.reopenReason !== undefined
      ? [{ check: 'atInventory', organization: a.organization, inventory: a.inventory, tab: 'Boundary' }, { check: 'textVisible', text: a.reopenReason }]
      : [{ check: 'atInventory', organization: a.organization, inventory: a.inventory, tab: 'Records' }, { check: 'textVisible', text: `Boundary version ${a.versionNo}` }],
  narrate: (a) =>
    a.reopenReason !== undefined
      ? `On **Boundary**, the version list keeps version ${a.versionNo} with its reopening: "${a.reopenReason}".`
      : `The header reads "Boundary version ${a.versionNo}"${a.count !== undefined ? `; the history reads ${a.count} versions` : ''}.`,
})

/** A dialog whose button stays disabled: the page's refusal, and through the API the rule's. */
export const dialogButtonDisabled = defineOutcome({
  name: 'dialogButtonDisabled',
  expectsRefusal: true,
  args: z.object({ dialog: z.string(), button: z.string(), rule: z.string() }).strict(),
  api: async (_ctx, a, last) => {
    const entry = rule(a.rule)
    if (!last) return fail('no action to be refused')
    if (last.ok) return fail(`the action went through (${last.status})`)
    if (last.rule !== a.rule) return fail(`refused by ${last.rule ?? 'an unnamed rule'} (${String((last.body as { detail?: string })?.detail)}), expected ${a.rule}`)
    return pass(`${entry.status} ${a.rule}`)
  },
  ui: (a) => [{ check: 'buttonDisabled', button: a.button, within: a.dialog }],
  narrate: (a) => `**${a.button}** stays disabled: "${rule(a.rule).message}".`,
})

export const classificationOutcomes = [recordView, recordCounts, screenReads, inventoryStraddle, upstreamRuleListed, instrumentListed, residualMix, noGateErrors, boundaryVersion, dialogButtonDisabled]
