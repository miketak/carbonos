import { z } from 'zod'
import { defineVerb } from '../contract.ts'
import { orgArg, organization } from '../organizations.ts'
import { caseLabels, edition, notice, packRow, rowRequest, type PackRow } from '../packs.ts'
import { S } from '../ui/surface.ts'
import { fixture } from './activities.ts'

/**
 * The pack lifecycle (spec 02.5): a draft cloned from a published edition, its
 * rows corrected, its source document attached, its publication by a second
 * administrator and its withdrawal; the organization's decision on the notice
 * it raises (spec 02.7); and support access (specs 01.3, 01.5).
 */

const editionArg = z.string().describe('an edition identifier, the citation a report prints')
const answerArg = z.enum(['VINTAGE_PROGRESSION', 'RETROSPECTIVE_ADOPTION', 'ERRATUM_ON_REPORTED_YEAR'])

export const openFactorPacks = defineVerb({
  name: 'openFactorPacks',
  args: z.object({}).strict(),
  api: async (ctx) => ctx.session().get('/api/admin/factor-packs'),
  ui: () => [{ op: 'open', nav: S.pack.nav.factorPacks }],
  postconditions: () => [],
  narrate: () => `Open **${S.nav.administration}**, then **${S.pack.nav.factorPacks}**.`,
})

export const openEdition = defineVerb({
  name: 'openEdition',
  args: z.object({ edition: editionArg, tab: z.enum(['Rows', 'Metadata', 'Validation', 'Changes']).optional() }).strict(),
  api: async (ctx, a) => ctx.session().get(`/api/admin/factor-packs/editions/${encodeURIComponent(a.edition)}${a.tab === 'Validation' ? '/validation' : a.tab === 'Changes' ? '/changes' : ''}`),
  ui: (a) => [{ op: 'editionPage', edition: a.edition, tab: a.tab }],
  postconditions: () => [],
  narrate: (a) => `Open \`${a.edition}\`${a.tab ? ` and its **${a.tab}** tab` : ''}.`,
})

/** A draft that starts from a published edition's rows, copied (spec 02.5). */
export const cloneEdition = defineVerb({
  name: 'cloneEdition',
  args: z.object({ from: editionArg, editionId: z.string(), appliesFrom: z.string().optional() }).strict(),
  api: async (ctx, a) => {
    const source = await edition(ctx.session(), a.from)
    return ctx.session().post(`/api/admin/factor-packs/${encodeURIComponent(source.packKey)}/editions`, {
      editionId: a.editionId,
      cloneFrom: a.from,
      name: source.name,
      source: source.source,
      sourceUrl: source.sourceUrl ?? '',
      publicationYear: source.publicationYear,
      gwpBasis: source.gwpBasis ?? 'AR5',
      license: '',
      retrieved: '',
      notes: '',
      appliesFrom: a.appliesFrom ?? null,
    })
  },
  ui: (a) => {
    const d = `${S.pack.button.clone} ${a.from}`
    return [
      { op: 'open', nav: S.pack.nav.factorPacks },
      { op: 'clickContaining', text: `${S.pack.button.clone} ${a.from} into a new draft` },
      { op: 'fill', label: S.pack.field.editionId, value: a.editionId, within: d },
      ...(a.appliesFrom ? [{ op: 'fill', label: S.pack.field.appliesFrom, value: a.appliesFrom, within: d } as const] : []),
      { op: 'click', button: S.pack.button.createDraft, within: d },
    ]
  },
  postconditions: (a) => [{ outcome: 'editionListed', args: { edition: a.editionId, status: 'DRAFT', appliesFrom: a.appliesFrom } }],
  narrate: (a) => `Click **${S.pack.button.clone}** on \`${a.from}\`, type the identifier \`${a.editionId}\`${a.appliesFrom ? `, applies from ${a.appliesFrom}` : ''} and click **${S.pack.button.createDraft}**.`,
})

/** One row of a draft, corrected: its value, its code, its unit or its data year (an empty data year clears it). */
export const editPackRow = defineVerb({
  name: 'editPackRow',
  args: z
    .object({
      edition: editionArg,
      code: z.string(),
      kgCo2ePerUnit: z.number().optional(),
      newCode: z.string().optional(),
      unit: z.string().optional(),
      dataYear: z.number().int().nullable().optional(),
    })
    .strict(),
  api: async (ctx, a) => {
    const row = await packRow(ctx.session(), a.edition, a.code)
    const changes: Partial<PackRow> = {}
    if (a.kgCo2ePerUnit !== undefined) changes.kgCo2ePerUnit = a.kgCo2ePerUnit
    if (a.newCode !== undefined) changes.code = a.newCode
    if (a.unit !== undefined) changes.unit = a.unit
    if (a.dataYear !== undefined) changes.dataYear = a.dataYear
    return ctx.session().put(`/api/admin/factor-packs/editions/${encodeURIComponent(a.edition)}/rows/${row.id}`, rowRequest(row, changes))
  },
  ui: (a) => {
    const d = `${S.pack.button.edit} ${a.code}`
    return [
      { op: 'editionPage', edition: a.edition },
      { op: 'clickContaining', text: d },
      ...(a.newCode !== undefined ? [{ op: 'fill', label: S.pack.field.code, value: a.newCode, within: d } as const] : []),
      ...(a.unit !== undefined ? [{ op: 'fill', label: S.pack.field.unit, value: a.unit, within: d } as const] : []),
      ...(a.kgCo2ePerUnit !== undefined ? [{ op: 'fill', label: S.pack.field.kgCo2e, value: String(a.kgCo2ePerUnit), within: d } as const] : []),
      ...(a.dataYear !== undefined ? [{ op: 'fill', label: S.pack.field.dataYear, value: a.dataYear === null ? '' : String(a.dataYear), within: d } as const] : []),
      { op: 'click', button: S.pack.button.saveRow, within: d },
    ]
  },
  postconditions: (a) => [{ outcome: 'packRowReads', args: { edition: a.edition, code: a.newCode ?? a.code, kgCo2ePerUnit: a.kgCo2ePerUnit, unit: a.unit, dataYear: a.dataYear } }],
  narrate: (a) => {
    const changes: string[] = []
    if (a.kgCo2ePerUnit !== undefined) changes.push(`its ${S.org.field.kgCo2ePerUnit} to ${a.kgCo2ePerUnit}`)
    if (a.newCode !== undefined) changes.push(`its code to \`${a.newCode}\``)
    if (a.unit !== undefined) changes.push(`its unit to \`${a.unit}\``)
    if (a.dataYear !== undefined) changes.push(a.dataYear === null ? 'its data year to empty' : `its data year to ${a.dataYear}`)
    return `On \`${a.edition}\`, click **${S.pack.button.edit}** on \`${a.code}\`, change ${changes.join(', ')} and click **${S.pack.button.saveRow}**.`
  },
})

/** The source document an edition is published against, stored with its SHA-256 (spec 02.5). */
export const attachSourceDocument = defineVerb({
  name: 'attachSourceDocument',
  args: z.object({ edition: editionArg, file: z.string() }).strict(),
  api: async (ctx, a) => ctx.session().upload(`/api/admin/factor-packs/editions/${encodeURIComponent(a.edition)}/evidence`, fixture(a.file)),
  ui: (a) => [
    { op: 'editionPage', edition: a.edition },
    { op: 'click', button: S.pack.button.publish },
    { op: 'upload', label: S.pack.field.sourceDocument, fixture: a.file, within: `${S.pack.button.publish} ${a.edition}` },
  ],
  postconditions: (a) => [{ outcome: 'editionListed', args: { edition: a.edition, evidence: true } }],
  narrate: (a) => `Click **${S.pack.button.publish}** on \`${a.edition}\` and choose \`${a.file}\` under **${S.pack.field.sourceDocument}**.`,
})

/**
 * The publication gate (spec 02.5). The applies-from date is typed by whoever
 * publishes; an empty string clears the draft's date, which is a refusal.
 */
export const publishEdition = defineVerb({
  name: 'publishEdition',
  args: z.object({ edition: editionArg, appliesFrom: z.string().optional(), sourceDocument: z.string().optional() }).strict(),
  api: async (ctx, a) => {
    const draft = await edition(ctx.session(), a.edition)
    const appliesFrom = a.appliesFrom === undefined ? draft.appliesFrom : a.appliesFrom || null
    return ctx.session().post(`/api/admin/factor-packs/editions/${encodeURIComponent(a.edition)}/publish`, {
      sourceDocument: a.sourceDocument ?? draft.sourceDocument ?? draft.source,
      appliesFrom,
      erratum: false,
      erratumNote: null,
    })
  },
  ui: (a) => {
    const d = `${S.pack.button.publish} ${a.edition}`
    return [
      { op: 'editionPage', edition: a.edition },
      { op: 'click', button: S.pack.button.publish },
      ...(a.appliesFrom !== undefined ? [{ op: 'fill', label: S.pack.field.appliesFrom, value: a.appliesFrom, within: d } as const] : []),
      ...(a.sourceDocument !== undefined ? [{ op: 'fill', label: S.pack.field.sourceCited, value: a.sourceDocument, within: d } as const] : []),
      { op: 'click', button: S.pack.button.publish, within: d, ifEnabled: true },
    ]
  },
  postconditions: () => [],
  narrate: (a) => {
    const parts = [`Click **${S.pack.button.publish}** on \`${a.edition}\``]
    if (a.appliesFrom === '') parts.push(`clear **${S.pack.field.appliesFrom}**`)
    else if (a.appliesFrom) parts.push(`set **${S.pack.field.appliesFrom}** to ${a.appliesFrom}`)
    if (a.sourceDocument) parts.push(`type "${a.sourceDocument}" as **${S.pack.field.sourceCited}**`)
    return `${parts.join(', ')}, and click **${S.pack.button.publish}** in the dialog.`
  },
})

export const readBlastRadius = defineVerb({
  name: 'readBlastRadius',
  args: z.object({ edition: editionArg }).strict(),
  api: async (ctx, a) => ctx.session().get(`/api/admin/factor-packs/editions/${encodeURIComponent(a.edition)}/blast-radius`),
  ui: (a) => [
    { op: 'editionPage', edition: a.edition },
    { op: 'click', button: S.pack.button.blastRadius },
  ],
  postconditions: () => [],
  narrate: (a) => `Open \`${a.edition}\` and click **${S.pack.button.blastRadius}**.`,
})

export const withdrawEdition = defineVerb({
  name: 'withdrawEdition',
  args: z.object({ edition: editionArg, reason: z.string() }).strict(),
  api: async (ctx, a) => ctx.session().post(`/api/admin/factor-packs/editions/${encodeURIComponent(a.edition)}/withdraw`, { reason: a.reason }),
  ui: (a) => {
    const d = `${S.pack.button.withdraw} ${a.edition}`
    return [
      { op: 'editionPage', edition: a.edition },
      { op: 'click', button: S.pack.button.withdraw },
      { op: 'fill', label: S.pack.field.whyWithdrawn, value: a.reason, within: d },
      { op: 'click', button: S.pack.button.withdrawEdition, within: d },
    ]
  },
  postconditions: () => [],
  narrate: (a) => `Open \`${a.edition}\`, click **${S.pack.button.withdraw}**, type "${a.reason}" and confirm with **${S.pack.button.withdrawEdition}**.`,
})

export const deleteDraft = defineVerb({
  name: 'deleteDraft',
  args: z.object({ edition: editionArg }).strict(),
  api: async (ctx, a) => ctx.session().delete(`/api/admin/factor-packs/editions/${encodeURIComponent(a.edition)}`),
  ui: (a) => [
    { op: 'editionPage', edition: a.edition },
    { op: 'click', button: S.pack.button.deleteDraft },
    { op: 'click', button: S.pack.button.deleteDraft, within: `Delete ${a.edition}` },
  ],
  postconditions: (a) => [{ outcome: 'editionAbsent', args: { edition: a.edition } }],
  narrate: (a) => `On \`${a.edition}\`, click **${S.pack.button.deleteDraft}** and confirm.`,
})

// --- the organization's decision (spec 02.7) ---------------------------------

export const openUpdates = defineVerb({
  name: 'openUpdates',
  args: z.object({ organization: orgArg }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    return ctx.session().get(`/api/ghg/organizations/${org.id}/factor-pack-notices`)
  },
  ui: (a) => [{ op: 'orgPage', organization: a.organization, section: S.pack.nav.updates }],
  postconditions: () => [],
  narrate: () => `Open **${S.pack.nav.updates}**.`,
})

/** The drawer behind a notice: the diff, the earlier periods and the question. */
export const reviewNotice = defineVerb({
  name: 'reviewNotice',
  args: z.object({ organization: orgArg, edition: editionArg }).strict(),
  api: async (ctx, a) => {
    const { notice: n } = await notice(ctx, a.organization, a.edition)
    return ctx.session().get(`/api/ghg/factor-pack-notices/${n.id}/diff`)
  },
  ui: (a) => [
    { op: 'orgPage', organization: a.organization, section: S.pack.nav.updates },
    // the row's button reads Review while the notice is open, View once it is decided or withdrawn
    { op: 'row', text: a.edition, button: `${S.pack.button.review}|${S.pack.button.view}` },
  ],
  postconditions: () => [],
  narrate: (a) => `On **${S.pack.nav.updates}**, click **${S.pack.button.review}** on \`${a.edition}\`.`,
})

export const acceptNotice = defineVerb({
  name: 'acceptNotice',
  args: z.object({ organization: orgArg, edition: editionArg, answer: answerArg.optional(), note: z.string().optional() }).strict(),
  api: async (ctx, a) => {
    const { notice: n } = await notice(ctx, a.organization, a.edition)
    return ctx.session().post(`/api/ghg/factor-pack-notices/${n.id}/accept`, { recalculationCase: a.answer ?? null, note: a.note ?? null })
  },
  ui: (a) => [
    { op: 'orgPage', organization: a.organization, section: S.pack.nav.updates },
    { op: 'row', text: a.edition, button: S.pack.button.review },
    ...(a.answer ? [{ op: 'choose', label: S.pack.field.answer, option: caseLabels[a.answer]! } as const] : []),
    ...(a.note ? [{ op: 'fill', label: S.pack.field.note, value: a.note } as const] : []),
    { op: 'click', button: S.pack.button.accept, ifEnabled: true },
  ],
  postconditions: () => [],
  narrate: (a) =>
    a.answer
      ? `Open the drawer of \`${a.edition}\`, answer "${caseLabels[a.answer]}"${a.note ? `, note "${a.note}"` : ''} and click **${S.pack.button.accept}**.`
      : `Open the drawer of \`${a.edition}\` and click **${S.pack.button.accept}** without answering.`,
})

export const declineNotice = defineVerb({
  name: 'declineNotice',
  args: z.object({ organization: orgArg, edition: editionArg, note: z.string().optional() }).strict(),
  api: async (ctx, a) => {
    const { notice: n } = await notice(ctx, a.organization, a.edition)
    return ctx.session().post(`/api/ghg/factor-pack-notices/${n.id}/decline`, { note: a.note ?? null })
  },
  ui: (a) => [
    { op: 'orgPage', organization: a.organization, section: S.pack.nav.updates },
    { op: 'row', text: a.edition, button: S.pack.button.review },
    ...(a.note ? [{ op: 'fill', label: S.pack.field.note, value: a.note } as const] : []),
    { op: 'click', button: S.pack.button.decline, ifEnabled: true },
  ],
  postconditions: () => [],
  narrate: (a) => `Open the drawer of \`${a.edition}\` and click **${S.pack.button.decline}**.`,
})

// --- support access (specs 01.3, 01.5) ----------------------------------------

export const assumeSupportAccess = defineVerb({
  name: 'assumeSupportAccess',
  args: z.object({ organization: orgArg, reason: z.string() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    return ctx.session().post(`/api/ghg/organizations/${org.id}/support-access`, { reason: a.reason })
  },
  ui: (a) => {
    const d = `${S.pack.button.assumeAccess} to {orgLabel:${a.organization}}`
    return [
      { op: 'open', nav: S.pack.nav.organizations },
      { op: 'row', text: a.organization, button: S.pack.button.assumeAccess },
      { op: 'fill', label: S.pack.field.reason, value: a.reason, within: d },
      { op: 'click', button: S.pack.button.assumeAccess, within: d, ifEnabled: true },
    ]
  },
  postconditions: (a) => [{ outcome: 'supportAccess', args: { organization: a.organization, active: true, reason: a.reason } }],
  narrate: (a) => `Open **${S.nav.administration}**, **${S.pack.nav.organizations}**, click **${S.pack.button.assumeAccess}** on ${a.organization}, type the reason "${a.reason}" and confirm.`,
})

export const endSupportAccess = defineVerb({
  name: 'endSupportAccess',
  args: z.object({ organization: orgArg }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    return ctx.session().delete(`/api/ghg/organizations/${org.id}/support-access`)
  },
  ui: (a) => [
    { op: 'open', nav: S.pack.nav.organizations },
    // the button reads End access; its accessible name is "End support access to <organization>"
    { op: 'row', text: a.organization, button: S.pack.button.endSupportAccessTo },
  ],
  postconditions: (a) => [{ outcome: 'supportAccess', args: { organization: a.organization, active: false } }],
  narrate: (a) => `On **${S.pack.nav.organizations}**, click **${S.pack.button.endAccess}** on ${a.organization}.`,
})

export const packVerbs = [
  openFactorPacks,
  openEdition,
  cloneEdition,
  editPackRow,
  attachSourceDocument,
  publishEdition,
  readBlastRadius,
  withdrawEdition,
  deleteDraft,
  openUpdates,
  reviewNotice,
  acceptNotice,
  declineNotice,
  assumeSupportAccess,
  endSupportAccess,
]
