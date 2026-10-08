import { z } from 'zod'
import { defineOutcome, fail, notApplicable, pass } from '../contract.ts'
import { inventory } from '../inventories.ts'
import { account, actorArg } from '../helpers.ts'
import { orgArg } from '../organizations.ts'
import { csvRows, exportText, report, run, runDetail, runLabel, runs } from '../runs.ts'
import { S } from '../ui/surface.ts'
import { rule, ruleMessage } from '../rules/index.ts'

/** Statements about runs, their lines and exports, the report and the lifecycle (specs 05.1 to 05.3, 07.4, 07.5). */

const invArgs = { organization: orgArg, inventory: z.string() }
const runArg = z.union([z.string(), z.number().int()])
const label = (r: string | number) => (typeof r === 'number' ? runLabel(r) : r)
const kg = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
/** A figure as the page prints it: tonnes to two decimals from 1,000 kg, else kilograms to one. */
const onScreen = (n: number) =>
  Math.abs(n) >= 1000 ? `${(n / 1000).toLocaleString('en-US', { maximumFractionDigits: 2 })} t CO₂e` : `${n.toLocaleString('en-US', { maximumFractionDigits: 1 })} kg CO₂e`

export const runListed = defineOutcome({
  name: 'runListed',
  args: z
    .object({ ...invArgs, run: runArg, totalKgCo2e: z.number().optional(), boundaryVersion: z.number().int().optional(), voided: z.boolean().optional(), voidReason: z.string().optional(), final: z.boolean().optional() })
    .strict(),
  api: async (ctx, a) => {
    const { run: r } = await run(ctx, a.organization, a.inventory, a.run)
    // the procedure sums lines rounded to the cent; the run keeps a third decimal, so a cent of drift is the rounding
    if (a.totalKgCo2e !== undefined && Math.abs(Number(r.totalKgCo2e) - a.totalKgCo2e) > 0.01) return fail(`${r.label} totals ${r.totalKgCo2e} kg CO₂e, expected ${a.totalKgCo2e}`)
    if (a.boundaryVersion !== undefined && r.boundaryVersionNo !== a.boundaryVersion) return fail(`${r.label} cites boundary version ${r.boundaryVersionNo}`)
    if (a.voided !== undefined && r.voided !== a.voided) return fail(`${r.label} is ${r.voided ? 'voided' : 'not voided'}`)
    if (a.voidReason !== undefined && r.voidReason !== a.voidReason) return fail(`${r.label} void reason is "${r.voidReason}"`)
    if (a.final !== undefined && r.isFinal !== a.final) return fail(`${r.label} is ${r.isFinal ? 'final' : 'not final'}`)
    return pass(`${r.label}: ${r.totalKgCo2e} kg CO₂e`)
  },
  ui: (a) => {
    const cells: string[] = []
    if (a.boundaryVersion !== undefined) cells.push(`boundary v${a.boundaryVersion}`)
    if (a.voided) cells.push('VOIDED')
    if (a.voidReason) cells.push(a.voidReason)
    if (a.final) cells.push('FINAL')
    return [
      { check: 'atInventory', organization: a.organization, inventory: a.inventory, tab: 'Runs' },
      { check: 'rowHas', text: label(a.run), cells },
    ]
  },
  narrate: (a) => {
    const parts = [`${label(a.run)} is listed`]
    if (a.totalKgCo2e !== undefined) parts.push(`with its total ${onScreen(a.totalKgCo2e)} (${kg(a.totalKgCo2e)} kg)`)
    if (a.boundaryVersion !== undefined) parts.push(`and "boundary v${a.boundaryVersion}"`)
    if (a.voided) parts.push(`marked VOIDED${a.voidReason ? ` with your email and the reason "${a.voidReason}"` : ''}`)
    if (a.final) parts.push('marked FINAL')
    return parts.join(' ') + '.'
  },
})

/** One line of a run: the record it prices, what it derives from, its conversion and its share. */
export const runLine = defineOutcome({
  name: 'runLine',
  args: z
    .object({
      ...invArgs,
      run: runArg,
      record: z.string(),
      kgCo2e: z.number().optional(),
      conversionNote: z.string().optional(),
      coveredDays: z.number().int().optional(),
      periodDays: z.number().int().optional(),
      derived: z.boolean().optional(),
      proxyJustification: z.string().optional(),
    })
    .strict(),
  api: async (ctx, a) => {
    const { run: r } = await run(ctx, a.organization, a.inventory, a.run)
    const detail = await runDetail(ctx.session(), r.id)
    const lines = detail.lines.filter((l) => l.recordRef === a.record || l.activityType === a.record)
    const line = lines.find((l) => (a.derived ? l.derivedFromLineId !== null : l.derivedFromLineId === null))
    if (!line) return fail(`no ${a.derived ? 'derived ' : ''}line for ${a.record}; lines: ${detail.lines.map((l) => `${l.recordRef} ${l.activityType}`).join(', ')}`)
    if (a.kgCo2e !== undefined && Math.abs(Number(line.kgCo2e) - a.kgCo2e) > 0.01) return fail(`${a.record} is ${line.kgCo2e} kg CO₂e, expected ${a.kgCo2e}`)
    if (a.conversionNote !== undefined && !(line.conversionNote ?? '').includes(a.conversionNote)) return fail(`${a.record} converts as "${line.conversionNote}"`)
    if (a.coveredDays !== undefined && Number(line.coveredDays) !== a.coveredDays) return fail(`${a.record} covers ${line.coveredDays} days`)
    if (a.periodDays !== undefined && Number(line.periodDays) !== a.periodDays) return fail(`${a.record}'s period is ${line.periodDays} days`)
    if (a.proxyJustification !== undefined && line.proxyJustification !== a.proxyJustification) return fail(`${a.record}'s proxy justification is "${line.proxyJustification}"`)
    return pass(`${line.kgCo2e} kg CO₂e`)
  },
  ui: (a) => [
    { check: 'atRun', organization: a.organization, inventory: a.inventory, run: String(a.run) },
    ...(a.conversionNote ? [{ check: 'textVisible', text: a.conversionNote } as const] : []),
    ...(a.kgCo2e !== undefined ? [{ check: 'textVisible', text: onScreen(a.kgCo2e) } as const] : []),
  ],
  narrate: (a) => {
    const parts = [`the ${a.derived ? 'derived line of ' : 'line of '}${a.record}`]
    if (a.kgCo2e !== undefined) parts.push(`reads ${onScreen(a.kgCo2e)} (${kg(a.kgCo2e)} kg)`)
    if (a.conversionNote) parts.push(`and "${a.conversionNote}"`)
    if (a.coveredDays !== undefined) parts.push(`and ${a.coveredDays} covered days of ${a.periodDays ?? '?'}`)
    return parts.join(' ').replace(/^./, (c) => c.toUpperCase()) + '.'
  },
})

export const runExclusions = defineOutcome({
  name: 'runExclusions',
  args: z.object({ ...invArgs, run: runArg, records: z.array(z.object({ record: z.string(), reason: z.string(), detailContaining: z.string().optional(), estimate: z.string().optional() }).strict()) }).strict(),
  api: async (ctx, a) => {
    const { run: r } = await run(ctx, a.organization, a.inventory, a.run)
    const detail = await runDetail(ctx.session(), r.id)
    if (detail.exclusions.length !== a.records.length) return fail(`${detail.exclusions.length} exclusions: ${detail.exclusions.map((e) => e.recordRef).join(', ')}`)
    for (const want of a.records) {
      const hit = detail.exclusions.find((e) => e.recordRef === want.record)
      if (!hit) return fail(`${want.record} is not excluded on the run`)
      if (hit.exclusionReason !== want.reason) return fail(`${want.record} is excluded as ${hit.exclusionReason}`)
      if (want.detailContaining && !(hit.exclusionDetail ?? '').includes(want.detailContaining)) return fail(`${want.record}'s detail is "${hit.exclusionDetail}"`)
      if (want.estimate && hit.estimateState !== want.estimate) return fail(`${want.record}'s estimate state is ${hit.estimateState}`)
    }
    return pass(`${detail.exclusions.length} exclusions`)
  },
  ui: (a) => [
    { check: 'atRun', organization: a.organization, inventory: a.inventory, run: String(a.run) },
    // the run page groups the exclusions by reason and names each record by its activity type
    ...a.records.map((r) => ({ check: 'rowHas' as const, text: `{activityType:${a.organization}|${r.record}}`, cells: [...(r.detailContaining ? [r.detailContaining] : []), ...(r.estimate === 'NOT_ESTIMATED' ? ['not estimated'] : [])] })),
  ],
  narrate: (a) => `The exclusions are ${a.records.map((r) => `${r.record} (${r.reason.toLowerCase().replace(/_/g, ' ')}${r.detailContaining ? `, ${r.detailContaining}` : ''}${r.estimate === 'NOT_ESTIMATED' ? ', not estimated' : ''})`).join(', ')}, each with its reason and detail.`,
})

export const runByGas = defineOutcome({
  name: 'runByGas',
  args: z.object({ ...invArgs, run: runArg, hfcsKg: z.number().optional(), unsplitKgCo2e: z.number().optional() }).strict(),
  api: async (ctx, a) => {
    const { run: r } = await run(ctx, a.organization, a.inventory, a.run)
    if (a.hfcsKg !== undefined && Math.abs(Number(r.byGas?.hfcsKg ?? 0) - a.hfcsKg) > 0.005) return fail(`HFCs ${r.byGas?.hfcsKg} kg, expected ${a.hfcsKg}`)
    // the row sums lines rounded to the cent; a cent of drift is the rounding, not a difference
    if (a.unsplitKgCo2e !== undefined && Math.abs(Number(r.byGas?.co2eUnsplitKg ?? 0) - a.unsplitKgCo2e) > 0.02) return fail(`CO₂e without a gas split ${r.byGas?.co2eUnsplitKg} kg, expected ${a.unsplitKgCo2e}`)
    return pass()
  },
  ui: (a) => [
    { check: 'atRun', organization: a.organization, inventory: a.inventory, run: String(a.run) },
    ...(a.hfcsKg !== undefined ? [{ check: 'rowHas' as const, text: 'HFCs', cells: [`${a.hfcsKg} kg`] }] : []),
    // the by-gas table prints tonnes to three decimals
    ...(a.unsplitKgCo2e !== undefined ? [{ check: 'rowHas' as const, text: 'CO₂e from factors without a gas split', cells: [`${(a.unsplitKgCo2e / 1000).toFixed(3)} t CO₂e`] }] : []),
  ],
  narrate: (a) =>
    `${a.hfcsKg !== undefined ? `The refrigerant line carries ${a.hfcsKg} kg under HFCs. ` : ''}${a.unsplitKgCo2e !== undefined ? `The row "CO₂e from factors without a gas split" carries ${(a.unsplitKgCo2e / 1000).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} t CO₂e (${kg(a.unsplitKgCo2e)} kg).` : ''}`.trim(),
})

export const reportHeader = defineOutcome({
  name: 'reportHeader',
  args: z
    .object({
      ...invArgs,
      run: runArg,
      // spec 05.8: who submitted the run for review and who signed it off, by actor
      preparedBy: actorArg.optional(),
      approvedBy: actorArg.optional(),
      selfApproved: z.boolean().optional(),
      version: z.number().int().optional(),
      supersedes: z.string().optional(),
      supersededBy: z.string().optional(),
      publishedBy: z.string().optional(),
      finalDesignatedBy: z.string().optional(),
      finalNote: z.string().optional(),
    })
    .strict(),
  api: async (ctx, a) => {
    const { run: r } = await run(ctx, a.organization, a.inventory, a.run)
    const h = (await report(ctx.session(), r.id)).header
    const same = (email: string | null | undefined, actor: string) => (email ?? '').toLowerCase() === account(ctx, actor).email.toLowerCase()
    if (a.preparedBy !== undefined && !same(h.preparedByEmail, a.preparedBy)) return fail(`prepared by "${h.preparedBy}"`)
    if (a.approvedBy !== undefined && !same(h.approvedByEmail, a.approvedBy)) return fail(`approved by "${h.approvedBy}"`)
    if (a.selfApproved !== undefined && (h.selfApproved ?? false) !== a.selfApproved) return fail(`self-approved: ${String(h.selfApproved)}`)
    if (a.version !== undefined && h.version !== a.version) return fail(`report version ${h.version}`)
    if (a.supersedes !== undefined && !h.supersedes.includes(a.supersedes)) return fail(`supersedes ${h.supersedes.join(', ') || 'nothing'}`)
    if (a.supersededBy !== undefined && h.supersededBy !== a.supersededBy) return fail(`superseded by ${h.supersededBy ?? 'nothing'}`)
    if (a.publishedBy !== undefined && h.publishedBy !== a.publishedBy) return fail(`published by ${h.publishedBy ?? 'nobody'}`)
    if (a.finalDesignatedBy !== undefined && h.finalDesignatedBy !== a.finalDesignatedBy) return fail(`final designated by ${h.finalDesignatedBy ?? 'nobody'}`)
    if (a.finalNote !== undefined && h.finalNote !== a.finalNote) return fail(`final note "${h.finalNote}"`)
    return pass()
  },
  ui: (a) => [
    { check: 'atRun', organization: a.organization, inventory: a.inventory, run: String(a.run) },
    ...(a.preparedBy ? [{ check: 'rowHas' as const, text: 'Prepared by', cells: [`{email:${a.preparedBy}}`] }] : []),
    ...(a.approvedBy ? [{ check: 'rowHas' as const, text: 'Approved by', cells: [`{email:${a.approvedBy}}`] }] : []),
    ...(a.selfApproved ? [{ check: 'textVisible', text: S.run.text.selfApproved } as const] : []),
    ...(a.version !== undefined ? [{ check: 'rowHas' as const, text: S.run.text.reportVersion, cells: [`${a.version}${a.supersedes ? `, supersedes ${a.supersedes}` : ''}`] }] : []),
    ...(a.supersededBy ? [{ check: 'textVisible', text: `superseded by ${a.supersededBy}` } as const] : []),
    ...(a.finalNote ? [{ check: 'textVisible', text: a.finalNote } as const] : []),
  ],
  narrate: (a, n) => {
    const parts: string[] = []
    if (a.preparedBy) parts.push(`**Prepared by** names ${n.actorAlias(a.preparedBy)} with the run`)
    if (a.approvedBy) parts.push(`**Approved by** names ${n.actorAlias(a.approvedBy)} with the run`)
    if (a.selfApproved) parts.push(`it adds "${S.run.text.selfApproved}"`)
    if (a.version !== undefined) parts.push(`the header reads "Report version ${a.version}${a.supersedes ? `, supersedes ${a.supersedes}` : ''}"`)
    if (a.supersededBy) parts.push(`its header says it is superseded by ${a.supersededBy}`)
    if (a.publishedBy) parts.push(`published by ${a.publishedBy}`)
    if (a.finalDesignatedBy) parts.push(`final designated by ${a.finalDesignatedBy}${a.finalNote ? `: "${a.finalNote}"` : ''}`)
    return parts.join('; ').replace(/^./, (c) => c.toUpperCase()) + '.'
  },
})

export const reportIntensity = defineOutcome({
  name: 'reportIntensity',
  args: z.object({ ...invArgs, run: runArg, name: z.string(), value: z.number(), unit: z.string(), tCo2ePerUnit: z.number() }).strict(),
  api: async (ctx, a) => {
    const { run: r } = await run(ctx, a.organization, a.inventory, a.run)
    const hit = (await report(ctx.session(), r.id)).intensity.find((i) => i.name === a.name)
    if (!hit) return fail(`no intensity "${a.name}"`)
    if (Number(hit.value) !== a.value || hit.unit !== a.unit) return fail(`${a.name} is ${hit.value} ${hit.unit}`)
    if (Math.abs(Number(hit.tCo2ePerUnit) - a.tCo2ePerUnit) > 0.0000005) return fail(`${a.name}: ${hit.tCo2ePerUnit} t CO₂e per ${a.unit}`)
    return pass(`${hit.tCo2ePerUnit}`)
  },
  ui: (a) => [{ check: 'atRun', organization: a.organization, inventory: a.inventory, run: String(a.run) }, { check: 'textVisible', text: `per ${a.unit} of ${a.name.toLowerCase()} (${a.value.toLocaleString('en-US')} ${a.unit})` }],
  narrate: (a) => `**Intensity** reads "${a.tCo2ePerUnit} t CO₂e per ${a.unit} of ${a.name.toLowerCase()} (${a.value.toLocaleString('en-US')} ${a.unit})".`,
})

export const reportStatementHas = defineOutcome({
  name: 'reportStatementHas',
  args: z.object({ ...invArgs, run: runArg, section: z.enum(['dataQuality', 'uncertainty']), containing: z.string() }).strict(),
  api: async (ctx, a) => {
    const { run: r } = await run(ctx, a.organization, a.inventory, a.run)
    const rep = await report(ctx.session(), r.id)
    const text = a.section === 'dataQuality' ? rep.dataQuality.statement : (rep.dataQuality.uncertaintyStatement ?? '')
    return text.includes(a.containing) ? pass() : fail(`the ${a.section} statement reads "${text}"`)
  },
  ui: (a) => [{ check: 'atRun', organization: a.organization, inventory: a.inventory, run: String(a.run) }, { check: 'textVisible', text: a.containing }],
  narrate: (a) => `The methodology section ${a.section === 'uncertainty' ? 'prints the uncertainty statement' : 'ends'} "${a.containing}".`,
})

/** A CSV export's columns and one cell of one row; the browser saves the file, the API reads it. */
export const csvHas = defineOutcome({
  name: 'csvHas',
  args: z.object({ ...invArgs, run: runArg, file: z.enum(['lines.csv', 'exclusions.csv']), columns: z.array(z.string()).optional(), rows: z.number().int().optional(), cell: z.object({ record: z.string(), column: z.string(), value: z.string() }).strict().optional() }).strict(),
  api: async (ctx, a) => {
    const { run: r } = await run(ctx, a.organization, a.inventory, a.run)
    const text = await exportText(ctx.session(), r.id, a.file)
    const rows = csvRows(text)
    const header = Object.keys(rows[0] ?? {})
    const missing = (a.columns ?? []).filter((c) => !header.includes(c))
    if (missing.length) return fail(`${a.file} lacks ${missing.join(', ')}; header: ${header.join(',')}`)
    if (a.rows !== undefined && rows.length !== a.rows) return fail(`${a.file} has ${rows.length} rows`)
    if (a.cell) {
      const row = rows.find((x) => x.record_ref === a.cell!.record)
      if (!row) return fail(`${a.file} has no row for ${a.cell.record}`)
      if ((row[a.cell.column] ?? '') !== a.cell.value) return fail(`${a.cell.record} ${a.cell.column} is "${row[a.cell.column]}"`)
    }
    return pass(`${rows.length} rows`)
  },
  ui: () => [{ check: 'na', why: 'a download the browser saves; the API reads the file' }],
  narrate: (a) =>
    `**${a.file === 'lines.csv' ? 'Lines (CSV)' : 'Exclusions (CSV)'}**${a.rows !== undefined ? ` has ${a.rows} rows` : ''}${a.columns ? ` with ${a.columns.map((c) => `\`${c}\``).join(', ')}` : ''}${a.cell ? `; ${a.cell.record} carries \`${a.cell.column}\` ${a.cell.value === '' ? 'empty' : `\`${a.cell.value}\``}` : ''}.`,
})

export const inputsHas = defineOutcome({
  name: 'inputsHas',
  args: z.object({ ...invArgs, run: runArg, boundaryVersion: z.number().int().optional(), instruments: z.number().int().optional(), residualMixAvailable: z.boolean().optional() }).strict(),
  api: async (ctx, a) => {
    const { run: r } = await run(ctx, a.organization, a.inventory, a.run)
    const text = await exportText(ctx.session(), r.id, 'inputs.json')
    const json = JSON.parse(text) as Record<string, unknown>
    // the file carries the version with its entries: { boundaryVersion: { version: { versionNo }, entries, exclusions } }
    const bv = json.boundaryVersion as { versionNo?: number; version?: { versionNo?: number } } | number | undefined
    const versionNo = typeof bv === 'number' ? bv : (bv?.versionNo ?? bv?.version?.versionNo)
    if (a.boundaryVersion !== undefined && versionNo !== a.boundaryVersion) return fail(`inputs.json boundaryVersion is ${JSON.stringify(bv)?.slice(0, 80)}`)
    if (a.instruments !== undefined && (json.instruments as unknown[] | undefined)?.length !== a.instruments) return fail(`inputs.json has ${(json.instruments as unknown[] | undefined)?.length} instruments`)
    if (a.residualMixAvailable !== undefined && json.residualMixAvailable !== a.residualMixAvailable) return fail(`inputs.json residualMixAvailable is ${JSON.stringify(json.residualMixAvailable)}`)
    return pass()
  },
  ui: () => [{ check: 'na', why: 'a download the browser saves; the API reads the file' }],
  narrate: (a) =>
    `**Frozen inputs (JSON)** carries ${[a.boundaryVersion !== undefined ? `\`boundaryVersion\` ${a.boundaryVersion}` : '', a.instruments !== undefined ? `${a.instruments === 1 ? 'the one instrument' : `${a.instruments} instruments`}` : '', a.residualMixAvailable !== undefined ? `the residual mix (${a.residualMixAvailable ? 'available' : 'not available'})` : ''].filter(Boolean).join(', ')}.`,
})

/** A control the page withholds for the actor's role: disabled with the tooltip; through the API, the role refusal. */
export const roleDisabled = defineOutcome({
  name: 'roleDisabled',
  expectsRefusal: true,
  args: z.object({ button: z.string(), tooltip: z.string().default(S.run.text.writeTooltip) }).strict(),
  api: async (_ctx, a, last) => {
    if (!last) return fail('no action to be refused')
    if (last.ok) return fail(`the action went through (${last.status})`)
    if (last.rule !== 'ghg.role.required') return fail(`refused by ${last.rule ?? 'an unnamed rule'}, expected ghg.role.required`)
    return pass(`403 ghg.role.required (${a.button})`)
  },
  ui: (a) => [{ check: 'buttonDisabled', button: a.button, tooltip: a.tooltip }],
  narrate: (a) => `**${a.button}** is disabled, with the tooltip "${a.tooltip}": a preparer's refusals are disabled controls, not dialogs.`,
})

/**
 * A control the page disables for a product rule, with a title that says why; through the API, the
 * refusal by that rule (spec 05.8: Mark as final for the run's submitter while someone else may sign).
 */
export const ruleDisabled = defineOutcome({
  name: 'ruleDisabled',
  expectsRefusal: true,
  args: z.object({ button: z.string(), title: z.string(), rule: z.string(), with: z.record(z.string(), z.string()).optional() }).strict(),
  api: async (_ctx, a, last) => {
    const entry = rule(a.rule)
    if (!last) return fail('no action to be refused')
    if (last.ok) return fail(`the action went through (${last.status})`)
    if (last.rule !== a.rule) return fail(`refused by ${last.rule ?? 'an unnamed rule'} (${String((last.body as { detail?: string })?.detail)}), expected ${a.rule}`)
    return pass(`${entry.status} ${a.rule}`)
  },
  ui: (a) => [{ check: 'buttonDisabled', button: a.button, tooltip: a.title }],
  narrate: (a) => `**${a.button}** is disabled with the title "${a.title}"; through the API the refusal reads "${ruleMessage(a.rule, a.with ?? {})}".`,
})

/**
 * A member the page leaves out of a list for a product rule; through the API, the refusal by that rule
 * (spec 05.8: the Approver list offers only the members whose role may sign off).
 */
export const optionWithheld = defineOutcome({
  name: 'optionWithheld',
  expectsRefusal: true,
  args: z.object({ field: z.string(), member: actorArg, rule: z.string(), with: z.record(z.string(), z.string()).optional() }).strict(),
  api: async (_ctx, a, last) => {
    const entry = rule(a.rule)
    if (!last) return fail('no action to be refused')
    if (last.ok) return fail(`the action went through (${last.status})`)
    if (last.rule !== a.rule) return fail(`refused by ${last.rule ?? 'an unnamed rule'} (${String((last.body as { detail?: string })?.detail)}), expected ${a.rule}`)
    return pass(`${entry.status} ${a.rule}`)
  },
  ui: (a) => [{ check: 'optionListed', label: a.field, option: `{name:${a.member}}`, absent: true }],
  narrate: (a, n) => `**${a.field}** does not offer ${n.actorName(a.member)}; through the API the refusal reads "${ruleMessage(a.rule, a.with ?? {})}".`,
})

/** A control disabled with a title that says why; nothing is sent. */
export const controlDisabled = defineOutcome({
  name: 'controlDisabled',
  readsScreenFirst: true,
  args: z.object({ button: z.string(), title: z.string().optional() }).strict(),
  api: async (_ctx, a) => notApplicable(`the control "${a.button}" is disabled on screen`),
  ui: (a) => [{ check: 'buttonDisabled', button: a.button, tooltip: a.title }],
  narrate: (a) => `**${a.button}** is disabled${a.title ? ` with the title "${a.title}"` : ''}.`,
})

export const buttonsOffered = defineOutcome({
  name: 'buttonsOffered',
  readsScreenFirst: true,
  args: z.object({ present: z.array(z.string()).optional(), absent: z.array(z.string()).optional() }).strict(),
  api: async (_ctx, a) => notApplicable(`the page offers ${(a.present ?? []).join(', ') || 'nothing named'} and not ${(a.absent ?? []).join(', ') || 'anything named'}`),
  ui: (a) => [...(a.present ?? []).map((b) => ({ check: 'buttonVisible', button: b, visible: true }) as const), ...(a.absent ?? []).map((b) => ({ check: 'buttonVisible', button: b, visible: false }) as const)],
  narrate: (a) => `${a.present?.length ? `Only ${a.present.map((b) => `**${b}**`).join(', ')} is offered` : ''}${a.absent?.length ? `${a.present?.length ? ': ' : ''}no ${a.absent.map((b) => `**${b}**`).join(', no ')}` : ''}.`,
})

export const reportHeaderSaved = defineOutcome({
  name: 'reportHeaderSaved',
  args: z.object({ ...invArgs, denominators: z.array(z.object({ name: z.string(), value: z.number(), unit: z.string() }).strict()).optional() }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    const full = inv as unknown as { intensityMetrics: Array<{ name: string; value: number; unit: string }> }
    for (const d of a.denominators ?? []) {
      const hit = full.intensityMetrics.find((m) => m.name === d.name)
      if (!hit || Number(hit.value) !== d.value || hit.unit !== d.unit) return fail(`denominator ${d.name}: ${JSON.stringify(hit)}`)
    }
    return pass()
  },
  ui: (a) => [
    { check: 'atInventory', organization: a.organization, inventory: a.inventory, tab: 'Report' },
    ...(a.denominators ?? []).map((d) => ({ check: 'textVisible', text: `${d.name}: ${d.value.toLocaleString('en-US')} ${d.unit}` }) as const),
  ],
  narrate: (a) => `"Report header saved." Every field reads what you typed${a.denominators?.length ? `; the row reads "${a.denominators.map((d) => `${d.name}: ${d.value.toLocaleString('en-US')} ${d.unit}`).join('", "')}"` : ''}.`,
})

export const inventoryGwpSet = defineOutcome({
  name: 'inventoryGwpSet',
  args: z.object({ ...invArgs, gwpSet: z.enum(['AR5', 'AR6']) }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    return inv.gwpSet === a.gwpSet ? pass() : fail(`the GWP set is ${inv.gwpSet}`)
  },
  ui: (a) => [{ check: 'textVisible', text: `GWP ${a.gwpSet}` }],
  narrate: (a) => `The header reads GWP ${a.gwpSet}.`,
})

export const inheritanceDropped = defineOutcome({
  name: 'inheritanceDropped',
  args: z.object({ ...invArgs, entity: z.string(), reason: z.string(), sharePercent: z.number() }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    const out = await ctx.session().get(`/api/ghg/inventories/${inv.id}/inheritance`)
    if (!out.ok) return fail(`inheritance answered ${out.status}`)
    const dropped = (out.body as { droppedExclusions: Array<{ entityName: string | null; reason: string; sharePercent: number }> }).droppedExclusions
    const hit = dropped.find((d) => d.entityName === a.entity)
    if (!hit) return fail(`no dropped exclusion for ${a.entity}: ${JSON.stringify(dropped).slice(0, 200)}`)
    if (hit.reason !== a.reason || Number(hit.sharePercent) !== a.sharePercent) return fail(`${a.entity}: ${hit.reason} at ${hit.sharePercent}%`)
    return pass()
  },
  ui: (a) => [{ check: 'textVisible', text: `${a.entity}:` }, { check: 'textVisible', text: `${a.sharePercent}% equity share under this approach` }],
  narrate: (a) => `**${S.run.text.cameFrom}** lists "${a.entity}: ${a.reason === 'METHODOLOGY' ? 'Methodology exclusion' : a.reason} dropped, ${a.sharePercent}% equity share under this approach".`,
})

export const runCount = defineOutcome({
  name: 'runCount',
  args: z.object({ ...invArgs, count: z.number().int() }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    const all = await runs(ctx.session(), inv.id)
    return all.length === a.count ? pass() : fail(`${all.length} runs`)
  },
  ui: (a) => [{ check: 'atInventory', organization: a.organization, inventory: a.inventory, tab: 'Runs' }, { check: 'textVisible', text: runLabel(a.count) }],
  narrate: (a) => `${runLabel(a.count)} is listed; numbers are never reused.`,
})

/** The correction block of a report: what moved against the published run (spec 05.3). */
export const reportCorrection = defineOutcome({
  name: 'reportCorrection',
  args: z.object({ ...invArgs, run: runArg, added: z.number().int(), removed: z.number().int(), changed: z.number().int() }).strict(),
  api: async (ctx, a) => {
    const { run: r } = await run(ctx, a.organization, a.inventory, a.run)
    const c = (await report(ctx.session(), r.id)).correction
    if (!c) return fail('the report has no correction block')
    if (c.addedLines !== a.added || c.removedLines !== a.removed || c.changedLines !== a.changed) return fail(`${c.addedLines} added, ${c.removedLines} removed, ${c.changedLines} changed`)
    return pass()
  },
  ui: (a) => [{ check: 'atRun', organization: a.organization, inventory: a.inventory, run: String(a.run) }, { check: 'textVisible', text: `${a.added} lines added, ${a.removed} removed, ${a.changed} changed` }],
  narrate: (a) => `The correction block reads "Against the published run: ${a.added} lines added, ${a.removed} removed, ${a.changed} changed".`,
})

/**
 * One act in an inventory's history (specs 05.2, 05.8): the action, a text its detail contains, and
 * who did it. The History list sits under the runs on the Runs tab.
 */
export const inventoryHistoryHas = defineOutcome({
  name: 'inventoryHistoryHas',
  args: z.object({ ...invArgs, action: z.string(), detail: z.string().optional(), actor: actorArg.optional() }).strict(),
  api: async (ctx, a) => {
    const { inv } = await inventory(ctx, a.organization, a.inventory)
    const out = await ctx.session().get(`/api/ghg/inventories/${inv.id}/events`)
    if (!out.ok) return fail(`could not read the history: ${out.status}`)
    const rows = out.body as Array<{ action: string; actor: string; reason: string | null }>
    const hit = rows.find(
      (e) =>
        e.action === a.action &&
        (a.detail === undefined || (e.reason ?? '').includes(a.detail)) &&
        (a.actor === undefined || e.actor.toLowerCase() === account(ctx, a.actor).email.toLowerCase()),
    )
    return hit ? pass() : fail(`no ${a.action} entry${a.detail ? ` "${a.detail}"` : ''}; last: ${rows.slice(0, 3).map((e) => `${e.action}: ${e.reason ?? ''}`).join(' | ')}`)
  },
  ui: (a) => [
    { check: 'atInventory', organization: a.organization, inventory: a.inventory, tab: 'Runs' },
    ...(S.run.history[a.action] ? [{ check: 'textVisible', text: S.run.history[a.action]! } as const] : []),
    ...(a.detail ? [{ check: 'textVisible', text: a.detail } as const] : []),
  ],
  narrate: (a, n) =>
    `Under **History** on **Runs**, the entry "${S.run.history[a.action] ?? a.action}"${a.detail ? ` reads "${a.detail}"` : ' is listed'}${a.actor ? `, by ${n.actorAlias(a.actor)}` : ''}.`,
})

export const runOutcomes = [reportCorrection, runListed, runLine, runExclusions, runByGas, reportHeader, reportIntensity, reportStatementHas, csvHas, inputsHas, roleDisabled, ruleDisabled, optionWithheld, controlDisabled, buttonsOffered, reportHeaderSaved, inventoryGwpSet, inheritanceDropped, runCount, inventoryHistoryHas]
