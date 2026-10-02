import { z } from 'zod'
import { account, actorArg } from '../helpers.ts'
import { defineOutcome, fail, notApplicable, pass } from '../contract.ts'
import { orgArg, organization } from '../organizations.ts'
import { blastRadius as readBlast, caseLabels, diff as readDiff, edition as readEdition, notice, notices, noticeStatusLabels, packRow, validation as readValidation, adminOrganizations } from '../packs.ts'
import { report, run } from '../runs.ts'
import { S } from '../ui/surface.ts'

/**
 * Statements about editions and their rows (spec 02.5), the notices an
 * organization decides on (spec 02.7), and support access (specs 01.3, 01.5).
 */

const editionArg = z.string()
/** The backend's warning above the buttons once a base year exists; its absence is what case C1 reads (spec 02.7). */
const RECALCULATION_WARNING = 'Accepting raises a base-year recalculation candidate'
const holdsOne = (n: number) => `${n === 0 ? 'No organization holds' : n === 1 ? '1 organization holds' : `${n} organizations hold`} ${S.pack.text.holdsOne}`
const holdersLabel = (n: number) => (n === 0 ? S.pack.text.noOrganization : `${n} organization${n === 1 ? '' : 's'}`)

export const editionListed = defineOutcome({
  name: 'editionListed',
  args: z
    .object({
      edition: editionArg,
      status: z.enum(['DRAFT', 'PUBLISHED', 'SUPERSEDED', 'WITHDRAWN']).optional(),
      appliesFrom: z.string().optional(),
      rows: z.number().int().optional(),
      holders: z.number().int().optional(),
      evidence: z.boolean().optional(),
      supersedes: z.string().optional(),
    })
    .strict(),
  api: async (ctx, a) => {
    const e = await readEdition(await ctx.admin(), a.edition)
    if (a.status !== undefined && e.status !== a.status) return fail(`${a.edition} is ${e.status}`)
    if (a.appliesFrom !== undefined && e.appliesFrom !== a.appliesFrom) return fail(`${a.edition} applies from ${e.appliesFrom}`)
    if (a.rows !== undefined && e.rowCount !== a.rows) return fail(`${a.edition} has ${e.rowCount} rows`)
    if (a.holders !== undefined && e.holderCount !== a.holders) return fail(`${a.edition} is held by ${e.holderCount}`)
    if (a.evidence !== undefined && (e.evidenceChecksum !== null) !== a.evidence) return fail(`${a.edition} evidence checksum is ${e.evidenceChecksum}`)
    if (a.supersedes !== undefined && e.supersedesId !== a.supersedes) return fail(`${a.edition} supersedes ${e.supersedesId}`)
    return pass(`${a.edition}: ${e.status}`)
  },
  ui: (a) => [
    { check: 'at', nav: S.pack.nav.factorPacks },
    {
      check: 'rowHas',
      text: a.edition,
      cells: [...(a.status ? [a.status] : []), ...(a.appliesFrom ? [a.appliesFrom] : []), ...(a.rows !== undefined ? [String(a.rows)] : []), ...(a.holders !== undefined ? [holdersLabel(a.holders)] : [])],
    },
  ],
  narrate: (a) => {
    const parts = [`\`${a.edition}\` is listed`]
    if (a.status) parts.push(`as ${a.status}`)
    if (a.appliesFrom) parts.push(`applying from ${a.appliesFrom}`)
    if (a.rows !== undefined) parts.push(`with ${a.rows} rows`)
    if (a.holders !== undefined) parts.push(`held by "${holdersLabel(a.holders)}"`)
    if (a.evidence) parts.push('with its source document on file')
    if (a.supersedes) parts.push(`superseding \`${a.supersedes}\``)
    return parts.join(' ').replace(/ as (\w+) applying/, ' as $1, applying') + '.'
  },
})

export const editionAbsent = defineOutcome({
  name: 'editionAbsent',
  args: z.object({ edition: editionArg }).strict(),
  api: async (ctx, a) => {
    const out = await (await ctx.admin()).get(`/api/admin/factor-packs/editions/${encodeURIComponent(a.edition)}`)
    return out.status === 404 ? pass() : fail(`${a.edition} answers ${out.status}`)
  },
  ui: (a) => [{ check: 'at', nav: S.pack.nav.factorPacks }, { check: 'textAbsent', text: a.edition }],
  narrate: (a) => `\`${a.edition}\` is gone from the list.`,
})

export const packRowReads = defineOutcome({
  name: 'packRowReads',
  args: z.object({ edition: editionArg, code: z.string(), kgCo2ePerUnit: z.number().optional(), unit: z.string().optional(), dataYear: z.number().int().nullable().optional() }).strict(),
  api: async (ctx, a) => {
    const row = await packRow(await ctx.admin(), a.edition, a.code)
    if (a.kgCo2ePerUnit !== undefined && Number(row.kgCo2ePerUnit) !== a.kgCo2ePerUnit) return fail(`${a.code} reads ${row.kgCo2ePerUnit}`)
    if (a.unit !== undefined && row.unit !== a.unit) return fail(`${a.code} is per ${row.unit}`)
    if (a.dataYear !== undefined && (row.dataYear ?? null) !== a.dataYear) return fail(`${a.code} data year is ${row.dataYear}`)
    return pass(`${row.kgCo2ePerUnit} kg CO2e per ${row.unit}`)
  },
  ui: (a) => [
    { check: 'atEdition', edition: a.edition },
    { check: 'rowHas', text: a.code, cells: [...(a.kgCo2ePerUnit !== undefined ? [String(a.kgCo2ePerUnit)] : []), ...(a.unit ? [a.unit] : [])] },
  ],
  narrate: (a) => {
    const parts = [`On \`${a.edition}\`, \`${a.code}\` reads`]
    if (a.kgCo2ePerUnit !== undefined) parts.push(`${a.kgCo2ePerUnit}`)
    if (a.unit) parts.push(`per ${a.unit}`)
    if (a.dataYear !== undefined) parts.push(a.dataYear === null ? 'with no data year' : `with the data year ${a.dataYear}`)
    return parts.join(' ') + '.'
  },
})

/** The live validation report of a draft: every rule passing, or the findings named by rule and row. */
export const editionValidation = defineOutcome({
  name: 'editionValidation',
  args: z.object({ edition: editionArg, passes: z.boolean().optional(), findings: z.array(z.object({ rule: z.string(), code: z.string() }).strict()).optional() }).strict(),
  api: async (ctx, a) => {
    const findings = await readValidation(await ctx.admin(), a.edition)
    if (a.passes && findings.length > 0) return fail(`${findings.length} findings: ${findings.map((f) => `${f.rule} ${f.code}`).join(', ')}`)
    for (const want of a.findings ?? []) {
      if (!findings.some((f) => f.rule === want.rule && f.code === want.code)) return fail(`no ${want.rule} finding on ${want.code}; findings: ${findings.map((f) => `${f.rule} ${f.code}`).join(', ') || 'none'}`)
    }
    if (a.findings && findings.length !== a.findings.length) return fail(`${findings.length} findings, expected ${a.findings.length}`)
    return pass(`${findings.length} findings`)
  },
  ui: (a) => [
    { check: 'atEdition', edition: a.edition, tab: S.pack.tab.validation },
    ...(a.passes ? [{ check: 'textVisible', text: S.pack.text.everyRulePasses } as const] : []),
    ...(a.findings ?? []).map((f) => ({ check: 'textVisible', text: S.pack.rule[f.rule] ?? f.rule }) as const),
  ],
  narrate: (a) =>
    a.passes
      ? `**${S.pack.tab.validation}** reads "${S.pack.text.everyRulePasses}".`
      : `**${S.pack.tab.validation}** lists ${a.findings?.length ?? 0} findings on the row: ${(a.findings ?? []).map((f) => `"${S.pack.rule[f.rule] ?? f.rule}"`).join(', ')}.`,
})

/** The publication dialog's conditions as they stand: the document on file with its checksum, the approver who is the curator. */
export const publishGate = defineOutcome({
  name: 'publishGate',
  readsScreenFirst: true,
  args: z.object({ edition: editionArg, documentOnFile: z.boolean().optional(), curatorIsMe: z.boolean().optional(), noDocument: z.boolean().optional() }).strict(),
  api: async (ctx, a) => {
    const e = await readEdition(ctx.session(), a.edition)
    if (a.documentOnFile !== undefined && (e.evidenceChecksum !== null) !== a.documentOnFile) return fail(`${a.edition} evidence checksum is ${e.evidenceChecksum}`)
    if (a.noDocument && e.evidenceChecksum !== null) return fail(`${a.edition} has a source document on file`)
    if (a.curatorIsMe !== undefined) {
      const me = await ctx.session().get('/api/auth/me')
      const email = (me.body as { email?: string } | undefined)?.email ?? ''
      if ((e.curatorEmail?.toLowerCase() === email.toLowerCase()) !== a.curatorIsMe) return fail(`${a.edition} was curated by ${e.curatorEmail}`)
    }
    return pass()
  },
  ui: (a) => [
    ...(a.documentOnFile ? [{ check: 'textVisible', text: S.pack.text.checksum } as const] : []),
    ...(a.noDocument ? [{ check: 'textVisible', text: S.pack.text.noDocument } as const] : []),
    ...(a.curatorIsMe ? [{ check: 'textVisible', text: S.pack.text.curatorGate } as const] : []),
    ...(a.curatorIsMe || a.noDocument ? [{ check: 'buttonDisabled', button: S.pack.button.publish, within: `${S.pack.button.publish} ${a.edition}` } as const] : []),
  ],
  narrate: (a) => {
    const parts: string[] = []
    if (a.noDocument) parts.push(`the dialog "${S.pack.button.publish} ${a.edition}" lists the conditions and reads "${S.pack.text.noDocument}"`)
    if (a.documentOnFile) parts.push(`the dialog shows the document's SHA-256 "${S.pack.text.checksum}"`)
    if (a.curatorIsMe) parts.push(`the last condition reads not met, "${S.pack.text.curatorGate}"`)
    if (a.curatorIsMe || a.noDocument) parts.push(`**${S.pack.button.publish}** stays disabled`)
    return parts.join('; ').replace(/^./, (c) => c.toUpperCase()) + '.'
  },
})

export const blastRadius = defineOutcome({
  name: 'blastRadius',
  readsScreenFirst: true,
  args: z
    .object({
      edition: editionArg,
      rowsChanged: z.number().int().optional(),
      holders: z.number().int().optional(),
      row: z.object({ code: z.string(), from: z.number(), to: z.number(), percent: z.number() }).strict().optional(),
      organization: z.object({ name: z.string(), estimatedKgCo2eDelta: z.number().optional(), lastRun: z.string().optional(), lockedPeriod: z.string().optional() }).strict().optional(),
    })
    .strict(),
  api: async (ctx, a) => {
    const r = await readBlast(ctx.session(), a.edition)
    if (a.rowsChanged !== undefined && r.rowsChanged !== a.rowsChanged) return fail(`${r.rowsChanged} rows changed`)
    if (a.holders !== undefined && r.holderCount !== a.holders) return fail(`${r.holderCount} holders`)
    if (a.row) {
      const hit = r.rows.find((x) => x.code === a.row!.code)
      if (!hit) return fail(`no row ${a.row.code}; rows: ${r.rows.map((x) => x.code).join(', ')}`)
      if (Number(hit.oldKgCo2e) !== a.row.from || Number(hit.newKgCo2e) !== a.row.to) return fail(`${a.row.code} moves ${hit.oldKgCo2e} to ${hit.newKgCo2e}`)
      if (Math.abs(Number(hit.percentChange) - a.row.percent) > 0.005) return fail(`${a.row.code} moves ${hit.percentChange}%`)
    }
    if (a.organization) {
      const o = r.organizations.find((x) => x.organizationName === a.organization!.name)
      if (!o) return fail(`no card for ${a.organization.name}`)
      if (a.organization.estimatedKgCo2eDelta !== undefined && Math.abs(Number(o.estimatedKgCo2eDelta) - a.organization.estimatedKgCo2eDelta) > 1) return fail(`${o.organizationName} estimated movement ${o.estimatedKgCo2eDelta}`)
      if (a.organization.lastRun !== undefined && o.lastRunLabel !== a.organization.lastRun) return fail(`${o.organizationName} last run ${o.lastRunLabel}`)
      if (a.organization.lockedPeriod !== undefined && !o.lockedPeriods.some((p) => p.name === a.organization!.lockedPeriod)) return fail(`${o.organizationName} locked periods: ${o.lockedPeriods.map((p) => p.name).join(', ') || 'none'}`)
    }
    return pass()
  },
  ui: (a) => [
    ...(a.holders !== undefined ? [{ check: 'textVisible', text: holdsOne(a.holders) } as const] : []),
    ...(a.row ? [{ check: 'rowHas' as const, text: a.row.code, cells: [String(a.row.from), String(a.row.to), `${a.row.percent.toFixed(2)}%`] as string[] }] : []),
    ...(a.organization?.lastRun ? [{ check: 'textVisible', text: `(${a.organization.lastRun})` } as const] : []),
    ...(a.organization?.lockedPeriod ? [{ check: 'textVisible', text: S.pack.text.lockedPeriod } as const, { check: 'textVisible', text: a.organization.lockedPeriod } as const] : []),
  ],
  narrate: (a) => {
    const parts = ['A drawer says publishing changes no organization\'s data']
    const change = [a.rowsChanged !== undefined ? (a.rowsChanged === 1 ? 'One row changed' : `${a.rowsChanged} rows changed`) : '', a.row ? `\`${a.row.code}\` from ${a.row.from} to ${a.row.to}, ${a.row.percent.toFixed(2)}%` : ''].filter(Boolean)
    if (change.length) parts.push(change.join(', '))
    if (a.holders !== undefined) parts.push(`"${holdsOne(a.holders)}"`)
    if (a.organization) {
      const o = a.organization
      const bits: string[] = []
      if (o.estimatedKgCo2eDelta !== undefined) bits.push(`the estimated movement, about ${Math.round(o.estimatedKgCo2eDelta).toLocaleString('en-US')} kg CO₂e`)
      if (o.lastRun) bits.push(`from its last completed run (${o.lastRun})`)
      if (o.lockedPeriod) bits.push(`and lists the lineage inside a locked period (${o.lockedPeriod})`)
      parts.push(`${o.name}'s card names ${bits.join(' ')}`)
    }
    return parts.join('. ').replace(/\.\. /g, '. ') + '.'
  },
})

export const editionMetadata = defineOutcome({
  name: 'editionMetadata',
  args: z.object({ edition: editionArg, curator: actorArg.optional(), approver: actorArg.optional() }).strict(),
  api: async (ctx, a) => {
    const e = await readEdition(await ctx.admin(), a.edition)
    if (a.curator && e.curator !== account(ctx, a.curator).name) return fail(`curator is ${e.curator}`)
    if (a.approver && e.approver !== account(ctx, a.approver).name) return fail(`approver is ${e.approver}`)
    return pass()
  },
  ui: (a) => [
    { check: 'atEdition', edition: a.edition, tab: S.pack.tab.metadata },
    ...(a.curator ? [{ check: 'textVisible', text: `{name:${a.curator}}` } as const] : []),
    ...(a.approver ? [{ check: 'textVisible', text: `{name:${a.approver}}` } as const] : []),
  ],
  narrate: (a, n) => `The **${S.pack.tab.metadata}** tab names ${[a.curator ? `${n.actorName(a.curator)} as curator` : '', a.approver ? `${n.actorName(a.approver)} as approver` : ''].filter(Boolean).join(' and ')}.`,
})

// --- the organization's decision (spec 02.7) ---------------------------------

export const noticeListed = defineOutcome({
  name: 'noticeListed',
  args: z
    .object({
      organization: orgArg,
      edition: editionArg,
      status: z.enum(['OPEN', 'ACCEPTED', 'DECLINED', 'WITHDRAWN']).optional(),
      predecessor: z.string().optional(),
      rowsAffected: z.number().int().optional(),
      rowsOverThreshold: z.number().int().optional(),
      decidedBy: actorArg.optional(),
      withdrawalReason: z.string().optional(),
    })
    .strict(),
  api: async (ctx, a) => {
    const { notice: n } = await notice(ctx, a.organization, a.edition)
    if (a.status && n.status !== a.status) return fail(`the notice is ${n.status}`)
    if (a.predecessor && n.predecessorEditionId !== a.predecessor) return fail(`in place of ${n.predecessorEditionId}`)
    if (a.rowsAffected !== undefined && n.rowsAffected !== a.rowsAffected) return fail(`${n.rowsAffected} rows affected`)
    if (a.rowsOverThreshold !== undefined && n.rowsOverThreshold !== a.rowsOverThreshold) return fail(`${n.rowsOverThreshold} rows over the threshold`)
    if (a.decidedBy && n.decidedBy !== account(ctx, a.decidedBy).email) return fail(`decided by ${n.decidedBy}`)
    if (a.withdrawalReason && n.withdrawalReason !== a.withdrawalReason) return fail(`withdrawal reason "${n.withdrawalReason}"`)
    return pass(`${n.status}`)
  },
  ui: (a) => [
    { check: 'atOrg', organization: a.organization, section: S.pack.nav.updates },
    {
      check: 'rowHas',
      text: a.edition,
      cells: [
        ...(a.predecessor ? [`in place of ${a.predecessor}`] : []),
        ...(a.status ? [noticeStatusLabels[a.status]!] : []),
        ...(a.decidedBy ? [`by {email:${a.decidedBy}}`] : []),
        ...(a.withdrawalReason ? [a.withdrawalReason] : []),
      ],
    },
  ],
  narrate: (a, n) => {
    const parts = [`One row: \`${a.edition}\``]
    if (a.predecessor) parts.push(`in place of \`${a.predecessor}\``)
    if (a.rowsAffected !== undefined) parts.push(`${a.rowsAffected} row${a.rowsAffected === 1 ? '' : 's'} affected`)
    if (a.rowsOverThreshold !== undefined) parts.push(`${a.rowsOverThreshold} moving more than five percent`)
    if (a.status) parts.push(`status "${noticeStatusLabels[a.status]}"`)
    if (a.decidedBy) parts.push(`with ${n.actorAlias(a.decidedBy)}'s email`)
    if (a.withdrawalReason) parts.push(`with the reason "${a.withdrawalReason}"`)
    return parts.join(', ') + '.'
  },
})

/** The drawer behind a notice: what moves, the earlier periods, the base-year note, the block of a locked period. */
export const noticeDiff = defineOutcome({
  name: 'noticeDiff',
  readsScreenFirst: true,
  args: z
    .object({
      organization: orgArg,
      edition: editionArg,
      predecessor: z.string().optional(),
      appliesFrom: z.string().optional(),
      rows: z.number().int().optional(),
      row: z.object({ code: z.string(), current: z.number(), new: z.number(), percent: z.number() }).strict().optional(),
      earlierPeriodsInclude: z.array(z.string()).optional(),
      hasBaseYear: z.boolean().optional(),
      blockedBy: z.string().optional(),
    })
    .strict(),
  api: async (ctx, a) => {
    const { notice: n } = await notice(ctx, a.organization, a.edition)
    const d = await readDiff(ctx.session(), n.id)
    if (a.predecessor && d.predecessorEditionId !== a.predecessor) return fail(`predecessor ${d.predecessorEditionId}`)
    if (a.appliesFrom && d.appliesFrom !== a.appliesFrom) return fail(`applies from ${d.appliesFrom}`)
    if (a.rows !== undefined && d.rows.length !== a.rows) return fail(`${d.rows.length} lineages listed`)
    if (a.row) {
      const hit = d.rows.find((r) => r.code === a.row!.code)
      if (!hit) return fail(`no row ${a.row.code}`)
      if (Number(hit.currentKgCo2ePerUnit) !== a.row.current || Number(hit.newKgCo2ePerUnit) !== a.row.new) return fail(`${a.row.code} held ${hit.currentKgCo2ePerUnit}, edition ${hit.newKgCo2ePerUnit}`)
      if (Math.abs(Number(hit.percentChange) - a.row.percent) > 0.005) return fail(`${a.row.code} moves ${hit.percentChange}%`)
    }
    for (const name of a.earlierPeriodsInclude ?? []) if (!d.earlierPeriods.some((p) => p.name === name)) return fail(`earlier periods: ${d.earlierPeriods.map((p) => p.name).join(', ') || 'none'}`)
    if (a.hasBaseYear !== undefined && d.hasBaseYear !== a.hasBaseYear) return fail(`hasBaseYear is ${d.hasBaseYear}`)
    if (a.hasBaseYear === false && d.recalculationWarning) return fail(`the drawer warns "${d.recalculationWarning}"`)
    if (a.blockedBy !== undefined && d.lockedPeriod?.name !== a.blockedBy) return fail(`locked period ${d.lockedPeriod?.name ?? 'none'}`)
    if (!d.diffHash) return fail('no diff hash')
    return pass(d.diffHash.slice(0, 16))
  },
  ui: (a) => [
    ...(a.predecessor ? [{ check: 'textVisible', text: `in place of ${a.predecessor}` } as const] : []),
    ...(a.appliesFrom ? [{ check: 'textVisible', text: `applies from ${a.appliesFrom}` } as const] : []),
    ...(a.rows !== undefined ? [{ check: 'textVisible', text: `${S.pack.text.whatMoves} (${a.rows})` } as const] : []),
    ...(a.row ? [{ check: 'rowHas' as const, text: a.row.code, cells: [String(a.row.current), String(a.row.new), `${a.row.percent}%`] as string[] }] : []),
    ...(a.earlierPeriodsInclude?.length ? [{ check: 'textVisible', text: S.pack.text.earlierPeriods } as const, ...a.earlierPeriodsInclude.map((p) => ({ check: 'textVisible', text: `${p} (` }) as const)] : []),
    ...(a.hasBaseYear === false ? [{ check: 'textVisible', text: S.pack.text.noBaseYear } as const, { check: 'textAbsent', text: RECALCULATION_WARNING } as const] : []),
    ...(a.blockedBy ? [{ check: 'textVisible', text: `falls inside ${a.blockedBy}` } as const, { check: 'textVisible', text: S.pack.text.decliningStays } as const] : []),
    ...(a.rows !== undefined ? [{ check: 'textVisible', text: S.pack.text.diffHash } as const] : []),
  ],
  narrate: (a) => {
    const parts: string[] = []
    if (a.predecessor || a.appliesFrom) parts.push(`The drawer names the edition${a.predecessor ? `, the predecessor \`${a.predecessor}\`` : ''}${a.appliesFrom ? ` and the date it applies from, ${a.appliesFrom}` : ''}`)
    if (a.rows !== undefined) parts.push(`**${S.pack.text.whatMoves} (${a.rows})** lists every lineage the edition carries${a.row ? `: \`${a.row.code}\` held ${a.row.current}, edition ${a.row.new}, ${a.row.percent}%, with its estimated movement` : ''}`)
    if (a.earlierPeriodsInclude?.length) parts.push(`**${S.pack.text.earlierPeriods}** lists ${a.earlierPeriodsInclude.join(' and ')}: the coverage warnings that follow are what a vintage means`)
    if (a.hasBaseYear === false) parts.push(`"${S.pack.text.noBaseYear}", and no warning above the buttons contradicts it`)
    if (a.blockedBy) parts.push(`The drawer names the block above what moves: "falls inside ${a.blockedBy}" and "${S.pack.text.decliningStays}"`)
    if (a.rows !== undefined) parts.push('The last line prints the diff hash')
    return parts.join('. ') + '.'
  },
})

/** The three answers chapter 5 distinguishes, offered under the question. */
export const answersOffered = defineOutcome({
  name: 'answersOffered',
  readsScreenFirst: true,
  args: z.object({}).strict(),
  api: async () => notApplicable('the answers are the select\'s options'),
  ui: () => Object.values(caseLabels).map((text) => ({ check: 'optionListed', label: S.pack.field.answer, option: text }) as const),
  narrate: () => `The three answers under **${S.pack.field.answer}** are ${Object.values(caseLabels).map((t) => `"${t}"`).join(', ')}.`,
})

export const updatesBadge = defineOutcome({
  name: 'updatesBadge',
  args: z.object({ organization: orgArg, count: z.number().int() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const open = (await notices(ctx.session(), org.id)).filter((n) => n.status === 'OPEN').length
    return open === a.count ? pass(String(open)) : fail(`${open} open notices`)
  },
  ui: (a) => [
    { check: 'atOrg', organization: a.organization, section: S.org.sections.overview },
    a.count > 0 ? { check: 'textVisible', text: `${a.count} ${S.pack.text.updateWaiting}${a.count === 1 ? '' : 's'} waiting` } : { check: 'textAbsent', text: `${S.pack.text.updateWaiting}` },
  ],
  narrate: (a) => (a.count > 0 ? `**${S.pack.nav.updates}** carries the badge ${a.count}, titled "${a.count} ${S.pack.text.updateWaiting}${a.count === 1 ? '' : 's'} waiting".` : `The badge on **${S.pack.nav.updates}** is gone.`),
})

/** The report's factor table cites the edition and the vintage each factor was applied from (spec 02.6). */
export const reportCites = defineOutcome({
  name: 'reportCites',
  args: z.object({ organization: orgArg, inventory: z.string(), run: z.union([z.string(), z.number().int()]), factor: z.string(), edition: editionArg, from: z.string().optional() }).strict(),
  api: async (ctx, a) => {
    const { run: r } = await run(ctx, a.organization, a.inventory, a.run)
    const rows = (await report(ctx.session(), r.id)).factors
    const hit = rows.find((f) => f.name === a.factor)
    if (!hit) return fail(`no factor "${a.factor}" on the report; factors: ${rows.map((f) => f.name).join(', ')}`)
    if (hit.sourceEdition !== a.edition) return fail(`"${a.factor}" cites ${hit.sourceEdition ?? 'no edition'}`)
    if (a.from !== undefined && hit.validFrom !== a.from) return fail(`"${a.factor}" is applied from ${hit.validFrom}`)
    return pass(`${hit.sourceEdition}, from ${hit.validFrom}`)
  },
  ui: () => [{ check: 'na', why: 'the edition and the vintage are printed in the PDF\'s factor table, which the browser downloads' }],
  narrate: (a) => `The factor table cites \`${a.edition}\`${a.from ? ` from ${a.from}` : ''} on the "${a.factor}" row.`,
})

// --- support access (specs 01.3, 01.5) ----------------------------------------

/** The organization is not in the reader's own list under GHG accounting: an outsider, whatever their platform role. */
export const organizationNotListed = defineOutcome({
  name: 'organizationNotListed',
  args: z.object({ organization: orgArg }).strict(),
  api: async (ctx, a) => {
    const out = await ctx.session().get('/api/ghg/organizations')
    if (!out.ok) return fail(`GET /api/ghg/organizations answered ${out.status}`)
    const name = a.organization.replace(/ #\d+$/, '')
    return (out.body as Array<{ name: string }>).some((o) => o.name === name) ? fail(`${name} is listed`) : pass()
  },
  ui: (a) => [{ check: 'at', nav: S.nav.ghg }, { check: 'textAbsent', text: a.organization.replace(/ #\d+$/, '') }],
  narrate: (a) => `${a.organization.replace(/ #\d+$/, '')} is not listed under **${S.nav.ghg}**.`,
})

export const supportAccess = defineOutcome({
  name: 'supportAccess',
  args: z.object({ organization: orgArg, active: z.boolean(), reason: z.string().optional() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const row = (await adminOrganizations(ctx.session())).find((o) => o.id === org.id)
    if (!row) return fail(`${a.organization} is not listed`)
    if ((row.supportAccess !== null) !== a.active) return fail(`support access is ${row.supportAccess ? `held until ${row.supportAccess.expiresAt}` : 'not held'}`)
    if (a.reason && row.supportAccess?.reason !== a.reason) return fail(`reason "${row.supportAccess?.reason}"`)
    return pass()
  },
  ui: (a) => [
    { check: 'at', nav: S.pack.nav.organizations },
    { check: 'rowHas', text: a.organization, cells: a.active ? ['Until', ...(a.reason ? [a.reason] : []), S.pack.button.endAccess] : [S.pack.button.assumeAccess] },
  ],
  narrate: (a) => (a.active ? `The row shows the expiry and **${S.pack.button.endAccess}**.` : `The row offers **${S.pack.button.assumeAccess}** again: the grant is ended.`),
})

export const packOutcomes = [editionListed, editionAbsent, packRowReads, editionValidation, publishGate, blastRadius, editionMetadata, noticeListed, noticeDiff, answersOffered, updatesBadge, reportCites, organizationNotListed, supportAccess]
