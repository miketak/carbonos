import { z } from 'zod'
import { defineVerb } from '../contract.ts'
import { factor, orgArg, organization } from '../organizations.ts'
import { S } from '../ui/surface.ts'

/** Units, densities, factor packs and emission factors (specs 02.1, 02.2, 02.4, 02.6, 02.11). */

export const addCustomUnit = defineVerb({
  name: 'addCustomUnit',
  args: z.object({ organization: orgArg, code: z.string(), label: z.string(), equals: z.number(), of: z.string() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    return ctx.session().post(`/api/ghg/organizations/${org.id}/custom-units`, { code: a.code, label: a.label, baseUnit: a.of, factor: a.equals })
  },
  ui: (a) => [
    { op: 'orgPage', organization: a.organization, section: S.org.sections.units },
    { op: 'fill', label: S.org.field.code, value: a.code },
    { op: 'fill', label: S.org.field.label, value: a.label },
    { op: 'fill', label: S.org.field.oneUnitEquals, value: String(a.equals) },
    { op: 'choose', label: S.org.field.of, option: a.of, byValue: true },
    { op: 'click', button: S.org.button.defineUnit },
  ],
  postconditions: (a) => [{ outcome: 'customUnitListed', args: { organization: a.organization, code: a.code } }],
})

export const addDensity = defineVerb({
  name: 'addDensity',
  args: z.object({ organization: orgArg, material: z.string(), kgPerLitre: z.number(), source: z.string() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    return ctx.session().post(`/api/ghg/organizations/${org.id}/densities`, { material: a.material, kgPerLitre: a.kgPerLitre, source: a.source })
  },
  ui: (a) => [
    { op: 'orgPage', organization: a.organization, section: S.org.sections.units },
    { op: 'fill', label: S.org.field.material, value: a.material },
    { op: 'fill', label: S.org.field.kgPerLitre, value: String(a.kgPerLitre) },
    { op: 'fill', label: S.org.field.source, value: a.source },
    { op: 'click', button: S.org.button.recordDensity },
  ],
  postconditions: (a) => [{ outcome: 'densityListed', args: { organization: a.organization, material: a.material, typical: false } }],
})

export const importPack = defineVerb({
  name: 'importPack',
  args: z.object({ organization: orgArg, pack: z.string(), packName: z.string() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    return ctx.session().post(`/api/ghg/organizations/${org.id}/factor-packs/${a.pack}/import`)
  },
  ui: (a) => [
    { op: 'orgPage', organization: a.organization, section: S.org.sections.factors },
    { op: 'row', text: a.packName, button: S.org.button.importPack },
  ],
  postconditions: () => [],
  narrate: (a) => `Click **${S.org.button.importPack}** on "${a.packName}".`,
})

export const addFactor = defineVerb({
  name: 'addFactor',
  args: z
    .object({
      organization: orgArg,
      name: z.string(),
      scope: z.enum(['SCOPE_1', 'SCOPE_2', 'SCOPE_3']),
      category: z.string(),
      unit: z.string(),
      kgCo2ePerUnit: z.number(),
      hfcsKgPerUnit: z.number().optional(),
      blendComposition: z.string().optional(),
      gwpBasis: z.string().optional(),
      source: z.string(),
      publicationYear: z.number().int().optional(),
      dataYear: z.number().int().optional(),
    })
    .strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    return ctx.session().post(`/api/ghg/organizations/${org.id}/emission-factors`, {
      name: a.name,
      defaultScope: a.scope,
      defaultCategory: a.category,
      unit: a.unit,
      kgCo2ePerUnit: a.kgCo2ePerUnit,
      hfcsKgPerUnit: a.hfcsKgPerUnit ?? null,
      blendComposition: a.blendComposition ?? null,
      blendGwpSource: a.gwpBasis ?? null,
      source: a.source,
      publicationYear: a.publicationYear ?? null,
      dataYear: a.dataYear ?? null,
    })
  },
  ui: (a) => {
    const d = S.org.dialog.addFactor
    return [
      { op: 'orgPage', organization: a.organization, section: S.org.sections.factors },
      { op: 'click', button: S.org.button.addFactor },
      { op: 'fill', label: S.org.field.factorName, value: a.name, within: d },
      { op: 'choose', label: S.org.field.suggestedScope, option: a.scope, within: d, byValue: true },
      { op: 'choose', label: S.org.field.category, option: a.category, within: d, byValue: true },
      { op: 'fill', label: S.org.field.unit, value: a.unit, within: d },
      { op: 'fill', label: S.org.field.kgCo2ePerUnit, value: String(a.kgCo2ePerUnit), within: d },
      ...(a.hfcsKgPerUnit !== undefined ? [{ op: 'fill', label: S.org.field.hfcsKgPerUnit, value: String(a.hfcsKgPerUnit), within: d } as const] : []),
      ...(a.blendComposition ? [{ op: 'fill', label: S.org.field.blendComposition, value: a.blendComposition, within: d } as const] : []),
      ...(a.gwpBasis ? [{ op: 'choose', label: S.org.field.gwpBasis, option: a.gwpBasis, within: d } as const] : []),
      { op: 'fill', label: S.org.field.factorSource, value: a.source, within: d },
      ...(a.publicationYear ? [{ op: 'fill', label: S.org.field.publicationYear, value: String(a.publicationYear), within: d } as const] : []),
      ...(a.dataYear ? [{ op: 'fill', label: S.org.field.dataYear, value: String(a.dataYear), within: d } as const] : []),
      { op: 'click', button: S.org.button.addFactor, within: d },
    ]
  },
  postconditions: (a) => [{ outcome: 'factorListed', args: { organization: a.organization, name: a.name, approved: false } }],
})

export const retireFactor = defineVerb({
  name: 'retireFactor',
  args: z.object({ organization: orgArg, factor: z.string(), validTo: z.string().optional() }).strict(),
  api: async (ctx, a) => {
    if (a.validTo === undefined) return { status: 0, ok: false, na: 'the empty Valid to is refused by the page before any request' }
    const org = await organization(ctx, a.organization)
    const row = await factor(ctx.session(), org.id, a.factor)
    const current = await ctx.session().get(`/api/ghg/emission-factors/${row.id}`).catch(() => undefined)
    const full = (current && current.ok ? current.body : row) as Record<string, unknown>
    return ctx.session().put(`/api/ghg/emission-factors/${row.id}`, {
      name: full.name,
      defaultScope: full.defaultScope,
      defaultCategory: full.defaultCategory,
      scopeAgnostic: full.scopeAgnostic ?? null,
      unit: full.unit,
      kgCo2ePerUnit: full.kgCo2ePerUnit,
      hfcsKgPerUnit: (full.gases as { hfcsKg?: number } | undefined)?.hfcsKg ?? null,
      blendComposition: full.blendCompositionEntered ?? null,
      blendGwpSource: full.blendGwpSource ?? null,
      source: full.source,
      sourceUrl: full.sourceUrl ?? null,
      publicationYear: full.publicationYear ?? null,
      dataYear: full.dataYear ?? null,
      validFrom: full.validFrom ?? null,
      validTo: a.validTo,
      note: full.note ?? null,
      reportingBasis: full.reportingBasis ?? null,
    })
  },
  ui: (a) => [
    { op: 'orgPage', organization: a.organization, section: S.org.sections.factors },
    { op: 'row', text: a.factor, button: `Retire factor ${a.factor}` },
    ...(a.validTo ? [{ op: 'fill', label: S.org.field.validTo, value: a.validTo, within: `Retire ${a.factor}` } as const] : []),
    { op: 'click', button: S.org.button.retireFactor, within: `Retire ${a.factor}` },
  ],
  postconditions: (a) => (a.validTo ? [{ outcome: 'factorListed', args: { organization: a.organization, name: a.factor, validTo: a.validTo } }] : []),
  narrate: (a) =>
    a.validTo
      ? `Click **${S.org.button.retire}** on "${a.factor}", enter ${a.validTo} in **${S.org.field.validTo}** and click **${S.org.button.retireFactor}**.`
      : `Click **${S.org.button.retire}** on "${a.factor}" and click **${S.org.button.retireFactor}** with **${S.org.field.validTo}** empty.`,
})

export const approveFactor = defineVerb({
  name: 'approveFactor',
  args: z.object({ organization: orgArg, factor: z.string() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const row = await factor(ctx.session(), org.id, a.factor)
    return ctx.session().post(`/api/ghg/emission-factors/${row.id}/approve`)
  },
  ui: (a) => [
    { op: 'orgPage', organization: a.organization, section: S.org.sections.factors },
    { op: 'row', text: a.factor, button: S.org.button.approve },
  ],
  postconditions: (a) => [{ outcome: 'factorListed', args: { organization: a.organization, name: a.factor, approved: true } }],
  narrate: (a) => `Click **${S.org.button.approve}** on "${a.factor}".`,
})

export const libraryVerbs = [addCustomUnit, addDensity, importPack, addFactor, retireFactor, approveFactor]
