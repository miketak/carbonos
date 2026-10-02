import { z } from 'zod'
import { defineVerb } from '../contract.ts'
import { account, actorArg, passwordArg, resolvePassword, tok } from '../helpers.ts'
import { S } from '../ui/surface.ts'

/** Signing in and out, and what a visitor does on the landing page. */

export const signIn = defineVerb({
  name: 'signIn',
  args: z.object({ user: actorArg, password: passwordArg }).strict(),
  api: async (ctx, { user, password }) => {
    const acct = account(ctx, user)
    return ctx.sessionOf(user).post('/api/auth/login', {
      email: acct.email,
      password: resolvePassword(ctx, user, password),
    })
  },
  ui: ({ user, password }) => [{ op: 'signIn', email: tok.email(user), password: tok.password(user, password) }],
  postconditions: ({ user }) => [{ outcome: 'signedIn', args: { user } }],
  narrate: ({ user, password }) =>
    password === '{wrong}'
      ? `Try to sign in as ${tok.name(user)} with any password.`
      : password
        ? `Sign in as ${tok.name(user)} with \`${password}\`.`
        : `Sign in as ${tok.name(user)}.`,
})

export const signOut = defineVerb({
  name: 'signOut',
  args: z.object({ user: actorArg }).strict(),
  api: async (ctx, { user }) => ctx.sessionOf(user).post('/api/auth/logout'),
  ui: () => [{ op: 'signOut' }],
  postconditions: ({ user }) => [{ outcome: 'sessionEnded', args: { user } }],
})

export const requestAccess = defineVerb({
  name: 'requestAccess',
  args: z.object({ user: actorArg, company: z.string().optional() }).strict(),
  api: async (ctx, { user, company }) => {
    const acct = account(ctx, user)
    return ctx.session().post('/api/access-requests', {
      email: acct.email,
      displayName: acct.name,
      company: company ?? null,
    })
  },
  ui: ({ user, company }) => [
    { op: 'goto', path: '/' },
    { op: 'click', button: S.button.requestAccess },
    { op: 'fill', label: S.field.fullName, value: tok.name(user), within: S.dialog.requestAccess },
    { op: 'fill', label: S.field.workEmail, value: tok.email(user), within: S.dialog.requestAccess },
    ...(company ? [{ op: 'fill', label: S.field.company, value: company, within: S.dialog.requestAccess } as const] : []),
    { op: 'click', button: S.button.requestAccess, within: S.dialog.requestAccess },
  ],
  postconditions: ({ user }) => [{ outcome: 'accessRequestStatus', args: { user, status: 'PENDING' } }],
})

export const authVerbs = [signIn, signOut, requestAccess]
