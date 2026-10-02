import { z } from 'zod'
import { defineVerb } from '../contract.ts'
import { account, actorArg, tok } from '../helpers.ts'
import { ORG_LABEL, members, orgArg, organization, splitOrgRef } from '../organizations.ts'
import { S } from '../ui/surface.ts'

/** The organization and its members (specs 01.2, 01.7, 01.8). */

const roleArg = z.enum(['OWNER', 'REVIEWER', 'PREPARER', 'VERIFIER'])

export const createOrganization = defineVerb({
  name: 'createOrganization',
  args: z.object({ name: z.string(), confirmDuplicate: z.boolean().optional() }).strict(),
  api: async (ctx, { name, confirmDuplicate }) =>
    ctx.session().post('/api/ghg/organizations', { name, allowDuplicateName: confirmDuplicate === true }),
  ui: ({ name, confirmDuplicate }) => [
    { op: 'open', nav: S.nav.ghg },
    { op: 'click', button: S.button.newOrganization },
    { op: 'fill', label: S.org.field.name, value: name, within: S.org.dialog.newOrganization },
    { op: 'click', button: S.org.button.createOrganization, within: S.org.dialog.newOrganization },
    ...(confirmDuplicate ? [{ op: 'click', button: S.org.button.createAnyway, within: S.org.dialog.newOrganization } as const] : []),
  ],
  // the newest organization of that exact name is the one just created
  postconditions: ({ name }) => [{ outcome: 'organizationListed', args: { organization: name } }],
})

export const renameOrganization = defineVerb({
  name: 'renameOrganization',
  args: z.object({ organization: orgArg, name: z.string(), confirmDuplicate: z.boolean().optional() }).strict(),
  api: async (ctx, { organization: ref, name, confirmDuplicate }) => {
    const org = await organization(ctx, ref)
    const current = await ctx.session().get(`/api/ghg/organizations/${org.id}`)
    if (!current.ok) return current
    const body = current.body as { address: string | null; contact: string | null }
    return ctx.session().put(`/api/ghg/organizations/${org.id}`, {
      name,
      address: body.address,
      contact: body.contact,
      allowDuplicateName: confirmDuplicate === true,
    })
  },
  ui: ({ organization: ref, name, confirmDuplicate }) => [
    { op: 'orgPage', organization: ref, section: S.org.sections.settings },
    { op: 'fill', label: S.org.field.name, value: name },
    { op: 'click', button: S.org.button.saveDetails },
    ...(confirmDuplicate ? [{ op: 'click', button: S.org.button.saveAnyway } as const] : []),
  ],
  postconditions: ({ organization: ref, name }) => {
    const { index } = splitOrgRef(ref)
    return [{ outcome: 'organizationListed', args: { organization: index ? `${name} #${index}` : name } }]
  },
})

export const deleteOrganization = defineVerb({
  name: 'deleteOrganization',
  args: z.object({ organization: orgArg, reason: z.string() }).strict(),
  api: async (ctx, { organization: ref, reason }) => {
    const org = await organization(ctx, ref)
    return ctx.session().delete(`/api/ghg/organizations/${org.id}`, { name: org.name, reason })
  },
  ui: ({ organization: ref, reason }) => [
    { op: 'orgPage', organization: ref, section: S.org.sections.settings },
    { op: 'click', button: S.org.button.deleteOrganization },
    { op: 'fill', label: `Type ${splitOrgRef(ref).name} to confirm`, value: splitOrgRef(ref).name, within: S.org.dialog.deleteOrganization },
    { op: 'fill', label: S.org.field.reason, value: reason, within: S.org.dialog.deleteOrganization },
    { op: 'click', button: 'Delete', within: S.org.dialog.deleteOrganization },
  ],
  postconditions: ({ organization: ref }) => [{ outcome: 'organizationAbsent', args: { organization: ref } }],
})

export const openOrganization = defineVerb({
  name: 'openOrganization',
  args: z.object({ organization: orgArg }).strict(),
  api: async (ctx, { organization: ref }) => {
    const org = await organization(ctx, ref)
    return ctx.session().get(`/api/ghg/organizations/${org.id}`)
  },
  ui: ({ organization: ref }) => [{ op: 'orgPage', organization: ref, section: S.org.sections.overview }],
  postconditions: () => [],
  narrate: ({ organization: ref }) => `Open ${splitOrgRef(ref).name}.`,
})

export const addMember = defineVerb({
  name: 'addMember',
  args: z.object({ organization: orgArg, user: actorArg.optional(), email: z.string().optional(), role: roleArg }).strict()
    .refine((a) => (a.user ? 1 : 0) + (a.email ? 1 : 0) === 1, { message: 'name an actor or an address' }),
  api: async (ctx, { organization: ref, user, email, role }) => {
    const org = await organization(ctx, ref)
    return ctx.session().post(`/api/ghg/organizations/${org.id}/members`, { email: user ? account(ctx, user).email : email, role })
  },
  ui: ({ organization: ref, user, email, role }) => [
    { op: 'orgPage', organization: ref, section: S.org.sections.settings },
    { op: 'fill', label: S.org.field.memberEmail, value: user ? tok.email(user) : email! },
    { op: 'choose', label: S.org.field.role, option: S.org.option.memberRole[role]! },
    { op: 'click', button: S.org.button.addMember },
  ],
  postconditions: ({ organization: ref, user, role }) => (user ? [{ outcome: 'memberListed', args: { organization: ref, user, role } }] : []),
  narrate: ({ user, email, role }) =>
    `Under **Members**, add ${user ? tok.email(user) : `\`${email}\``} as **${S.org.option.memberRole[role]}**.`,
})

export const changeMemberRole = defineVerb({
  name: 'changeMemberRole',
  args: z.object({ organization: orgArg, user: actorArg, role: roleArg }).strict(),
  api: async (ctx, { organization: ref, user, role }) => {
    const org = await organization(ctx, ref)
    const member = (await members(ctx.session(), org.id)).find((m) => m.email === account(ctx, user).email)
    if (!member) return { status: 404, ok: false, body: { detail: `${user} is not a member` } }
    return ctx.session().put(`/api/ghg/organizations/${org.id}/members/${member.id}`, { role })
  },
  ui: ({ organization: ref, user, role }) => [
    { op: 'orgPage', organization: ref, section: S.org.sections.settings },
    { op: 'choose', label: `Role of {name:${user}}`, option: S.org.option.memberRole[role]! },
  ],
  postconditions: ({ organization: ref, user, role }) => [{ outcome: 'memberListed', args: { organization: ref, user, role } }],
  narrate: ({ user, role }) => `Change the role of ${tok.name(user)} to **${S.org.option.memberRole[role]}**.`,
})

export const removeMember = defineVerb({
  name: 'removeMember',
  args: z.object({ organization: orgArg, user: actorArg }).strict(),
  api: async (ctx, { organization: ref, user }) => {
    const org = await organization(ctx, ref)
    const member = (await members(ctx.session(), org.id)).find((m) => m.email === account(ctx, user).email)
    if (!member) return { status: 404, ok: false, body: { detail: `${user} is not a member` } }
    return ctx.session().delete(`/api/ghg/organizations/${org.id}/members/${member.id}`)
  },
  ui: ({ organization: ref, user }) => [
    { op: 'orgPage', organization: ref, section: S.org.sections.settings },
    { op: 'click', button: `Remove {name:${user}}` },
  ],
  postconditions: ({ organization: ref, user }) => [{ outcome: 'memberAbsent', args: { organization: ref, user } }],
  narrate: ({ user }) => `Click **${S.org.button.remove}** on the row of ${tok.name(user)}.`,
})

export { ORG_LABEL }
export const organizationVerbs = [createOrganization, renameOrganization, deleteOrganization, openOrganization, addMember, changeMemberRole, removeMember]
