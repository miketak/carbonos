import { z } from 'zod'
import { defineOutcome, fail, pass } from '../contract.ts'
import { account, actorArg } from '../helpers.ts'
import { S } from '../ui/surface.ts'

/** Statements about sessions, mail and what a signed-in member sees. */

export const signedIn = defineOutcome({
  name: 'signedIn',
  args: z.object({ user: actorArg }).strict(),
  api: async (ctx, { user }) => {
    const out = await ctx.sessionOf(user).get('/api/auth/me')
    return out.ok ? pass() : fail(`${user} is not signed in (${out.status})`)
  },
  ui: () => [{ check: 'signedIn' }],
  narrate: ({ user }, n) => `${n.actorName(user)} is signed in.`,
})

export const sessionEnded = defineOutcome({
  name: 'sessionEnded',
  args: z.object({ user: actorArg }).strict(),
  api: async (ctx, { user }) => {
    const out = await ctx.sessionOf(user).get('/api/auth/me')
    return out.status === 401 ? pass() : fail(`${user}'s session is still live (${out.status})`)
  },
  ui: () => [{ check: 'signedOut' }],
  narrate: ({ user }, n) => `${n.actorName(user)}'s session has ended: the sign-in page.`,
})

/** Every session of the account but the one that acted. */
export const otherSessionsEnded = defineOutcome({
  name: 'otherSessionsEnded',
  args: z.object({ user: actorArg }).strict(),
  api: async (ctx, { user }) => {
    const email = account(ctx, user).email
    const others = Object.keys(ctx.pack.actors).filter((k) => k !== user && ctx.actorOf(k).account?.email === email)
    for (const other of others) {
      const out = await ctx.sessionOf(other).get('/api/auth/me')
      if (out.status !== 401) return fail(`the other session (${other}) is still live (${out.status})`)
    }
    const mine = await ctx.sessionOf(user).get('/api/auth/me')
    return mine.ok ? pass(`${others.length} other session(s) ended`) : fail(`the acting session ended too (${mine.status})`)
  },
  ui: () => [{ check: 'toast', text: S.text.passwordChanged }],
  narrate: () => `The toast reads "${S.text.passwordChanged}". This window stays signed in; every other session of the account is signed out.`,
})

export const allSessionsEnded = defineOutcome({
  name: 'allSessionsEnded',
  args: z.object({ user: actorArg }).strict(),
  api: async (ctx, { user }) => {
    const email = account(ctx, user).email
    const all = Object.keys(ctx.pack.actors).filter((k) => ctx.actorOf(k).account?.email === email)
    for (const key of all) {
      const out = await ctx.sessionOf(key).get('/api/auth/me')
      if (out.status !== 401) return fail(`the session of ${key} is still live (${out.status})`)
    }
    return pass()
  },
  ui: () => [{ check: 'textVisible', text: S.text.passwordIsReset }],
  narrate: () => `The sign-in page reads "${S.text.passwordIsReset}". Every session of the account has ended.`,
})

export const emailReceived = defineOutcome({
  name: 'emailReceived',
  args: z
    .object({ to: actorArg, subject: z.string(), containing: z.string().optional(), linkTo: z.string().optional() })
    .strict(),
  api: async (ctx, { to, subject, containing, linkTo }) => {
    const mail = await ctx.mail.latest(account(ctx, to).email, subject)
    if (!mail) return fail(`no email "${subject}" to ${to}`)
    if (containing && !mail.text.includes(containing)) return fail(`the email does not say "${containing}"`)
    if (linkTo && !mail.links.some((l) => l.includes(`${linkTo}?token=`))) return fail(`no ${linkTo} link in the email`)
    return pass(mail.id)
  },
  ui: () => [{ check: 'manual', text: 'read the mailbox' }],
  narrate: ({ subject, containing, linkTo }) => {
    const parts = [`The mailbox receives "${subject}"`]
    if (containing) parts.push(`saying "${containing}"`)
    if (linkTo) parts.push(`with a link to \`${linkTo}?token=...\` on this environment's address`)
    return parts.join(', ') + '.'
  },
})

/** The page's answer to a reset request, the same whether or not the address holds an account. */
export const resetRequestAccepted = defineOutcome({
  name: 'resetRequestAccepted',
  args: z.object({}).strict(),
  api: async (_ctx, _args, last) => (last?.ok ? pass() : fail(`the request was answered ${last?.status ?? 'nothing'}: ${String((last?.body as { detail?: string })?.detail ?? '')}`)),
  ui: () => [{ check: 'textVisible', text: S.text.resetLinkOnItsWay }],
  narrate: () => `The answer reads "If <the address> ${S.text.resetLinkOnItsWay}".`,
})

export const noEmail = defineOutcome({
  name: 'noEmail',
  args: z.object({ to: z.string(), subject: z.string() }).strict(),
  api: async (ctx, { to, subject }) => ((await ctx.mail.none(to, subject)) ? pass() : fail(`an email "${subject}" reached ${to}`)),
  ui: () => [{ check: 'manual', text: 'read the mailbox' }],
  narrate: ({ to, subject }) => `No email "${subject}" reaches ${to}.`,
})

export const organizationCount = defineOutcome({
  name: 'organizationCount',
  args: z.object({ user: actorArg, count: z.number().int() }).strict(),
  api: async (ctx, { user, count }) => {
    const out = await ctx.sessionOf(user).get('/api/ghg/organizations')
    if (!out.ok) return fail(`could not list organizations as ${user}: ${out.status}`)
    const n = (out.body as unknown[]).length
    return n === count ? pass(String(n)) : fail(`${n} organizations, expected ${count}`)
  },
  ui: ({ count }) => [{ check: 'at', nav: S.nav.ghg }, ...(count === 0 ? [{ check: 'textVisible', text: S.text.noOrganizationsYet } as const] : [])],
  narrate: ({ user, count }, n) =>
    count === 0 ? `${n.actorName(user)} lands on **${S.nav.ghg}** with no organizations.` : `${n.actorName(user)} sees ${count} organization(s).`,
})

export const canCreateOrganization = defineOutcome({
  name: 'canCreateOrganization',
  args: z.object({ user: actorArg, value: z.boolean() }).strict(),
  api: async (ctx, { user, value }) => {
    const out = await ctx.sessionOf(user).get('/api/ghg/organizations/capabilities')
    if (!out.ok) return fail(`could not read capabilities as ${user}: ${out.status}`)
    const may = (out.body as { mayCreateOrganization: boolean }).mayCreateOrganization
    return may === value ? pass(String(may)) : fail(`mayCreateOrganization is ${may}`)
  },
  ui: ({ value }) => [
    { check: 'at', nav: S.nav.ghg },
    { check: 'buttonVisible', button: S.button.newOrganization, visible: value },
    { check: 'textVisible', text: value ? S.text.createYourFirst : S.text.notAMember },
  ],
  narrate: ({ value }) =>
    value
      ? `**${S.button.newOrganization}** is offered and the empty state reads "${S.text.noOrganizationsYet}" over "${S.text.createYourFirst}".`
      : `**${S.button.newOrganization}** is gone. The empty state reads "${S.text.notAMember}".`,
})

export const sessionOutcomes = [signedIn, sessionEnded, otherSessionsEnded, allSessionsEnded, emailReceived, resetRequestAccepted, noEmail, organizationCount, canCreateOrganization]
