import { z } from 'zod'
import { defineVerb, type ApiOutcome } from '../contract.ts'
import { inventory } from '../inventories.ts'
import { factor, orgArg, organization } from '../organizations.ts'
import { run } from '../runs.ts'
import { baseYear, candidate } from '../baseYear.ts'
import { S } from '../ui/surface.ts'

/**
 * The base year, its policy and its recalculation candidates (specs 06,
 * 06.1), and the two deletions the organization's record governs: a factor
 * never applied (spec 02.11) and the organization itself (spec 01.3).
 */

const formOnly = (why: string): ApiOutcome => ({ status: 0, ok: true, na: why })
const base = (orgId: string) => `/api/ghg/organizations/${orgId}/base-year`

export const designateBaseYear = defineVerb({
  name: 'designateBaseYear',
  args: z
    .object({ organization: orgArg, inventory: z.string(), threshold: z.number(), reason: z.string(), convention: z.enum(['TRANSACTION_DATE', 'WHOLE_YEAR']).default('TRANSACTION_DATE') })
    .strict(),
  api: async (ctx, a) => {
    const { org, inv } = await inventory(ctx, a.organization, a.inventory)
    return ctx.session().put(base(org.id), { inventoryId: inv.id, thresholdPercent: a.threshold, reason: a.reason, structuralChangeConvention: a.convention })
  },
  ui: (a) => [
    { op: 'orgPage', organization: a.organization, section: S.base.section },
    { op: 'choose', label: S.base.field.inventory, option: `{inventoryId:${a.organization}|${a.inventory}}`, byValue: true },
    { op: 'fill', label: S.base.field.threshold, value: String(a.threshold) },
    { op: 'fill', label: S.base.field.reason, value: a.reason },
    { op: 'choose', label: S.base.field.convention, option: S.base.option.convention[a.convention]! },
    { op: 'click', button: S.base.button.designate },
  ],
  postconditions: (a) => [{ outcome: 'baseYearReads', args: { organization: a.organization, inventory: a.inventory, threshold: a.threshold, reason: a.reason, convention: a.convention } }],
  narrate: (a) =>
    `Open **${S.org.sections.settings}** and the **${S.base.section}** tab. Choose ${a.inventory}, significance threshold ${a.threshold}, the reason "${a.reason}", and **${S.base.option.convention[a.convention]}**. Click **${S.base.button.designate}**.`,
})

export const raiseCandidate = defineVerb({
  name: 'raiseCandidate',
  args: z.object({ organization: orgArg, trigger: z.enum(['METHODOLOGY_CHANGE', 'ERROR_CORRECTION']), reason: z.string(), affectedPercent: z.number().optional(), comparisonRun: z.string().optional() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    let comparisonRunId: string | null = null
    if (a.comparisonRun) {
      const by = await baseYear(ctx.session(), org.id)
      if (by) comparisonRunId = (await run(ctx, a.organization, by.inventoryName, a.comparisonRun)).run.id
    }
    return ctx.session().post(`${base(org.id)}/recalculations`, { trigger: a.trigger, reason: a.reason, affectedPercent: a.affectedPercent ?? null, comparisonRunId })
  },
  ui: (a) => [
    { op: 'orgPage', organization: a.organization, section: S.base.section },
    { op: 'click', button: S.base.button.raise },
    { op: 'choose', label: S.base.field.trigger, option: S.base.option.trigger[a.trigger]!, within: S.base.dialog.raise },
    { op: 'fill', label: S.base.field.whatChanged, value: a.reason, within: S.base.dialog.raise },
    ...(a.affectedPercent !== undefined ? [{ op: 'fill', label: S.base.field.share, value: String(a.affectedPercent), within: S.base.dialog.raise } as const] : []),
    { op: 'click', button: S.base.button.raiseConfirm, within: S.base.dialog.raise },
  ],
  postconditions: () => [],
  narrate: (a) =>
    `Click **${S.base.button.raise}**: trigger **${S.base.option.trigger[a.trigger]}**, what changed "${a.reason}"${a.affectedPercent !== undefined ? `, affected share ${a.affectedPercent}` : ', no share'}${a.comparisonRun ? `, comparison run ${a.comparisonRun}` : ', no comparison run'}. Submit.`,
})

/** Records a run of the base-year inventory as the recalculated base; without a run, only opens the dialog to read its list. */
export const recordRecalculatedBase = defineVerb({
  name: 'recordRecalculatedBase',
  args: z.object({ organization: orgArg, candidate: z.string(), run: z.string().optional(), note: z.string().optional() }).strict(),
  api: async (ctx, a) => {
    if (!a.run) return formOnly('the dialog lists the runs offered and sends nothing until one is chosen')
    const org = await organization(ctx, a.organization)
    const { baseYear: by, candidate: c } = await candidate(ctx, a.organization, a.candidate)
    const chosen = await run(ctx, a.organization, by.inventoryName, a.run)
    return ctx.session().post(`${base(org.id)}/recalculations/${c.id}/decide`, { decision: 'RECALCULATED', runId: chosen.run.id, note: a.note ?? null })
  },
  ui: (a) => [
    { op: 'orgPage', organization: a.organization, section: S.base.section },
    { op: 'row', text: a.candidate, button: S.base.button.recordBase },
    ...(a.run ? [{ op: 'choose', label: S.base.field.baseRun, option: `${a.run} ·`, within: S.base.dialog.record, prefix: true } as const, { op: 'click', button: S.base.button.record, within: S.base.dialog.record } as const] : []),
  ],
  postconditions: () => [],
  narrate: (a) =>
    a.run
      ? `Pick "${a.run}" under **${S.base.field.baseRun}** and confirm with **${S.base.button.record}**.`
      : `On the flagged candidate click **${S.base.button.recordBase}** and read the list under **${S.base.field.baseRun}**.`,
})

export const declineCandidate = defineVerb({
  name: 'declineCandidate',
  args: z.object({ organization: orgArg, candidate: z.string(), note: z.string().optional() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const { candidate: c } = await candidate(ctx, a.organization, a.candidate)
    return ctx.session().post(`${base(org.id)}/recalculations/${c.id}/decide`, { decision: 'DECLINED', runId: null, note: a.note ?? null })
  },
  ui: (a) => [
    { op: 'orgPage', organization: a.organization, section: S.base.section },
    { op: 'row', text: a.candidate, button: S.base.button.decline },
    ...(a.note ? [{ op: 'fill', label: S.base.field.note, value: a.note, within: S.base.dialog.decline } as const] : []),
    { op: 'click', button: S.base.button.decline, within: S.base.dialog.decline },
  ],
  postconditions: () => [],
  narrate: (a) => `Click **${S.base.button.decline}** on it${a.note ? ` with the note "${a.note}"` : ''} and confirm.`,
})

export const deleteFactor = defineVerb({
  name: 'deleteFactor',
  args: z.object({ organization: orgArg, factor: z.string() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const row = await factor(ctx.session(), org.id, a.factor)
    return ctx.session().delete(`/api/ghg/emission-factors/${row.id}`)
  },
  ui: (a) => [
    { op: 'orgPage', organization: a.organization, section: S.org.sections.factors },
    { op: 'fill', label: S.org.field.searchFactors, value: a.factor },
    // the button reads Delete; its accessible name is "Delete factor <name>"
    { op: 'row', text: a.factor, button: S.base.button.deleteFactor },
  ],
  postconditions: (a) => [{ outcome: 'factorAbsent', args: { organization: a.organization, name: a.factor } }],
  narrate: (a) => `On **${S.org.sections.factors}**, click **${S.base.button.delete}** on "${a.factor}".`,
})

/** The deletion dialog opened on an organization whose record stands: it lists the blockers and offers no confirmation. */
export const tryDeleteOrganization = defineVerb({
  name: 'tryDeleteOrganization',
  args: z.object({ organization: orgArg, reason: z.string() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    return ctx.session().delete(`/api/ghg/organizations/${org.id}`, { name: org.name, reason: a.reason })
  },
  ui: (a) => [
    { op: 'orgPage', organization: a.organization, section: S.org.sections.settings },
    { op: 'click', button: S.org.button.deleteOrganization },
  ],
  postconditions: () => [],
  narrate: () => `Open **${S.org.sections.settings}**, and under **Danger zone** click **${S.org.button.deleteOrganization}**.`,
})

export const baseYearVerbs = [designateBaseYear, raiseCandidate, recordRecalculatedBase, declineCandidate, deleteFactor, tryDeleteOrganization]
