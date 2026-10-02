import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { REPO_ROOT } from '../../load.ts'
import { defineVerb } from '../contract.ts'
import { activity, facility, orgArg, organization } from '../organizations.ts'
import { S } from '../ui/surface.ts'

/** Activity data: the CSV import, drafts, corrections, evidence and removals (specs 04.4, 04.5, 04.6). */

export function fixture(name: string): { name: string; buffer: Buffer; mimeType: string } {
  const path = join(REPO_ROOT, 'docs', 'qa', 'governance', 'fixtures', name)
  const mimeType = name.endsWith('.csv') ? 'text/csv' : name.endsWith('.txt') ? 'text/plain' : name.endsWith('.zip') ? 'application/zip' : 'application/octet-stream'
  return { name, buffer: readFileSync(path), mimeType }
}

export const previewImport = defineVerb({
  name: 'previewImport',
  args: z.object({ organization: orgArg, file: z.string() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    return ctx.session().upload(`/api/ghg/organizations/${org.id}/activities/import`, fixture(a.file), { dryRun: 'true' })
  },
  ui: (a) => [
    { op: 'orgPage', organization: a.organization, section: S.org.sections.activity },
    { op: 'click', button: S.act.button.importCsv },
    { op: 'upload', label: S.act.field.csvFile, fixture: a.file, within: S.act.dialog.import },
  ],
  postconditions: () => [],
  narrate: (a) => `Click **${S.act.button.importCsv}** and choose \`${a.file}\`.`,
})

export const importActivities = defineVerb({
  name: 'importActivities',
  args: z.object({ organization: orgArg, file: z.string() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    return ctx.session().upload(`/api/ghg/organizations/${org.id}/activities/import`, fixture(a.file))
  },
  ui: (a) => [
    { op: 'orgPage', organization: a.organization, section: S.org.sections.activity },
    { op: 'click', button: S.act.button.importCsv },
    { op: 'upload', label: S.act.field.csvFile, fixture: a.file, within: S.act.dialog.import },
    { op: 'click', button: S.act.button.addRecords, within: S.act.dialog.import },
  ],
  postconditions: () => [],
  narrate: (a) => `Click **${S.act.button.importCsv}**, choose \`${a.file}\` and click **${S.act.button.addRecords}**.`,
})

export const addActivityDraft = defineVerb({
  name: 'addActivityDraft',
  args: z.object({ organization: orgArg, facility: z.string(), activityType: z.string() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const site = await facility(ctx.session(), org.id, a.facility)
    return ctx.session().post(`/api/ghg/organizations/${org.id}/activities`, {
      draft: true,
      facilityId: site.id,
      activityType: a.activityType,
      dataQuality: 'MEASURED',
    })
  },
  ui: (a) => [
    { op: 'orgPage', organization: a.organization, section: S.org.sections.activity },
    { op: 'click', button: S.act.button.addActivity },
    { op: 'fill', label: S.act.field.activityType, value: a.activityType },
    { op: 'choose', label: S.act.field.facility, option: `{facilityId:${a.organization}|${a.facility}}`, byValue: true },
    { op: 'click', button: S.act.button.saveDraft },
  ],
  postconditions: (a) => [{ outcome: 'activityExists', args: { organization: a.organization, record: a.activityType, draft: true } }],
  narrate: (a) => `Click **${S.act.button.addActivity}**, type the activity type "${a.activityType}", the facility ${a.facility}, nothing else, and click **${S.act.button.saveDraft}**.`,
})

/** The record's facts as the drawer sends them back, with what the step changes. */
async function correction(ctx: Parameters<typeof addActivityDraft.api>[0], orgRef: string, record: string, changes: Record<string, unknown>) {
  const org = await organization(ctx, orgRef)
  const row = await activity(ctx.session(), org.id, record)
  return ctx.session().put(`/api/ghg/activities/${row.id}`, {
    draft: false,
    facilityId: row.facilityId,
    streamId: row.streamId,
    activityType: row.activityType,
    quantity: row.quantity,
    unit: row.unit,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    dataSource: row.dataSource,
    evidenceRef: row.evidenceRef,
    dataQuality: row.dataQuality,
    note: row.note,
    dataQualityTier: row.dataQualityTier,
    uncertaintyPercent: row.uncertaintyPercent,
    ...changes,
  })
}

export const enterActivity = defineVerb({
  name: 'enterActivity',
  args: z.object({ organization: orgArg, record: z.string(), quantity: z.number(), unit: z.string(), periodStart: z.string(), periodEnd: z.string() }).strict(),
  api: (ctx, a) => correction(ctx, a.organization, a.record, { quantity: a.quantity, unit: a.unit, periodStart: a.periodStart, periodEnd: a.periodEnd }),
  ui: (a) => [
    { op: 'orgPage', organization: a.organization, section: S.org.sections.activity },
    { op: 'openRow', text: a.record },
    { op: 'fill', label: S.act.field.quantity, value: String(a.quantity) },
    { op: 'choose', label: S.org.field.unit, option: a.unit, byValue: true },
    { op: 'fill', label: S.act.field.periodStart, value: a.periodStart },
    { op: 'fill', label: S.act.field.periodEnd, value: a.periodEnd },
    { op: 'click', button: S.act.button.save },
  ],
  postconditions: (a) => [
    { outcome: 'activityExists', args: { organization: a.organization, record: a.record, draft: false, quantity: a.quantity, unit: a.unit } },
    { outcome: 'activityHistoryHas', args: { organization: a.organization, record: a.record, kind: 'ENTERED' } },
  ],
  narrate: (a) => `Open the draft "${a.record}", type ${a.quantity} ${a.unit} and the period ${a.periodStart} to ${a.periodEnd}, and save it as a fact.`,
})

export const correctActivity = defineVerb({
  name: 'correctActivity',
  args: z.object({ organization: orgArg, record: z.string(), quantity: z.number().optional(), evidenceRef: z.string().optional(), reason: z.string() }).strict(),
  api: (ctx, a) =>
    correction(ctx, a.organization, a.record, {
      ...(a.quantity !== undefined ? { quantity: a.quantity } : {}),
      ...(a.evidenceRef !== undefined ? { evidenceRef: a.evidenceRef } : {}),
      reason: a.reason,
    }),
  ui: (a) => [
    { op: 'orgPage', organization: a.organization, section: S.org.sections.activity },
    { op: 'openRow', text: a.record },
    ...(a.quantity !== undefined ? [{ op: 'fill', label: S.act.field.quantity, value: String(a.quantity) } as const] : []),
    ...(a.evidenceRef !== undefined ? [{ op: 'fill', label: S.act.field.documentReference, value: a.evidenceRef } as const] : []),
    { op: 'fill', label: S.act.field.reason, value: a.reason },
    { op: 'click', button: S.act.button.save },
  ],
  postconditions: (a) => [
    ...(a.quantity !== undefined ? [{ outcome: 'activityExists', args: { organization: a.organization, record: a.record, quantity: a.quantity } }] : []),
    { outcome: 'activityHistoryHas', args: { organization: a.organization, record: a.record, kind: 'CORRECTED', reason: a.reason } },
  ],
  narrate: (a) =>
    a.quantity !== undefined
      ? `Open ${a.record}, change the quantity to ${a.quantity}, and save with the reason "${a.reason}".`
      : `Open ${a.record}, type the document reference "${a.evidenceRef}", and give the reason "${a.reason}". Save.`,
})

export const attachFile = defineVerb({
  name: 'attachFile',
  args: z.object({ organization: orgArg, record: z.string(), file: z.string() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const row = await activity(ctx.session(), org.id, a.record)
    return ctx.session().upload(`/api/ghg/activities/${row.id}/evidence`, fixture(a.file))
  },
  ui: (a) => [
    { op: 'orgPage', organization: a.organization, section: S.org.sections.activity },
    { op: 'openRow', text: a.record },
    { op: 'tab', name: S.act.tab.evidence },
    { op: 'upload', label: S.act.field.attachFile, fixture: a.file },
  ],
  postconditions: (a) => [{ outcome: 'evidenceListed', args: { organization: a.organization, record: a.record, name: a.file, kind: 'FILE' } }],
  narrate: (a) => `On ${a.record}, under **${S.act.text.supportingEvidence}**, attach \`${a.file}\`.`,
})

export const attachLink = defineVerb({
  name: 'attachLink',
  args: z.object({ organization: orgArg, record: z.string(), name: z.string(), url: z.string() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const row = await activity(ctx.session(), org.id, a.record)
    return ctx.session().post(`/api/ghg/activities/${row.id}/evidence/links`, { name: a.name, url: a.url })
  },
  ui: (a) => [
    { op: 'orgPage', organization: a.organization, section: S.org.sections.activity },
    { op: 'openRow', text: a.record },
    { op: 'tab', name: S.act.tab.evidence },
    { op: 'fill', label: S.act.field.linkName, value: a.name },
    { op: 'fill', label: S.act.field.url, value: a.url },
    { op: 'click', button: S.act.button.addLink },
  ],
  postconditions: (a) => [{ outcome: 'evidenceListed', args: { organization: a.organization, record: a.record, name: a.name, kind: 'LINK' } }],
  narrate: (a) => `On ${a.record}, add a link named "${a.name}" with the URL \`${a.url}\`.`,
})

export const removeActivity = defineVerb({
  name: 'removeActivity',
  args: z.object({ organization: orgArg, record: z.string(), reason: z.string() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const row = await activity(ctx.session(), org.id, a.record)
    return ctx.session().delete(`/api/ghg/activities/${row.id}?reason=${encodeURIComponent(a.reason)}`)
  },
  ui: (a) => [
    { op: 'orgPage', organization: a.organization, section: S.org.sections.activity },
    { op: 'openRow', text: a.record },
    { op: 'click', button: S.act.button.remove },
    { op: 'fill', label: S.org.field.reason, value: a.reason, within: `Remove {activityType:${a.organization}|${a.record}}?` },
    { op: 'confirm', dialog: `Remove {activityType:${a.organization}|${a.record}}?`, button: S.act.button.remove },
  ],
  postconditions: (a) => [{ outcome: 'activityRemoved', args: { organization: a.organization, record: a.record } }],
  narrate: (a) => `Open the "${a.record}" record, click **${S.act.button.remove}**, give "${a.reason}" and confirm.`,
})

export const removeActivities = defineVerb({
  name: 'removeActivities',
  args: z.object({ organization: orgArg, records: z.array(z.string()).min(1), reason: z.string() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    let last = { status: 0, ok: true }
    for (const record of a.records) {
      const row = await activity(ctx.session(), org.id, record)
      last = await ctx.session().delete(`/api/ghg/activities/${row.id}?reason=${encodeURIComponent(a.reason)}`)
      if (!last.ok) return last
    }
    return last
  },
  ui: (a) => [
    { op: 'orgPage', organization: a.organization, section: S.org.sections.activity },
    ...a.records.map((record) => ({ op: 'tick', label: `Select ${record}` }) as const),
    { op: 'click', button: `Remove ${a.records.length} selected` },
    { op: 'fill', label: S.org.field.reason, value: a.reason, within: `Remove ${a.records.length} records?` },
    { op: 'confirm', dialog: `Remove ${a.records.length} records?`, button: S.act.button.remove },
  ],
  postconditions: (a) => a.records.map((record) => ({ outcome: 'activityRemoved', args: { organization: a.organization, record } })),
  narrate: (a) => `Tick ${a.records.join(' and ')}, click **Remove ${a.records.length} selected** and give the reason "${a.reason}".`,
})

export const removeFacility = defineVerb({
  name: 'removeFacility',
  args: z.object({ organization: orgArg, facility: z.string(), reason: z.string() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const site = await facility(ctx.session(), org.id, a.facility)
    return ctx.session().delete(`/api/ghg/facilities/${site.id}?reason=${encodeURIComponent(a.reason)}`)
  },
  ui: (a) => [
    { op: 'orgPage', organization: a.organization, section: S.org.sections.facilities },
    { op: 'row', text: a.facility, button: S.org.button.remove },
    { op: 'fill', label: S.org.field.reason, value: a.reason, within: `Remove ${a.facility}?` },
    { op: 'click', button: S.org.button.remove, within: `Remove ${a.facility}?` },
  ],
  postconditions: (a) => [{ outcome: 'facilityAbsent', args: { organization: a.organization, name: a.facility } }],
})

export const activityVerbs = [previewImport, importActivities, addActivityDraft, enterActivity, correctActivity, attachFile, attachLink, removeActivity, removeActivities, removeFacility]
