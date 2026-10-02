import { z } from 'zod'
import { baseYear as readBaseYear, candidate as findCandidate } from '../baseYear.ts'
import { defineOutcome, fail, pass } from '../contract.ts'
import { account, actorArg } from '../helpers.ts'
import { orgArg, organization, searchFactors } from '../organizations.ts'
import { report, run, runs } from '../runs.ts'
import { S } from '../ui/surface.ts'

/** Statements about the base year, its candidates and the record (specs 06, 06.1, 01.3, 02.11). */

const invArgs = { organization: orgArg, inventory: z.string() }
const tonnes = (kg: number) => `${(kg / 1000).toLocaleString('en-US', { maximumFractionDigits: 2 })} t CO₂e`

export const baseYearReads = defineOutcome({
  name: 'baseYearReads',
  args: z
    .object({ ...invArgs, year: z.number().int().optional(), threshold: z.number().optional(), reason: z.string().optional(), convention: z.enum(['TRANSACTION_DATE', 'WHOLE_YEAR']).optional(), baseRun: z.string().optional(), baseRunKgCo2e: z.number().optional() })
    .strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const by = await readBaseYear(ctx.session(), org.id)
    if (!by) return fail('no base year is designated')
    if (by.inventoryName !== a.inventory) return fail(`the base year is ${by.inventoryName}`)
    if (a.year !== undefined && by.year !== a.year) return fail(`the base year is ${by.year}`)
    if (a.threshold !== undefined && Number(by.thresholdPercent) !== a.threshold) return fail(`threshold ${by.thresholdPercent}%`)
    if (a.reason !== undefined && by.reason !== a.reason) return fail(`reason "${by.reason}"`)
    if (a.convention !== undefined && by.structuralChangeConvention !== a.convention) return fail(`convention ${by.structuralChangeConvention}`)
    if (a.baseRun !== undefined) {
      const all = await runs(ctx.session(), by.inventoryId)
      const hit = all.find((r) => r.id === by.baseRunId)
      if (!hit) return fail('no base-year run')
      if (hit.label !== a.baseRun) return fail(`established by ${hit.label}`)
      if (a.baseRunKgCo2e !== undefined && Math.abs(Number(hit.totalKgCo2e) - a.baseRunKgCo2e) > 0.01) return fail(`${hit.label} totals ${hit.totalKgCo2e}`)
    }
    return pass(`${by.year}`)
  },
  ui: (a) => [
    { check: 'atOrg', organization: a.organization, section: S.base.section },
    ...(a.year !== undefined ? [{ check: 'textVisible', text: String(a.year) } as const] : []),
    ...(a.threshold !== undefined ? [{ check: 'textVisible', text: `${a.threshold}% ${S.base.text.ofBaseYear}` } as const] : []),
    ...(a.reason ? [{ check: 'textVisible', text: a.reason } as const] : []),
    ...(a.convention ? [{ check: 'textVisible', text: S.base.option.convention[a.convention]! } as const] : []),
    ...(a.baseRun ? [{ check: 'textVisible', text: `${S.base.text.baseRun} ${a.baseRun}${a.baseRunKgCo2e !== undefined ? ` · ${tonnes(a.baseRunKgCo2e)}` : ''}` } as const] : []),
  ],
  narrate: (a) => {
    const parts: string[] = []
    if (a.year !== undefined || a.reason || a.threshold !== undefined || a.convention) parts.push(`The page shows ${[a.year !== undefined ? `the year ${a.year}` : 'the year', a.reason ? `the reason "${a.reason}"` : '', a.threshold !== undefined ? `"${a.threshold}% ${S.base.text.ofBaseYear}"` : '', a.convention ? `the convention **${S.base.option.convention[a.convention]}**` : ''].filter(Boolean).join(', ')}`)
    if (a.baseRun) parts.push(`**Established by** reads "${S.base.text.baseRun} ${a.baseRun}${a.baseRunKgCo2e !== undefined ? ` · ${tonnes(a.baseRunKgCo2e)}` : ''}", the final run of the published inventory`)
    return parts.join('. ') + '.'
  },
})

export const noBaseYear = defineOutcome({
  name: 'noBaseYear',
  args: z.object({ organization: orgArg }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    return (await readBaseYear(ctx.session(), org.id)) ? fail('a base year is designated') : pass()
  },
  ui: (a) => [{ check: 'atOrg', organization: a.organization, section: S.base.section }, { check: 'textVisible', text: S.base.text.none }],
  narrate: () => `No candidate is raised: "${S.base.text.none}"`,
})

/** One recalculation candidate, found by a part of its reason. */
export const candidateListed = defineOutcome({
  name: 'candidateListed',
  args: z
    .object({
      organization: orgArg,
      containing: z.string(),
      status: z.enum(['FLAGGED', 'RECALCULATED', 'DECLINED', 'SUPERSEDED']).optional(),
      boundaryVersion: z.number().int().optional(),
      affectedPercent: z.number().optional(),
      aboveThreshold: z.boolean().optional(),
      decidedBy: actorArg.optional(),
      note: z.string().optional(),
      baseRun: z.string().optional(),
    })
    .strict(),
  api: async (ctx, a) => {
    const { baseYear: by, candidate: c } = await findCandidate(ctx, a.organization, a.containing)
    if (a.status && c.status !== a.status) return fail(`the candidate is ${c.status}`)
    if (a.boundaryVersion !== undefined && c.boundaryVersionNo !== a.boundaryVersion) return fail(`against boundary v${c.boundaryVersionNo}`)
    if (a.affectedPercent !== undefined && Number(c.affectedPercent) !== a.affectedPercent) return fail(`${c.affectedPercent}% affected`)
    if (a.aboveThreshold !== undefined && c.aboveThreshold !== a.aboveThreshold) return fail(`aboveThreshold is ${c.aboveThreshold}`)
    if (a.decidedBy && c.decidedBy !== account(ctx, a.decidedBy).email) return fail(`decided by ${c.decidedBy}`)
    if (a.note !== undefined && c.decisionNote !== a.note) return fail(`note "${c.decisionNote}"`)
    if (a.baseRun !== undefined) {
      const hit = (await runs(ctx.session(), by.inventoryId)).find((r) => r.id === c.runId)
      if (hit?.label !== a.baseRun) return fail(`recalculated base ${hit?.label ?? 'none'}`)
    }
    return pass(`${c.status}: ${c.reason}`)
  },
  ui: (a) => [
    { check: 'atOrg', organization: a.organization, section: S.base.section },
    {
      check: 'rowHas',
      text: a.containing,
      cells: [
        ...(a.status ? [a.status] : []),
        ...(a.boundaryVersion !== undefined ? [`boundary v${a.boundaryVersion}`] : []),
        ...(a.affectedPercent !== undefined ? [`${a.affectedPercent}% ${S.base.text.ofBaseYear}`] : []),
        ...(a.decidedBy ? [`{email:${a.decidedBy}}`] : []),
        ...(a.note ? [a.note] : []),
        ...(a.baseRun ? [`${S.base.text.recalculatedBase} ${a.baseRun}`] : []),
      ],
    },
  ],
  narrate: (a, n) => {
    const parts = [`${a.status ? `A ${a.status} candidate` : 'The candidate'}${a.boundaryVersion !== undefined ? ` against boundary version ${a.boundaryVersion}` : ''} reads "${a.containing}"`]
    if (a.decidedBy) parts.push(`with ${n.actorAlias(a.decidedBy)}`)
    if (a.note) parts.push(`and the note "${a.note}"`)
    if (a.baseRun) parts.push(`and "${S.base.text.recalculatedBase} ${a.baseRun}"`)
    return parts.join(' ') + '.'
  },
})

/** The runs the recalculated-base dialog offers: the base-year inventory's, and never a voided one (spec 05.2). */
export const recalculationRunsOffered = defineOutcome({
  name: 'recalculationRunsOffered',
  readsScreenFirst: true,
  args: z.object({ organization: orgArg, offered: z.array(z.string()), notOffered: z.array(z.string()).optional() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const by = await readBaseYear(ctx.session(), org.id)
    if (!by) return fail('no base year')
    const all = await runs(ctx.session(), by.inventoryId)
    for (const label of a.offered) {
      const hit = all.find((r) => r.label === label)
      if (!hit || hit.voided) return fail(`${label} is ${hit ? 'voided' : 'not a run of the base-year inventory'}`)
    }
    for (const label of a.notOffered ?? []) {
      const hit = all.find((r) => r.label === label)
      if (hit && !hit.voided) return fail(`${label} is a live run of the base-year inventory`)
    }
    return pass()
  },
  ui: (a) => [
    ...a.offered.map((label) => ({ check: 'optionListed', label: S.base.field.baseRun, option: `${label} ·` }) as const),
    ...(a.notOffered ?? []).map((label) => ({ check: 'optionListed', label: S.base.field.baseRun, option: `${label} ·`, absent: true }) as const),
  ],
  narrate: (a) => `Only the base-year inventory's runs are offered, each with its total (${a.offered.join(', ')})${a.notOffered?.length ? `, and not ${a.notOffered.join(', ')}: a voided run must not be relied on, so it cannot be the recalculated base` : ''}.`,
})

export const reportBaseYearGwp = defineOutcome({
  name: 'reportBaseYearGwp',
  args: z.object({ ...invArgs, run: z.union([z.string(), z.number().int()]), matches: z.boolean() }).strict(),
  api: async (ctx, a) => {
    const { run: r } = await run(ctx, a.organization, a.inventory, a.run)
    const rep = await report(ctx.session(), r.id)
    const section = (rep as unknown as { baseYear: { gwpSetMatches: boolean } | null }).baseYear
    if (!section) return fail('the report has no base-year section')
    return section.gwpSetMatches === a.matches ? pass() : fail(`gwpSetMatches is ${section.gwpSetMatches}`)
  },
  ui: (a) => [{ check: 'atRun', organization: a.organization, inventory: a.inventory, run: String(a.run) }, a.matches ? { check: 'textAbsent', text: S.base.text.differentGwp } : { check: 'textVisible', text: S.base.text.differentGwp }],
  narrate: (a) => (a.matches ? 'The base-year section no longer flags the GWP set.' : `The base-year section reads "${S.base.text.differentGwp}; the required-gases amendment recommends the same set for both."`),
})

/** The deletion dialog on an organization whose record stands: the blockers, named, and the refusal. */
export const deletionBlocked = defineOutcome({
  name: 'deletionBlocked',
  expectsRefusal: true,
  args: z.object({ organization: orgArg, records: z.array(z.string()) }).strict(),
  api: async (_ctx, a, last) => {
    if (!last) return fail('no deletion to be refused')
    if (last.ok) return fail(`the deletion went through (${last.status})`)
    if (last.rule !== 'ghg.organization.has-records') return fail(`refused by ${last.rule ?? 'an unnamed rule'}`)
    const blockers = ((last.body as { blockingInventories?: Array<{ name: string; status: string }> })?.blockingInventories ?? []).map((b) => `${b.name}: ${b.status}`)
    for (const r of a.records) if (!blockers.some((b) => b.toLowerCase() === r.toLowerCase())) return fail(`blockers: ${blockers.join(', ')}`)
    return pass(blockers.join(', '))
  },
  ui: (a) => [...a.records.map((r) => ({ check: 'textVisible', text: r }) as const), { check: 'textVisible', text: S.base.text.recordsKept }],
  narrate: (a) => `The dialog lists ${a.records.map((r) => `"${r}"`).join(', ')} and refuses: "${S.base.text.recordsKept}: withdraw the final designation or supersede the published inventory first.".`,
})

export const factorAbsent = defineOutcome({
  name: 'factorAbsent',
  args: z.object({ organization: orgArg, name: z.string() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    return (await searchFactors(ctx.session(), org.id, a.name)).some((f) => f.name === a.name) ? fail(`"${a.name}" is still listed`) : pass()
  },
  ui: (a) => [
    { check: 'atOrg', organization: a.organization, section: S.org.sections.factors },
    { check: 'search', label: S.org.field.searchFactors, value: a.name },
    { check: 'rowAbsent', text: a.name },
  ],
  narrate: (a) => `"${a.name}" is deleted: no classification and no run ever applied it.`,
})

export const baseYearOutcomes = [baseYearReads, noBaseYear, candidateListed, recalculationRunsOffered, reportBaseYearGwp, deletionBlocked, factorAbsent]
