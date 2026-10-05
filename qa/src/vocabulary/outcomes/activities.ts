import { z } from 'zod'
import { defineOutcome, fail, pass } from '../contract.ts'
import { activities, activity, facilities, orgArg, organization } from '../organizations.ts'
import { S } from '../ui/surface.ts'

/** Statements about the activity register, its imports, its evidence and its history (specs 04.4 to 04.6). */

interface Preview {
  dryRun: boolean
  imported: number
  rejected: Array<{ row: number; message: string }>
  rows: Array<{ row: number; status: string; issues: string[] }>
  totals: Array<{ facilityName: string; streamName: string | null; unit: string; rows: number; quantity: number }>
  warnings: Array<{ row: number; message: string }>
}

export const importPreview = defineOutcome({
  name: 'importPreview',
  args: z
    .object({
      recordsToAdd: z.number().int(),
      totals: z.array(z.object({ facility: z.string(), stream: z.string().optional(), unit: z.string(), quantity: z.number() })).optional(),
      warning: z.object({ row: z.number().int(), containing: z.string() }).optional(),
      ready: z.array(z.number().int()).optional(),
      noStream: z.number().int().optional(),
      noEvidence: z.number().int().optional(),
    })
    .strict(),
  api: async (_ctx, a, last) => {
    if (!last?.ok) return fail(`the preview was refused with ${last?.status}`)
    const p = last.body as Preview
    if (p.rows.length !== a.recordsToAdd) return fail(`${p.rows.length} records to add, expected ${a.recordsToAdd}`)
    for (const total of a.totals ?? []) {
      const hit = p.totals.find((t) => t.facilityName === total.facility && (total.stream === undefined || t.streamName === total.stream) && t.unit === total.unit)
      if (!hit) return fail(`no control total for ${total.facility} / ${total.stream ?? 'no emission source'} / ${total.unit}`)
      if (Number(hit.quantity) !== total.quantity) return fail(`${total.facility} ${total.unit} totals ${hit.quantity}, expected ${total.quantity}`)
    }
    if (a.warning && !p.warnings.some((w) => w.row === a.warning!.row && w.message.includes(a.warning!.containing))) return fail(`no warning on row ${a.warning.row} saying "${a.warning.containing}"`)
    if (a.ready) {
      // a row whose evidence is a reference only still reads Ready; the pill follows the status, not the issue list
      const ready = p.rows.filter((r) => r.status === 'READY').map((r) => r.row)
      if (ready.join(',') !== a.ready.join(',')) return fail(`ready rows are ${ready.join(', ') || 'none'}; ${p.rows.map((r) => `${r.row}: ${r.status} ${r.issues.join('+')}`).join(', ')}`)
    }
    if (a.noStream !== undefined && p.rows.filter((r) => r.issues.includes('NO_STREAM')).length !== a.noStream) return fail(`no-stream rows: ${p.rows.filter((r) => r.issues.includes('NO_STREAM')).length}`)
    if (a.noEvidence !== undefined && p.rows.filter((r) => r.issues.includes('NO_EVIDENCE')).length !== a.noEvidence) return fail(`needs-evidence rows: ${p.rows.filter((r) => r.issues.includes('NO_EVIDENCE')).length}`)
    return pass()
  },
  ui: (a) => [
    { check: 'textVisible', text: S.act.text.controlTotals },
    { check: 'textVisible', text: `${a.recordsToAdd} records to add` },
    ...(a.totals ?? []).map((t) => ({ check: 'textVisible', text: `${t.quantity.toLocaleString('en-GB')} ${t.unit}` }) as const),
  ],
  narrate: (a) => {
    const parts = [`The file is checked at once, and nothing is written.`]
    if (a.totals) parts.push(`**${S.act.text.controlTotals}** groups the rows by facility, emission source and unit: ${a.totals.map((t) => `${t.facility}, ${t.stream ?? 'no emission source'}, ${t.quantity.toLocaleString('en-GB')} ${t.unit}`).join('; ')}.`)
    parts.push(`"${a.recordsToAdd} records to add" lists each row with its facility and period.`)
    if (a.warning) parts.push(`Under **Worth a look before adding**, row ${a.warning.row} is named: "${a.warning.containing}".`)
    if (a.ready) parts.push(`Rows ${a.ready.join(', ')} read **${S.act.text.ready}**.`)
    if (a.noStream !== undefined) parts.push(`${a.noStream} rows read "${S.act.text.noSource}"${a.noEvidence !== undefined ? ` and ${a.noEvidence} of them "Needs evidence"` : ''}.`)
    return parts.join(' ')
  },
})

export const importRejected = defineOutcome({
  name: 'importRejected',
  args: z.object({ rows: z.union([z.number().int(), z.literal('all')]), messages: z.record(z.string(), z.string()).optional() }).strict(),
  api: async (_ctx, a, last) => {
    if (!last?.ok) return fail(`the preview was refused with ${last?.status}`)
    const p = last.body as Preview
    if (p.imported !== 0) return fail(`${p.imported} records were imported`)
    if (a.rows === 'all' ? p.rows.length !== 0 || p.rejected.length === 0 : p.rejected.length !== a.rows) return fail(`${p.rejected.length} rows rejected, ${p.rows.length} would add`)
    for (const [row, containing] of Object.entries(a.messages ?? {})) {
      const hit = p.rejected.find((r) => r.row === Number(row))
      if (!hit) return fail(`row ${row} is not rejected`)
      if (!hit.message.includes(containing)) return fail(`row ${row}: "${hit.message}"`)
    }
    return pass()
  },
  ui: (a) => [
    ...(typeof a.rows === 'number' ? [{ check: 'textVisible', text: `${a.rows} rows rejected` } as const] : []),
    ...Object.values(a.messages ?? {}).map((m) => ({ check: 'textVisible', text: m }) as const),
    { check: 'buttonDisabled', button: S.act.button.addRecords },
  ],
  narrate: (a) => {
    const parts = [a.rows === 'all' ? 'Every row is rejected' : `"Nothing will import: ${a.rows} rows rejected. Fix them and choose the file again."`]
    for (const [row, m] of Object.entries(a.messages ?? {})) parts.push(`Row ${row}: "${m}".`)
    parts.push(`**${S.act.button.addRecords}** stays disabled.`)
    return parts.join(' ')
  },
})

/** The names the file has and the facility does not, each with the near names the preview offers (spec 04.11). */
export const importUnknownSources = defineOutcome({
  name: 'importUnknownSources',
  args: z.object({ sources: z.array(z.object({ name: z.string(), facility: z.string(), candidates: z.array(z.string()) }).strict()).min(1) }).strict(),
  api: async (_ctx, a, last) => {
    if (!last?.ok) return fail(`the preview was refused with ${last?.status}`)
    const p = last.body as Preview & { unknownSources: Array<{ facility: string; name: string; rows: number[]; candidates: Array<{ name: string }> }> }
    if (p.rejected.length > 0) return fail(`${p.rejected.length} rows rejected: ${p.rejected.map((r) => `${r.row}: ${r.message}`).join('; ')}`)
    if (p.unknownSources.length !== a.sources.length) return fail(`${p.unknownSources.length} unknown names: ${p.unknownSources.map((u) => u.name).join(', ')}`)
    for (const s of a.sources) {
      const hit = p.unknownSources.find((u) => u.name === s.name && u.facility === s.facility)
      if (!hit) return fail(`'${s.name}' at ${s.facility} is not listed as unknown`)
      const offered = hit.candidates.map((c) => c.name).sort().join(',')
      if (offered !== [...s.candidates].sort().join(',')) return fail(`'${s.name}' offers ${offered || 'nothing'}, expected ${s.candidates.join(', ') || 'nothing'}`)
    }
    const pending = p.rows.filter((r) => r.status === 'NEEDS_DECISION').length
    return pending > 0 ? pass(`${pending} rows wait`) : fail('no row reads NEEDS_DECISION')
  },
  ui: (a) => [
    { check: 'textVisible', text: `${S.act.text.decideUnknown} ${a.sources.length} unknown emission source${a.sources.length === 1 ? '' : 's'}` },
    ...a.sources.map((s) => ({ check: 'textVisible', text: `'${s.name}' at ${s.facility}` }) as const),
    { check: 'textVisible', text: S.act.text.needsDecision },
  ],
  narrate: (a) =>
    `Nothing is rejected. Under **${S.act.text.decideUnknown} ${a.sources.length} unknown emission source${a.sources.length === 1 ? '' : 's'}**, a card per name: ${a.sources
      .map((s) => `'${s.name}' at ${s.facility}${s.candidates.length ? ` offers **Use ${s.candidates.join('**, **Use ')}**` : ' offers no near name'}`)
      .join('; ')}. Their rows read **${S.act.text.needsDecision}** and **${S.act.button.addRecords}** stays disabled.`,
})

/** After the decisions, every row has its source and nothing waits (spec 04.11). */
export const importResolved = defineOutcome({
  name: 'importResolved',
  args: z.object({ recordsToAdd: z.number().int() }).strict(),
  api: async (_ctx, a, last) => {
    if (!last?.ok) return fail(`the preview was refused with ${last?.status}`)
    const p = last.body as Preview & { unknownSources: unknown[] }
    if (p.unknownSources.length > 0) return fail(`${p.unknownSources.length} names still unknown`)
    if (p.rows.some((r) => r.status === 'NEEDS_DECISION')) return fail('a row still reads NEEDS_DECISION')
    if (p.rows.length !== a.recordsToAdd) return fail(`${p.rows.length} records to add, expected ${a.recordsToAdd}`)
    return pass()
  },
  ui: (a) => [{ check: 'textAbsent', text: S.act.text.needsDecision }, { check: 'textVisible', text: `${a.recordsToAdd} records to add` }],
  narrate: (a) => `No row reads **${S.act.text.needsDecision}** any more; "${a.recordsToAdd} records to add" and **${S.act.button.addRecords}** is enabled.`,
})

export const activityHasSource = defineOutcome({
  name: 'activityHasSource',
  args: z.object({ organization: orgArg, record: z.string(), source: z.string() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const row = await activity(ctx.session(), org.id, a.record)
    return row.streamName === a.source ? pass() : fail(`${a.record} names ${row.streamName ?? 'no emission source'}`)
  },
  ui: (a) => [{ check: 'atOrg', organization: a.organization, section: S.org.sections.activity }, { check: 'rowHas', text: a.record, cells: [a.source] }],
  narrate: (a) => `${a.record} names the emission source ${a.source}.`,
})

export const activityCount = defineOutcome({
  name: 'activityCount',
  args: z.object({ organization: orgArg, count: z.number().int() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const n = (await activities(ctx.session(), org.id)).filter((r) => !r.removed).length
    return n === a.count ? pass(String(n)) : fail(`${n} records, expected ${a.count}`)
  },
  ui: (a) => [{ check: 'atOrg', organization: a.organization, section: S.org.sections.activity }, { check: 'textVisible', text: `${a.count} record` }],
  narrate: (a) => `The register holds ${a.count} records.`,
})

export const activityRefs = defineOutcome({
  name: 'activityRefs',
  args: z.object({ organization: orgArg, from: z.string(), to: z.string() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const refs = (await activities(ctx.session(), org.id)).filter((r) => !r.removed).map((r) => r.recordRef).sort()
    return refs[0] === a.from && refs[refs.length - 1] === a.to ? pass() : fail(`records run ${refs[0]} to ${refs[refs.length - 1]}`)
  },
  ui: (a) => [{ check: 'atOrg', organization: a.organization, section: S.org.sections.activity }, { check: 'textVisible', text: a.from }, { check: 'textVisible', text: a.to }],
  narrate: (a) => `The register lists ${a.from} to ${a.to}.`,
})

export const activityOrder = defineOutcome({
  name: 'activityOrder',
  args: z.object({ organization: orgArg, newestPeriodFirst: z.literal(true), first: z.string(), last: z.string() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const rows = (await activities(ctx.session(), org.id)).filter((r) => !r.removed && r.periodEnd).sort((x, y) => (y.periodEnd ?? '').localeCompare(x.periodEnd ?? ''))
    return rows[0]?.recordRef === a.first && rows[rows.length - 1]?.recordRef === a.last ? pass() : fail(`by period, newest first: ${rows[0]?.recordRef} ... ${rows[rows.length - 1]?.recordRef}`)
  },
  ui: () => [{ check: 'na', why: 'the order of the register is read from the table, not asserted on screen yet' }],
  narrate: (a) => `Sorted by period with the newest first: ${a.first} at the top, ${a.last} at the foot.`,
})

export const activityExists = defineOutcome({
  name: 'activityExists',
  args: z
    .object({
      organization: orgArg,
      record: z.string(),
      draft: z.boolean().optional(),
      quantity: z.number().optional(),
      unit: z.string().optional(),
      evidenceRef: z.string().optional(),
      issues: z.array(z.string()).optional(),
    })
    .strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const row = await activity(ctx.session(), org.id, a.record)
    if (a.draft !== undefined && row.draft !== a.draft) return fail(`${a.record} draft is ${row.draft}`)
    if (a.quantity !== undefined && Number(row.quantity) !== a.quantity) return fail(`${a.record} quantity is ${row.quantity}`)
    if (a.unit !== undefined && row.unit !== a.unit) return fail(`${a.record} unit is ${row.unit}`)
    if (a.evidenceRef !== undefined && row.evidenceRef !== a.evidenceRef) return fail(`${a.record} reference is ${row.evidenceRef}`)
    if (a.issues) {
      const got = [...row.issues].sort().join(',')
      if (got !== [...a.issues].sort().join(',')) return fail(`${a.record} issues are ${got || 'none'}`)
    }
    return pass()
  },
  ui: (a) => [{ check: 'atOrg', organization: a.organization, section: S.org.sections.activity }, { check: 'textVisible', text: a.record }],
  narrate: (a) => {
    const parts = [`${a.record} is on the register`]
    if (a.draft) parts.push('as a draft with no quantity and no period; the banner names it as a draft with data outstanding')
    if (a.draft === false) parts.push('as a fact')
    if (a.quantity !== undefined) parts.push(`with the quantity ${a.quantity}${a.unit ? ` ${a.unit}` : ''}`)
    if (a.evidenceRef) parts.push(`with the reference ${a.evidenceRef}`)
    if (a.issues) parts.push(a.issues.length ? `reading ${a.issues.map(issueLabel).map((i) => `"${i}"`).join(' and ')}` : 'with nothing outstanding')
    return parts.join(' ') + '.'
  },
})

function issueLabel(issue: string): string {
  return { NO_STREAM: 'No emission source', NO_EVIDENCE: 'Needs evidence', NO_DATA_SOURCE: 'Missing source', EVIDENCE_REFERENCE_ONLY: 'reference only', MISSING_QUANTITY: 'No quantity', MISSING_UNIT: 'No unit', MISSING_PERIOD: 'No period' }[issue] ?? issue
}

export const activityRemoved = defineOutcome({
  name: 'activityRemoved',
  args: z.object({ organization: orgArg, record: z.string() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const live = (await activities(ctx.session(), org.id)).filter((r) => !r.removed)
    return live.some((r) => r.recordRef === a.record || r.activityType === a.record) ? fail(`${a.record} is still on the register`) : pass()
  },
  ui: (a) => [{ check: 'atOrg', organization: a.organization, section: S.org.sections.activity }, { check: 'textAbsent', text: a.record }],
  narrate: (a) => `${a.record} leaves the register; its history is kept.`,
})

export const activityHistoryHas = defineOutcome({
  name: 'activityHistoryHas',
  args: z.object({ organization: orgArg, record: z.string(), kind: z.enum(['ENTERED', 'CORRECTED', 'REMOVED']), reason: z.string().optional(), field: z.string().optional(), before: z.string().optional(), after: z.string().optional(), actor: z.string().optional() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const row = await activity(ctx.session(), org.id, a.record)
    const out = await ctx.session().get(`/api/ghg/activities/${row.id}/revisions`)
    if (!out.ok) return fail(`could not read the history: ${out.status}`)
    const revisions = out.body as Array<{ kind: string; reason: string | null; changedBy: string; changes: Array<{ field: string; before: string | null; after: string | null }> }>
    const hit = revisions.find(
      (r) =>
        r.kind === a.kind &&
        (a.reason === undefined || (r.reason ?? '').includes(a.reason)) &&
        (a.field === undefined || r.changes.some((c) => c.field === a.field && (a.before === undefined || String(c.before) === a.before) && (a.after === undefined || String(c.after) === a.after))),
    )
    return hit ? pass() : fail(`no ${a.kind} revision${a.reason ? ` with "${a.reason}"` : ''}; history: ${revisions.map((r) => `${r.kind} ${r.reason ?? ''}`).join(' | ')}`)
  },
  ui: () => [{ check: 'na', why: 'the record history opens in a modal the checks do not drive yet' }],
  narrate: (a) =>
    a.kind === 'ENTERED'
      ? `Its history reads "Entered from a draft".`
      : `The history lists the ${a.kind.toLowerCase()}${a.before ? ` with the old value ${a.before}` : ''}${a.after ? `, the new value ${a.after}` : ''}${a.reason ? `, the reason "${a.reason}"` : ''} and the actor's email.`,
})

export const attentionCount = defineOutcome({
  name: 'attentionCount',
  args: z.object({ organization: orgArg, count: z.number().int() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    // the banner counts every live record that is not Ready (a draft included); a reference-only evidence line is still Ready
    const n = (await activities(ctx.session(), org.id)).filter((r) => !r.removed && r.status !== 'READY').length
    return n === a.count ? pass(String(n)) : fail(`${n} records need attention, expected ${a.count}`)
  },
  ui: (a) => [{ check: 'atOrg', organization: a.organization, section: S.org.sections.activity }, { check: 'textVisible', text: `${S.act.text.resolve} ${a.count} items` }],
  narrate: (a) => `The banner above the register counts ${a.count} records that need attention and offers **${S.act.text.resolve} ${a.count} items**.`,
})

export const evidenceListed = defineOutcome({
  name: 'evidenceListed',
  args: z.object({ organization: orgArg, record: z.string(), name: z.string(), kind: z.enum(['FILE', 'LINK']).optional(), count: z.number().int().optional() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const row = await activity(ctx.session(), org.id, a.record)
    const out = await ctx.session().get(`/api/ghg/activities/${row.id}/evidence`)
    if (!out.ok) return fail(`could not list evidence: ${out.status}`)
    const items = out.body as Array<{ kind: string; name: string }>
    const hit = items.find((e) => e.name === a.name && (a.kind === undefined || e.kind === a.kind))
    if (!hit) return fail(`no ${a.kind ?? ''} evidence named ${a.name} on ${a.record}`)
    if (a.count !== undefined && items.length !== a.count) return fail(`${items.length} items of evidence, expected ${a.count}`)
    return pass()
  },
  ui: (a) => [{ check: 'textVisible', text: a.name }],
  narrate: (a) => `${a.kind === 'LINK' ? `"${a.name}" is listed as a link` : `${a.name} is listed with its name, size and who uploaded it`}${a.count !== undefined ? `; the drawer's evidence tab reads "Evidence ${a.count}"` : ''}.`,
})

export const sourceDocumentListed = defineOutcome({
  name: 'sourceDocumentListed',
  args: z.object({ organization: orgArg, name: z.string(), record: z.string().optional() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const out = await ctx.session().get(`/api/ghg/organizations/${org.id}/evidence/page?size=100`)
    if (!out.ok) return fail(`could not list the documents: ${out.status}`)
    const items = (out.body as { items: Array<{ name: string; recordRef: string }> }).items
    const hit = items.find((d) => d.name === a.name && (a.record === undefined || d.recordRef === a.record))
    return hit ? pass() : fail(`${a.name} is not listed${a.record ? ` against ${a.record}` : ''}`)
  },
  ui: (a) => [{ check: 'atOrg', organization: a.organization, section: S.org.sections.documents }, { check: 'textVisible', text: a.name }],
  narrate: (a) => `\`${a.name}\` is listed${a.record ? ` against ${a.record}` : ''}.`,
})

export const importBatchListed = defineOutcome({
  name: 'importBatchListed',
  args: z.object({ organization: orgArg, file: z.string() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const out = await ctx.session().get(`/api/ghg/organizations/${org.id}/import-batches`)
    if (!out.ok) return fail(`could not list the import batches: ${out.status}`)
    const hit = (out.body as Array<{ fileName: string; sha256: string }>).find((b) => b.fileName === a.file)
    return hit ? pass(hit.sha256.slice(0, 12)) : fail(`${a.file} is not among the imported files`)
  },
  ui: (a) => [{ check: 'atOrg', organization: a.organization, section: S.org.sections.documents }, { check: 'textVisible', text: a.file }],
  narrate: (a) => `The imported file \`${a.file}\` is listed with its digest and the moment it was uploaded.`,
})

export const evidenceIndexHeader = defineOutcome({
  name: 'evidenceIndexHeader',
  args: z.object({ organization: orgArg, header: z.string() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const out = await ctx.session().get(`/api/ghg/organizations/${org.id}/evidence/index.csv`)
    if (!out.ok) return fail(`the index answered ${out.status}`)
    const first = String(out.body).split(/\r?\n/)[0]
    return first === a.header ? pass() : fail(`the header reads ${first}`)
  },
  ui: () => [{ check: 'na', why: 'a download the browser saves; the API reads the file' }],
  narrate: (a) => `**${S.act.button.downloadIndex}** gives a CSV with the header \`${a.header}\` and one row per document.`,
})

export const importTemplateHeader = defineOutcome({
  name: 'importTemplateHeader',
  args: z.object({ organization: orgArg, header: z.string() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const out = await ctx.session().get(`/api/ghg/organizations/${org.id}/activities/import-template.csv`)
    if (!out.ok) return fail(`the template answered ${out.status}`)
    const first = String(out.body).split(/\r?\n/)[0]
    return first === a.header ? pass() : fail(`the template header reads ${first}`)
  },
  ui: () => [{ check: 'na', why: 'a download the browser saves; the API reads the file' }],
  narrate: (a) => `**${S.act.button.downloadTemplate}** gives a file whose header is \`${a.header}\`, the same as the fixture's.`,
})

export const facilityAbsent = defineOutcome({
  name: 'facilityAbsent',
  args: z.object({ organization: orgArg, name: z.string() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    return (await facilities(ctx.session(), org.id)).some((f) => f.name === a.name) ? fail(`${a.name} is still listed`) : pass()
  },
  ui: (a) => [{ check: 'atOrg', organization: a.organization, section: S.org.sections.facilities }, { check: 'rowAbsent', text: a.name }],
  narrate: (a) => `${a.name} is no longer listed.`,
})

export const activityOutcomes = [importPreview, importRejected, importUnknownSources, importResolved, activityHasSource, activityCount, activityRefs, activityOrder, activityExists, activityRemoved, activityHistoryHas, attentionCount, evidenceListed, sourceDocumentListed, importBatchListed, evidenceIndexHeader, importTemplateHeader, facilityAbsent]
