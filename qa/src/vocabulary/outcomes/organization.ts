import { z } from 'zod'
import { defineOutcome, fail, notApplicable, pass } from '../contract.ts'
import { account, actorArg } from '../helpers.ts'
import {
  entities,
  entity,
  events,
  facilities,
  facility,
  findOrganization,
  members,
  orgArg,
  organization,
  searchFactors,
  splitOrgRef,
  streamsOf,
} from '../organizations.ts'
import { S } from '../ui/surface.ts'

/** Statements about an organization, its members and its history (specs 01.2, 01.7, 01.8). */

export const organizationListed = defineOutcome({
  name: 'organizationListed',
  args: z.object({ organization: orgArg, user: actorArg.optional() }).strict(),
  api: async (ctx, { organization: ref, user }) => {
    const org = await findOrganization(ctx, ref)
    if (!org) return fail(`no organization '${ref}'`)
    if (user) {
      const out = await ctx.sessionOf(user).get('/api/ghg/organizations')
      if (!out.ok) return fail(`could not list organizations as ${user}: ${out.status}`)
      if (!(out.body as Array<{ id: string }>).some((o) => o.id === org.id)) return fail(`${user} does not see '${ref}'`)
    }
    return pass(`ORG-${org.accountNo}`)
  },
  ui: ({ organization: ref }) => [{ check: 'at', nav: S.nav.ghg }, { check: 'textVisible', text: splitOrgRef(ref).name }],
  narrate: ({ organization: ref }) => {
    const { name, index } = splitOrgRef(ref)
    return index ? `A second card, "${name}", with the next account number.` : `"${name} (ORG-<NNNN>) created." The list shows the organization with its account number.`
  },
})

export const organizationAbsent = defineOutcome({
  name: 'organizationAbsent',
  args: z.object({ organization: orgArg }).strict(),
  api: async (ctx, { organization: ref }) => ((await findOrganization(ctx, ref)) ? fail(`'${ref}' is still listed`) : pass()),
  ui: ({ organization: ref }) => {
    const { name, index } = splitOrgRef(ref)
    return index ? [{ check: 'at', nav: S.nav.ghg }, { check: 'na', why: 'two organizations share the name; the API tells them apart by account number' }] : [{ check: 'at', nav: S.nav.ghg }, { check: 'textAbsent', text: name }]
  },
  narrate: ({ organization: ref }) => `${splitOrgRef(ref).name} (the ${splitOrgRef(ref).index ? 'second' : ''} organization) is removed from the list.`,
})

export const myRole = defineOutcome({
  name: 'myRole',
  args: z.object({ user: actorArg, organization: orgArg, role: z.enum(['OWNER', 'REVIEWER', 'PREPARER', 'VERIFIER']) }).strict(),
  api: async (ctx, { user, organization: ref, role }) => {
    const org = await organization(ctx, ref)
    const out = await ctx.sessionOf(user).get(`/api/ghg/organizations/${org.id}`)
    if (!out.ok) return fail(`${user} cannot open '${ref}' (${out.status})`)
    const mine = (out.body as { myRole: string }).myRole
    return mine === role ? pass(role) : fail(`${user} is ${mine} in '${ref}'`)
  },
  ui: ({ organization: ref, role }) => [
    { check: 'atOrg', organization: ref, section: S.org.sections.overview },
    { check: 'textVisible', text: `${S.org.text.yourRole} ${S.org.option.roleShort[role]}` },
    ...(role === 'VERIFIER' ? [{ check: 'textVisible', text: S.org.text.readOnlyBanner } as const] : []),
  ],
  narrate: ({ user, organization: ref, role }, n) =>
    role === 'VERIFIER'
      ? `${splitOrgRef(ref).name} opens for ${n.actorName(user)}. Every page carries the banner "${S.org.text.readOnlyBanner}", and the foot of the sidebar reads "${S.org.text.yourRole} ${S.org.option.roleShort[role]}".`
      : `The **${S.org.sections.overview}** opens, and the foot of the sidebar reads "${S.org.text.yourRole} ${S.org.option.roleShort[role]}".`,
})

export const memberListed = defineOutcome({
  name: 'memberListed',
  args: z.object({ organization: orgArg, user: actorArg, role: z.enum(['OWNER', 'REVIEWER', 'PREPARER', 'VERIFIER']).optional() }).strict(),
  api: async (ctx, { organization: ref, user, role }) => {
    const org = await organization(ctx, ref)
    const row = (await members(ctx.session(), org.id)).find((m) => m.email === account(ctx, user).email)
    if (!row) return fail(`${user} is not a member of '${ref}'`)
    if (role && row.role !== role) return fail(`${user} is ${row.role}, expected ${role}`)
    return pass(row.role)
  },
  ui: ({ organization: ref, user, role }) => [
    { check: 'atOrg', organization: ref, section: S.org.sections.settings },
    ...(role ? [{ check: 'fieldValue', label: `Role of {name:${user}}`, value: S.org.option.memberRole[role]! } as const] : [{ check: 'textVisible', text: `{email:${user}}` } as const]),
  ],
  narrate: ({ user, role }, n) => (role ? `${n.actorName(user)} appears with the role **${S.org.option.memberRole[role]}**.` : `${n.actorName(user)} is a member.`),
})

export const memberAbsent = defineOutcome({
  name: 'memberAbsent',
  args: z.object({ organization: orgArg, user: actorArg }).strict(),
  api: async (ctx, { organization: ref, user }) => {
    const org = await organization(ctx, ref)
    return (await members(ctx.session(), org.id)).some((m) => m.email === account(ctx, user).email) ? fail(`${user} is still a member`) : pass()
  },
  ui: ({ organization: ref, user }) => [{ check: 'atOrg', organization: ref, section: S.org.sections.settings }, { check: 'textAbsent', text: `{email:${user}}` }],
  narrate: ({ user }, n) => `${n.actorName(user)} is no longer a member.`,
})

export const historyHas = defineOutcome({
  name: 'historyHas',
  args: z.object({ organization: orgArg, action: z.string(), detail: z.string().optional(), actor: actorArg.optional() }).strict(),
  api: async (ctx, { organization: ref, action, detail, actor }) => {
    const org = await organization(ctx, ref)
    const rows = await events(ctx.session(), org.id)
    const hit = rows.find(
      (e) => e.action === action && (detail === undefined || (e.reason ?? '').includes(detail)) && (actor === undefined || e.actor === account(ctx, actor).email),
    )
    return hit ? pass() : fail(`no history entry ${action}${detail ? ` "${detail}"` : ''}; last entries: ${rows.slice(0, 3).map((e) => `${e.action}: ${e.reason ?? ''}`).join(' | ')}`)
  },
  ui: ({ organization: ref, detail }) => [
    { check: 'atOrg', organization: ref, section: S.org.sections.settings },
    ...(detail ? [{ check: 'textVisible', text: detail } as const] : []),
  ],
  narrate: ({ action, detail, actor }, n) =>
    `**${S.org.text.history}** holds ${/^[aeiou]/i.test(action) ? 'an' : 'a'} ${words(action)} entry${detail ? ` reading "${detail}"` : ''}${actor ? `, with ${n.actorAlias(actor)} and the moment` : ''}.`,
})

export const historyCount = defineOutcome({
  name: 'historyCount',
  args: z.object({ organization: orgArg, action: z.string(), count: z.number().int() }).strict(),
  api: async (ctx, { organization: ref, action, count }) => {
    const org = await organization(ctx, ref)
    const n = (await events(ctx.session(), org.id)).filter((e) => e.action === action).length
    return n === count ? pass(String(n)) : fail(`${n} ${action} entries, expected ${count}`)
  },
  ui: () => [{ check: 'na', why: 'the history card does not count entries by kind' }],
  narrate: ({ action, count }) => `**${S.org.text.history}** holds ${count === 0 ? 'no' : count} ${words(action)} ${count === 1 ? 'entry' : 'entries'}.`,
})

export const cannotWrite = defineOutcome({
  name: 'cannotWrite',
  args: z.object({ user: actorArg, organization: orgArg }).strict(),
  api: async (ctx, { user, organization: ref }) => {
    const org = await organization(ctx, ref)
    const out = await ctx.sessionOf(user).post(`/api/ghg/organizations/${org.id}/entities`, {
      name: 'Probe Ltd',
      relationshipType: 'SUBSIDIARY',
      economicInterestPercent: 100,
      operatedByCompany: true,
    })
    if (out.ok) return fail(`${user} could add an entity`)
    return out.status === 403 && out.rule === 'ghg.role.required' ? pass('403 ghg.role.required') : fail(`refused with ${out.status} ${out.rule ?? ''}`)
  },
  ui: ({ organization: ref }) => [
    { check: 'atOrg', organization: ref, section: S.org.sections.entities },
    { check: 'textVisible', text: S.org.text.readOnlyBanner },
    { check: 'buttonDisabled', button: S.org.button.addEntity, tooltip: S.org.text.writeTooltip },
    { check: 'atOrg', organization: ref, section: S.org.sections.facilities },
    { check: 'buttonDisabled', button: S.org.button.addFacility, tooltip: S.org.text.writeTooltip },
    { check: 'atOrg', organization: ref, section: S.org.sections.factors },
    { check: 'buttonDisabled', button: S.org.button.addFactor, tooltip: S.org.text.writeTooltip },
  ],
  narrate: () =>
    `On **${S.org.sections.entities}**, **${S.org.sections.facilities}** and **${S.org.sections.factors}** every button that would write is disabled, with the tooltip "${S.org.text.writeTooltip}". Nothing is hidden: a verifier sees the record, not a blank page.`,
})

function words(action: string): string {
  return action.toLowerCase().replace(/_/g, ' ')
}

export const entityListed = defineOutcome({
  name: 'entityListed',
  args: z
    .object({
      organization: orgArg,
      name: z.string(),
      equityShare: z.number().optional(),
      financialControlShare: z.number().optional(),
      operationalControlShare: z.number().optional(),
      from: z.string().optional(),
      heldThrough: z.string().optional(),
      reportingCompany: z.boolean().optional(),
    })
    .strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const all = await entities(ctx.session(), org.id)
    const row = all.find((e) => e.name === a.name)
    if (!row) return fail(`no entity '${a.name}'`)
    // the API reports a share as a fraction (1 = 100%); the scenario and the screen speak in percent
    const pct = (share: number) => Math.round(Number(share) * 10000) / 100
    const checks: Array<[string, unknown, unknown]> = [
      ['equityShare', a.equityShare, pct(row.equityShare)],
      ['financialControlShare', a.financialControlShare, pct(row.financialControlShare)],
      ['operationalControlShare', a.operationalControlShare, pct(row.operationalControlShare)],
      ['from', a.from, row.effectiveFrom],
      ['reportingCompany', a.reportingCompany, row.reportingCompany],
    ]
    for (const [key, want, got] of checks) {
      if (want !== undefined && Number(got) !== Number(want) && String(got) !== String(want)) return fail(`${a.name}: ${key} is ${String(got)}, expected ${String(want)}`)
    }
    if (a.heldThrough !== undefined) {
      const parent = a.heldThrough === 'directly' ? null : all.find((e) => e.name === a.heldThrough)?.id ?? 'missing'
      if ((row.parentEntityId ?? null) !== parent) return fail(`${a.name} is held through ${row.parentEntityId ?? 'the company'}`)
    }
    return pass()
  },
  ui: (a) => [
    { check: 'atOrg', organization: a.organization, section: S.org.sections.entities },
    { check: 'rowHas', text: a.name, cells: [...(a.from ? [`from ${a.from}`] : []), ...(a.reportingCompany ? ['Reporting company'] : [])] },
  ],
  narrate: (a) => {
    const parts = [`${a.name} is listed`]
    if (a.reportingCompany) parts.push('as the reporting company')
    const shares: string[] = []
    if (a.equityShare !== undefined) shares.push(`${a.equityShare}% under equity share`)
    if (a.financialControlShare !== undefined) shares.push(`${a.financialControlShare}% under financial control`)
    if (a.operationalControlShare !== undefined) shares.push(`${a.operationalControlShare}% under operational control`)
    if (shares.length) parts.push(`with ${shares.join(', ')}`)
    if (a.from) parts.push(`and "from ${a.from}" under its relationship`)
    if (a.heldThrough) parts.push(a.heldThrough === 'directly' ? 'held directly by the reporting company' : `held through ${a.heldThrough}`)
    return parts.join(' ') + '.'
  },
})

export const entityAbsent = defineOutcome({
  name: 'entityAbsent',
  args: z.object({ organization: orgArg, name: z.string() }).strict(),
  api: async (ctx, { organization: ref, name }) => {
    const org = await organization(ctx, ref)
    return (await entities(ctx.session(), org.id)).some((e) => e.name === name) ? fail(`'${name}' is still listed`) : pass()
  },
  ui: ({ organization: ref, name }) => [{ check: 'atOrg', organization: ref, section: S.org.sections.entities }, { check: 'rowAbsent', text: name }],
  narrate: ({ name }) => `${name} is no longer listed.`,
})

export const facilityListed = defineOutcome({
  name: 'facilityListed',
  args: z.object({ organization: orgArg, name: z.string(), entity: z.string().optional(), gridRegion: z.string().optional(), lease: z.string().optional() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const row = (await facilities(ctx.session(), org.id)).find((f) => f.name === a.name)
    if (!row) return fail(`no facility '${a.name}'`)
    if (a.entity && row.entityName !== a.entity) return fail(`${a.name} is under ${row.entityName}`)
    if (a.gridRegion && row.effectiveGridRegion !== a.gridRegion) return fail(`${a.name} has grid ${row.effectiveGridRegion}`)
    if (a.lease && row.leaseType !== a.lease) return fail(`${a.name} has lease ${row.leaseType}`)
    return pass()
  },
  ui: (a) => [
    { check: 'atOrg', organization: a.organization, section: S.org.sections.facilities },
    { check: 'rowHas', text: a.name, cells: [...(a.entity ? [a.entity] : []), ...(a.gridRegion ? [`grid ${a.gridRegion}`] : [])] },
  ],
  narrate: (a) => `${a.name} is listed${a.entity ? ` under ${a.entity}` : ''}${a.gridRegion ? `, with "grid ${a.gridRegion}"` : ''}${a.lease ? ', with its lease' : ''}.`,
})

export const streamListed = defineOutcome({
  name: 'streamListed',
  args: z.object({ organization: orgArg, facility: z.string(), name: z.string(), kind: z.string().optional(), contractorOperated: z.boolean().optional(), origin: z.enum(['REGISTER', 'INLINE', 'IMPORT']).optional() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const site = await facility(ctx.session(), org.id, a.facility)
    const row = (await streamsOf(ctx.session(), site.id)).find((s) => s.name === a.name)
    if (!row) return fail(`no stream '${a.name}' at ${a.facility}`)
    if (a.kind && row.kind !== a.kind) return fail(`${a.name} is ${row.kind}`)
    if (a.origin && row.origin !== a.origin) return fail(`${a.name} was born ${row.origin}`)
    if (a.contractorOperated !== undefined && row.contractorOperated !== a.contractorOperated) return fail(`${a.name} contractorOperated is ${row.contractorOperated}`)
    return pass()
  },
  ui: (a) => [
    { check: 'atOrg', organization: a.organization, section: S.org.sections.facilities },
    { check: 'rowPageHas', row: a.facility, button: S.org.button.emissionSources, heading: S.org.button.emissionSources, text: a.name },
    ...(a.origin === 'IMPORT' ? [{ check: 'rowPageHas', row: a.facility, button: S.org.button.emissionSources, heading: S.org.button.emissionSources, text: S.act.text.addedDuringImport } as const] : []),
  ],
  narrate: (a) =>
    `${a.name} is listed at ${a.facility}${a.contractorOperated ? ' as "contractor-operated"' : a.contractorOperated === false ? ' as "owned or controlled"' : ''}${a.kind ? ` with its kind, ${S.org.option.kind[a.kind] ?? a.kind}` : ''}${a.origin === 'IMPORT' ? ` and "${S.act.text.addedDuringImport}"` : ''}.`,
})

export const streamAbsent = defineOutcome({
  name: 'streamAbsent',
  args: z.object({ organization: orgArg, facility: z.string(), name: z.string() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const site = await facility(ctx.session(), org.id, a.facility)
    return (await streamsOf(ctx.session(), site.id)).some((s) => s.name === a.name) ? fail(`'${a.name}' is still listed at ${a.facility}`) : pass()
  },
  ui: () => [{ check: 'na', why: 'the absence of a row is read from the API; the page lists what remains' }],
  narrate: (a) => `${a.name} is no longer listed at ${a.facility}.`,
})

export const customUnitListed = defineOutcome({
  name: 'customUnitListed',
  args: z.object({ organization: orgArg, code: z.string(), definition: z.string().optional() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const out = await ctx.session().get(`/api/ghg/organizations/${org.id}/custom-units`)
    if (!out.ok) return fail(`could not list units: ${out.status}`)
    const row = (out.body as Array<{ code: string; definition: string }>).find((u) => u.code === a.code)
    if (!row) return fail(`no custom unit '${a.code}'`)
    if (a.definition && row.definition !== a.definition) return fail(`${a.code} is defined as ${row.definition}`)
    return pass(row.definition)
  },
  ui: (a) => [{ check: 'atOrg', organization: a.organization, section: S.org.sections.units }, { check: 'rowHas', text: a.code, cells: a.definition ? [a.definition] : [] }],
  narrate: (a) => `${a.code} is listed${a.definition ? ` as ${a.definition}` : ''}.`,
})

export const densityListed = defineOutcome({
  name: 'densityListed',
  args: z.object({ organization: orgArg, material: z.string(), typical: z.boolean().optional(), kgPerLitre: z.number().optional() }).strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const out = await ctx.session().get(`/api/ghg/organizations/${org.id}/densities`)
    if (!out.ok) return fail(`could not list densities: ${out.status}`)
    const row = (out.body as Array<{ material: string; typical: boolean; kgPerLitre: number }>).find((d) => d.material === a.material)
    if (!row) return fail(`no density for '${a.material}'`)
    if (a.typical !== undefined && row.typical !== a.typical) return fail(`${a.material} typical is ${row.typical}`)
    if (a.kgPerLitre !== undefined && Number(row.kgPerLitre) !== a.kgPerLitre) return fail(`${a.material} is ${row.kgPerLitre} kg per litre`)
    return pass()
  },
  ui: (a) => [
    { check: 'atOrg', organization: a.organization, section: S.org.sections.units },
    { check: 'rowHas', text: a.material, cells: a.typical ? [S.org.text.typicalValue] : [] },
  ],
  narrate: (a) =>
    a.typical
      ? `${a.material}${a.kgPerLitre !== undefined ? ` at ${a.kgPerLitre} kg per litre` : ''} is listed as a **${S.org.text.typicalValue}** and offers no **Delete**.`
      : `${a.material} is listed without the typical flag, with a **Delete** button.`,
})

export const factorListed = defineOutcome({
  name: 'factorListed',
  args: z
    .object({
      organization: orgArg,
      name: z.string(),
      approved: z.boolean().optional(),
      approvedBy: actorArg.optional(),
      selfApproved: z.boolean().optional(),
      validTo: z.string().optional(),
      versions: z.array(z.string()).optional(),
    })
    .strict(),
  api: async (ctx, a) => {
    const org = await organization(ctx, a.organization)
    const row = (await searchFactors(ctx.session(), org.id, a.name)).find((f) => f.name === a.name)
    if (!row) return fail(`no factor '${a.name}'`)
    if (a.approved !== undefined && row.approved !== a.approved) return fail(`${a.name} approved is ${row.approved}`)
    if (a.approvedBy && row.approvedBy !== account(ctx, a.approvedBy).email) return fail(`${a.name} approved by ${row.approvedBy}`)
    if (a.selfApproved !== undefined && row.selfApproved !== a.selfApproved) return fail(`${a.name} selfApproved is ${row.selfApproved}`)
    if (a.validTo && row.validTo !== a.validTo) return fail(`${a.name} valid to ${row.validTo}`)
    if (a.versions) {
      // a lineage with one vintage comes back without its chain (spec 02.6): the row is then its only version
      const editions = (row.versions?.length ? row.versions : [row]).map((v) => v.sourceEdition ?? '').sort()
      const want = [...a.versions].sort()
      if (editions.join(',') !== want.join(',')) return fail(`${a.name} has versions ${editions.join(', ')}`)
    }
    return pass()
  },
  ui: (a) => [
    { check: 'atOrg', organization: a.organization, section: S.org.sections.factors },
    { check: 'search', label: S.org.field.searchFactors, value: a.name },
    {
      check: 'rowHas',
      text: a.name,
      cells: [
        ...(a.approved === true ? [S.org.text.approved] : a.approved === false ? [S.org.text.notApproved] : []),
        ...(a.approvedBy ? [`by {email:${a.approvedBy}}`] : []),
        ...(a.selfApproved ? [S.org.text.selfApproved] : []),
        ...(a.validTo ? [a.validTo] : []),
      ],
    },
  ],
  narrate: (a, n) => {
    const parts = [`"${a.name}" is listed`]
    if (a.approved === false) parts.push(`as **${S.org.text.notApproved}**`)
    if (a.approved === true) parts.push(`as **${S.org.text.approved}**`)
    if (a.approvedBy) parts.push(`"by ${n.actorAlias(a.approvedBy)}" with the date`)
    if (a.selfApproved) parts.push(`and "${S.org.text.selfApproved}"`)
    if (a.validTo) parts.push(`with its validity ending ${a.validTo}`)
    if (a.versions) parts.push(a.versions.length === 1 ? `with one version, ${a.versions[0]}` : `with ${a.versions.length} versions: ${a.versions.join(' and ')}`)
    return parts.join(' ') + '.'
  },
})

export const factorsEmpty = defineOutcome({
  name: 'factorsEmpty',
  args: z.object({ organization: orgArg }).strict(),
  api: async (ctx, { organization: ref }) => {
    const org = await organization(ctx, ref)
    const rows = await searchFactors(ctx.session(), org.id, '')
    return rows.length === 0 ? pass() : fail(`${rows.length} factors listed`)
  },
  ui: ({ organization: ref }) => [{ check: 'atOrg', organization: ref, section: S.org.sections.factors }, { check: 'textVisible', text: S.org.text.ownFactors }],
  narrate: () => `**${S.org.text.ownFactors}** is empty.`,
})

/** What the import reported: the figures the pack's seed produces on a fresh deployment. */
export const importResult = defineOutcome({
  name: 'importResult',
  args: z.object({ added: z.number().int(), versioned: z.number().int(), discontinued: z.number().int().optional() }).strict(),
  api: async (_ctx, a, last) => {
    if (!last) return fail('no import to read')
    if (!last.ok) return fail(`the import was refused with ${last.status}`)
    const body = last.body as { created: number; versioned: number; discontinued?: string[] }
    if (body.created !== a.added || body.versioned !== a.versioned) return fail(`import reported ${body.created} added, ${body.versioned} versioned`)
    if (a.discontinued !== undefined && (body.discontinued ?? []).length !== a.discontinued) return fail(`import reported ${(body.discontinued ?? []).length} discontinued lineages`)
    return pass()
  },
  ui: (a) => [{ check: 'toast', text: `${a.added} added, ${a.versioned} versioned` }],
  narrate: (a) =>
    `The import reports "${a.added} added, ${a.versioned} versioned"${a.discontinued ? ` and that ${a.discontinued} lineages this edition drops were retired by nobody` : ''}.`,
})

export { notApplicable }
export const organizationOutcomes = [
  organizationListed,
  organizationAbsent,
  myRole,
  memberListed,
  memberAbsent,
  historyHas,
  historyCount,
  cannotWrite,
  entityListed,
  entityAbsent,
  facilityListed,
  streamListed,
  customUnitListed,
  densityListed,
  factorListed,
  factorsEmpty,
  importResult,
  streamAbsent,
]
