import { z } from 'zod'
import { defineOutcome, fail, pass } from '../contract.ts'
import { account, actorArg, findUser, listUsers } from '../helpers.ts'
import { S, accessRequestsWaiting } from '../ui/surface.ts'

/** Statements about accounts and access requests (specs 01, 01.1). */

const roleArg = z.enum(['ADMIN', 'MEMBER', '{role}']).optional()
const statusArg = z.enum(['ACTIVE', 'DISABLED', 'PENDING']).optional()

export const userListed = defineOutcome({
  name: 'userListed',
  args: z.object({ user: actorArg, role: roleArg, status: statusArg }).strict(),
  api: async (ctx, { user, role, status }) => {
    const row = await findUser(ctx, user)
    if (!row) return fail(`${user} is not listed`)
    const wantRole = role === '{role}' ? account(ctx, user).platformRole : role
    if (wantRole && row.role !== wantRole) return fail(`${user} has role ${row.role}, not ${wantRole}`)
    if (status && row.status !== status) return fail(`${user} has status ${row.status}, not ${status}`)
    return pass(`${row.role} ${row.status}`)
  },
  ui: ({ user, role, status }) => [
    { check: 'at', nav: S.nav.users },
    {
      check: 'rowHas',
      text: `{name:${user}}`,
      cells: [
        ...(role ? [role === '{role}' ? `{roleLabel:${user}}` : S.option.role[role]!] : []),
        ...(status ? [S.option.status[status]!] : []),
      ],
    },
  ],
  narrate: ({ user, role, status }, n) => {
    const roleText = role ? (role === '{role}' ? `{roleLabel:${user}}` : S.option.role[role]) : undefined
    const parts = [roleText, status ? S.option.status[status] : undefined].filter(Boolean)
    return `${n.actorName(user)} is listed${parts.length ? ` as ${parts.join(', ')}` : ''}.`
  },
})

export const userAbsent = defineOutcome({
  name: 'userAbsent',
  args: z.object({ user: actorArg }).strict(),
  api: async (ctx, { user }) => ((await findUser(ctx, user)) ? fail(`${user} is listed`) : pass()),
  ui: ({ user }) => [{ check: 'at', nav: S.nav.users }, { check: 'rowAbsent', text: `{name:${user}}` }],
  narrate: ({ user }, n) => `${n.actorName(user)} is not listed; nothing was created.`,
})

export const userCount = defineOutcome({
  name: 'userCount',
  args: z
    .object({ equals: z.number().int().optional(), since: z.string().optional(), added: z.number().int().optional() })
    .strict()
    .refine((a) => a.equals !== undefined || (a.since && a.added !== undefined), {
      message: 'give equals, or since (a captured count) and added',
    }),
  api: async (ctx, { equals, since, added }) => {
    const count = (await listUsers(await ctx.admin())).length
    const want = equals ?? ctx.captured(since!) + added!
    return count === want ? pass(String(count)) : fail(`${count} accounts, expected ${want}`)
  },
  measureApi: async (ctx) => (await listUsers(await ctx.admin())).length,
  ui: ({ equals, since, added }) => [
    { check: 'at', nav: S.nav.dashboard },
    { check: 'count', nav: S.nav.dashboard, label: S.tile.users, equals, since, added },
  ],
  narrate: ({ equals, since, added }) =>
    equals !== undefined
      ? `**${S.tile.users}** reads ${equals}.`
      : `**${S.tile.users}** reads ${words(added!)} more than in {capture:${since}}.`,
})

export const accessRequestStatus = defineOutcome({
  name: 'accessRequestStatus',
  args: z.object({ user: actorArg, status: z.enum(['PENDING', 'APPROVED', 'COMPLETED', 'DENIED']) }).strict(),
  api: async (ctx, { user, status }) => {
    const email = account(ctx, user).email
    const out = await (await ctx.admin()).get('/api/admin/access-requests')
    if (!out.ok) return fail(`could not list access requests: ${out.status}`)
    const rows = (out.body as Array<{ email: string; status: string }>).filter((r) => r.email === email)
    if (rows.length === 0) return fail(`no access request for ${user}`)
    return rows.some((r) => r.status === status) ? pass(status) : fail(`request of ${user} is ${rows.map((r) => r.status).join(', ')}`)
  },
  ui: ({ user, status }) =>
    status === 'PENDING'
      ? [{ check: 'at', nav: S.nav.accessRequests }, { check: 'rowHas', text: `{name:${user}}`, cells: [`{email:${user}}`] }]
      : [
          { check: 'at', nav: S.nav.accessRequests },
          { check: 'rowHas', text: `{name:${user}}`, cells: [S.option.accessOutcome[status]!] },
        ],
  narrate: ({ user, status }, n) =>
    status === 'PENDING'
      ? `${n.actorName(user)}'s request is listed under **${S.heading.waitingForADecision}**.`
      : `${n.actorName(user)}'s request is listed under **${S.heading.alreadyDecided}** as "${S.option.accessOutcome[status]}".`,
})

/** What the visitor sees: the dialog thanks them by name; what the record holds: a pending request. */
export const accessRequestSubmitted = defineOutcome({
  name: 'accessRequestSubmitted',
  args: z.object({ user: actorArg }).strict(),
  api: async (ctx, { user }) => {
    const email = account(ctx, user).email
    const out = await (await ctx.admin()).get('/api/admin/access-requests')
    if (!out.ok) return fail(`could not list access requests: ${out.status}`)
    const rows = (out.body as Array<{ email: string; status: string }>).filter((r) => r.email === email)
    return rows.some((r) => r.status === 'PENDING') ? pass() : fail(`no pending request for ${user}`)
  },
  ui: ({ user }) => [{ check: 'textVisible', text: `${S.text.thanks} {name:${user}}` }],
  narrate: ({ user }, n) => `The dialog thanks ${n.actorName(user).split(' ')[0]} by name and says the request is with the team.`,
})

export const accessRequestsPending = defineOutcome({
  name: 'accessRequestsPending',
  args: z.object({ count: z.number().int() }).strict(),
  api: async (ctx, { count }) => {
    const out = await (await ctx.admin()).get('/api/admin/summary/accounts')
    if (!out.ok) return fail(`could not read the summary: ${out.status}`)
    const pending = (out.body as { accessRequestsPending: number }).accessRequestsPending
    return pending === count ? pass(String(pending)) : fail(`${pending} pending, expected ${count}`)
  },
  ui: ({ count }) => [
    { check: 'at', nav: S.nav.dashboard },
    count > 0
      ? { check: 'textVisible', text: accessRequestsWaiting(count) }
      : { check: 'textAbsent', text: `${S.text.accessRequest}s waiting` },
  ],
  narrate: ({ count }) =>
    count > 0 ? `A line reads "${accessRequestsWaiting(count)}".` : `No access request is waiting.`,
})

export const displayName = defineOutcome({
  name: 'displayName',
  args: z.object({ user: actorArg, name: z.string() }).strict(),
  api: async (ctx, { user, name }) => {
    const row = await findUser(ctx, user)
    if (!row) return fail(`${user} is not listed`)
    return row.displayName === name ? pass(name) : fail(`display name is "${row.displayName}"`)
  },
  ui: ({ name }) => [{ check: 'textVisible', text: name, within: 'header' }],
  narrate: ({ name }) => `The name at the top right reads "${name}".`,
})

export const platformRole = defineOutcome({
  name: 'platformRole',
  args: z.object({ user: actorArg, role: z.enum(['ADMIN', 'MEMBER']) }).strict(),
  api: async (ctx, { user, role }) => {
    const row = await findUser(ctx, user)
    if (!row) return fail(`${user} is not listed`)
    return row.role === role ? pass(role) : fail(`${user} is ${row.role}`)
  },
  // read from GHG accounting: inside the administration area the entry is absent, the sidebar is the navigation there
  ui: ({ role }) => [{ check: 'at', nav: S.nav.ghg }, { check: 'buttonVisible', button: `menu:${S.nav.administration}`, visible: role === 'ADMIN' }],
  narrate: ({ role }) =>
    role === 'ADMIN'
      ? `The account menu lists **${S.nav.editProfile}**, **${S.nav.help}**, **${S.nav.administration}** and **${S.button.signOut}**.`
      : `The account menu lists **${S.nav.editProfile}**, **${S.nav.help}** and **${S.button.signOut}**; there is no **${S.nav.administration}** entry.`,
})

export const platformAccess = defineOutcome({
  name: 'platformAccess',
  args: z.object({ user: actorArg, value: z.boolean() }).strict(),
  api: async (ctx, { user, value }) => {
    const out = await ctx.sessionOf(user).get('/api/admin/users')
    if (value) return out.ok ? pass() : fail(`${user} got ${out.status} from the platform area`)
    return out.status === 403 ? pass('403') : fail(`${user} got ${out.status}, expected 403`)
  },
  ui: ({ value }) => [{ check: 'visit', path: '/admin/users' }, value ? { check: 'textVisible', text: S.button.addUser } : { check: 'textAbsent', text: S.button.addUser }],
  narrate: ({ value }) => (value ? `The **${S.nav.users}** page opens.` : `Refused: a member does not reach the platform area.`),
})

function words(n: number): string {
  return ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n] ?? String(n)
}

export const accountOutcomes = [userListed, userAbsent, userCount, accessRequestStatus, accessRequestSubmitted, accessRequestsPending, displayName, platformRole, platformAccess]
