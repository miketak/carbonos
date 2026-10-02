import { z } from 'zod'
import { defineVerb } from '../contract.ts'
import { entity, facility, orgArg, organization } from '../organizations.ts'
import { S } from '../ui/surface.ts'

/** Legal entities, facilities and source streams (specs 03.1, 03.3, 03.4, 04.3). */

const relationshipArg = z.enum(['SUBSIDIARY', 'ASSOCIATE', 'JOINT_VENTURE', 'FIXED_ASSET_INVESTMENT', 'FRANCHISE'])

export const addEntity = defineVerb({
  name: 'addEntity',
  args: z
    .object({
      organization: orgArg,
      name: z.string(),
      relationship: relationshipArg,
      economicInterest: z.number(),
      legalOwnership: z.number().optional(),
      operatedByCompany: z.boolean().default(false),
      acquiredOn: z.string().optional(),
      disposedOn: z.string().optional(),
      jurisdiction: z.string().optional(),
    })
    .strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    return ctx.session().post(`/api/ghg/organizations/${org.id}/entities`, {
      name: a.name,
      relationshipType: a.relationship,
      economicInterestPercent: a.economicInterest,
      legalOwnershipPercent: a.legalOwnership ?? null,
      operatedByCompany: a.operatedByCompany,
      effectiveFrom: a.acquiredOn ?? null,
      effectiveTo: a.disposedOn ?? null,
      jurisdiction: a.jurisdiction ?? null,
    })
  },
  ui: (a) => {
    const d = S.org.dialog.addEntity
    return [
      { op: 'orgPage', organization: a.organization, section: S.org.sections.entities },
      { op: 'click', button: S.org.button.addEntity },
      { op: 'fill', label: S.org.field.name, value: a.name, within: d },
      { op: 'choose', label: S.org.field.relationship, option: S.org.option.relationship[a.relationship] ?? a.relationship, within: d },
      { op: 'fill', label: S.org.field.economicInterest, value: String(a.economicInterest), within: d },
      ...(a.legalOwnership !== undefined ? [{ op: 'fill', label: S.org.field.legalOwnership, value: String(a.legalOwnership), within: d } as const] : []),
      { op: 'tick', label: S.org.field.operatedByCompany, within: d, on: a.operatedByCompany },
      ...(a.acquiredOn ? [{ op: 'fill', label: S.org.field.acquiredOn, value: a.acquiredOn, within: d } as const] : []),
      ...(a.disposedOn ? [{ op: 'fill', label: S.org.field.disposedOn, value: a.disposedOn, within: d } as const] : []),
      ...(a.jurisdiction ? [{ op: 'fill', label: S.org.field.jurisdiction, value: a.jurisdiction, within: d } as const] : []),
      { op: 'click', button: S.org.button.addEntity, within: d },
    ]
  },
  postconditions: (a) => [{ outcome: 'entityListed', args: { organization: a.organization, name: a.name } }],
})

/** The edits procedure 2 makes: the parent, or nothing at all (an unchanged save writes no history). */
export const editEntity = defineVerb({
  name: 'editEntity',
  args: z.object({ organization: orgArg, entity: z.string(), heldThrough: z.string().optional() }).strict(),
  api: async (ctx, { organization: ref, entity: name, heldThrough }) => {
    const org = await organization(ctx, ref)
    const row = await entity(ctx.session(), org.id, name)
    let parentEntityId = row.parentEntityId
    if (heldThrough !== undefined) {
      parentEntityId = heldThrough === 'directly' ? null : (await entity(ctx.session(), org.id, heldThrough)).id
    }
    return ctx.session().put(`/api/ghg/entities/${row.id}`, {
      name: row.name,
      relationshipType: row.relationshipType,
      economicInterestPercent: row.economicInterestPercent,
      legalOwnershipPercent: row.legalOwnershipPercent,
      operatedByCompany: row.operatedByCompany,
      controlledByCompany: row.relationshipType === 'FRANCHISE' ? row.controlledByCompany : null,
      parentEntityId,
      effectiveFrom: row.effectiveFrom,
      effectiveTo: row.effectiveTo,
      jurisdiction: row.jurisdiction,
      financialControlOverride: row.financialControlOverride,
      controlNote: row.controlNote,
    })
  },
  ui: ({ organization: ref, entity: name, heldThrough }) => [
    { op: 'orgPage', organization: ref, section: S.org.sections.entities },
    { op: 'row', text: name, button: S.org.button.edit },
    ...(heldThrough !== undefined
      ? [{ op: 'choose', label: S.org.field.heldThrough, option: heldThrough === 'directly' ? S.org.field.heldDirectly : heldThrough, within: S.org.dialog.editEntity } as const]
      : []),
    { op: 'click', button: S.org.button.saveChanges, within: S.org.dialog.editEntity },
  ],
  postconditions: ({ organization: ref, entity: name, heldThrough }) =>
    heldThrough !== undefined ? [{ outcome: 'entityListed', args: { organization: ref, name, heldThrough } }] : [],
  narrate: ({ entity: name, heldThrough }) =>
    heldThrough === undefined
      ? `Open the edit form of ${name} and save without changing anything.`
      : heldThrough === 'directly'
        ? `Edit ${name} and set **${S.org.field.heldThrough}** to **${S.org.field.heldDirectly}**. Save.`
        : `Edit ${name} and set **${S.org.field.heldThrough}** to ${heldThrough}. Save.`,
})

export const removeEntity = defineVerb({
  name: 'removeEntity',
  args: z.object({ organization: orgArg, entity: z.string(), reason: z.string() }).strict(),
  api: async (ctx, { organization: ref, entity: name, reason }) => {
    const org = await organization(ctx, ref)
    const row = await entity(ctx.session(), org.id, name)
    return ctx.session().delete(`/api/ghg/entities/${row.id}?reason=${encodeURIComponent(reason)}`)
  },
  ui: ({ organization: ref, entity: name, reason }) => [
    { op: 'orgPage', organization: ref, section: S.org.sections.entities },
    { op: 'row', text: name, button: S.org.button.remove },
    { op: 'fill', label: S.org.field.reason, value: reason, within: `Remove ${name}?` },
    { op: 'click', button: S.org.button.remove, within: `Remove ${name}?` },
  ],
  postconditions: ({ organization: ref, entity: name }) => [{ outcome: 'entityAbsent', args: { organization: ref, name } }],
})

export const addFacility = defineVerb({
  name: 'addFacility',
  args: z
    .object({
      organization: orgArg,
      name: z.string(),
      location: z.string(),
      country: z.string().optional(),
      gridRegion: z.string().optional(),
      entity: z.string(),
      lease: z.enum(['OPERATING_LEASE_IN', 'FINANCE_LEASE_IN']).optional(),
      leaseFrom: z.string().optional(),
      leaseUntil: z.string().optional(),
    })
    .strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const owner = await entity(ctx.session(), org.id, a.entity)
    return ctx.session().post(`/api/ghg/organizations/${org.id}/facilities`, {
      name: a.name,
      location: a.location,
      country: a.country ?? null,
      entityId: owner.id,
      gridRegion: a.gridRegion ?? null,
      leaseType: a.lease ?? null,
      leaseFrom: a.leaseFrom ?? null,
      leaseTo: a.leaseUntil ?? null,
    })
  },
  ui: (a) => {
    const d = S.org.dialog.addFacility
    return [
      { op: 'orgPage', organization: a.organization, section: S.org.sections.facilities },
      { op: 'click', button: S.org.button.addFacility },
      { op: 'fill', label: S.org.field.name, value: a.name, within: d },
      { op: 'fill', label: S.org.field.location, value: a.location, within: d },
      ...(a.country ? [{ op: 'fill', label: S.org.field.country, value: a.country, within: d } as const] : []),
      ...(a.gridRegion ? [{ op: 'fill', label: S.org.field.gridRegion, value: a.gridRegion, within: d } as const] : []),
      ...(a.lease ? [{ op: 'choose', label: S.org.field.lease, option: S.org.option.lease[a.lease] ?? a.lease, within: d } as const] : []),
      ...(a.leaseFrom ? [{ op: 'fill', label: S.org.field.leaseFrom, value: a.leaseFrom, within: d } as const] : []),
      ...(a.leaseUntil ? [{ op: 'fill', label: S.org.field.leaseUntil, value: a.leaseUntil, within: d } as const] : []),
      { op: 'choose', label: S.org.field.legalEntity, option: `{entityId:${a.organization}|${a.entity}}`, within: d, byValue: true },
      { op: 'click', button: S.org.button.addFacility, within: d },
    ]
  },
  postconditions: (a) => [{ outcome: 'facilityListed', args: { organization: a.organization, name: a.name, entity: a.entity } }],
})

export const addStream = defineVerb({
  name: 'addStream',
  args: z
    .object({
      organization: orgArg,
      facility: z.string(),
      name: z.string(),
      kind: z.enum(['STATIONARY_COMBUSTION', 'MOBILE_COMBUSTION', 'PURCHASED_ELECTRICITY', 'PROCESS', 'FUGITIVE']),
      fuel: z.string().optional(),
      meterOrSupplier: z.string().optional(),
      contractorOperated: z.boolean().default(false),
    })
    .strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const site = await facility(ctx.session(), org.id, a.facility)
    return ctx.session().post(`/api/ghg/facilities/${site.id}/streams`, {
      name: a.name,
      kind: a.kind,
      fuel: a.fuel ?? null,
      meterOrSupplier: a.meterOrSupplier ?? null,
      contractorOperated: a.contractorOperated,
    })
  },
  ui: (a) => {
    const d = `Source streams: ${a.facility}`
    return [
      { op: 'orgPage', organization: a.organization, section: S.org.sections.facilities },
      { op: 'row', text: a.facility, button: S.org.button.sourceStreams },
      { op: 'fill', label: S.org.field.streamName, value: a.name, within: d },
      { op: 'choose', label: S.org.field.kind, option: S.org.option.kind[a.kind] ?? a.kind, within: d },
      ...(a.fuel ? [{ op: 'fill', label: S.org.field.fuel, value: a.fuel, within: d } as const] : []),
      ...(a.meterOrSupplier ? [{ op: 'fill', label: S.org.field.meterOrSupplier, value: a.meterOrSupplier, within: d } as const] : []),
      ...(a.contractorOperated ? [{ op: 'tick', label: S.org.field.contractorOperated, within: d } as const] : []),
      { op: 'click', button: S.org.button.addStream, within: d },
    ]
  },
  postconditions: (a) => [{ outcome: 'streamListed', args: { organization: a.organization, facility: a.facility, name: a.name } }],
})

export const structureVerbs = [addEntity, editEntity, removeEntity, addFacility, addStream]
