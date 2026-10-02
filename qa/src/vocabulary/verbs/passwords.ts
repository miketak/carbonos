import { z } from 'zod'
import { defineVerb } from '../contract.ts'
import { account, actorArg, passwordArg, resolvePassword, tok } from '../helpers.ts'
import { S } from '../ui/surface.ts'

/** Passwords: the emailed set-password link, the profile's change, the reset link (specs 01.1, 01.9). */

const ZEROS = '0'.repeat(64)

async function emailedToken(ctx: Parameters<typeof setPasswordFromLink.api>[0], user: string, subject: string, path: string) {
  const mail = await ctx.mail.latest(account(ctx, user).email, subject)
  const link = mail?.links.find((l) => l.includes(`${path}?token=`))
  if (!link) throw new Error(`no email "${subject}" with a ${path} link for ${user}`)
  return new URL(link).searchParams.get('token') ?? ''
}

export const setPasswordFromLink = defineVerb({
  name: 'setPasswordFromLink',
  args: z.object({ user: actorArg, password: passwordArg }).strict(),
  api: async (ctx, { user, password }) => {
    const token = await emailedToken(ctx, user, 'Your CarbonOS access is approved', '/set-password')
    const chosen = resolvePassword(ctx, user, password)
    const out = await ctx.sessionOf(user).post('/api/access-requests/complete', { token, password: chosen })
    if (out.ok) ctx.setPassword(user, chosen)
    return out
  },
  ui: ({ user, password }) => [
    { op: 'emailLink', actor: user, subject: 'Your CarbonOS access is approved', path: '/set-password' },
    { op: 'fill', label: S.field.newPassword, value: tok.password(user, password) },
    { op: 'fill', label: S.field.confirmPassword, value: tok.password(user, password) },
    { op: 'click', button: S.button.setPasswordAndSignIn },
  ],
  postconditions: ({ user }) => [
    { outcome: 'userListed', args: { user, status: 'ACTIVE' } },
    { outcome: 'signedIn', args: { user } },
  ],
})

export const openSetupLink = defineVerb({
  name: 'openSetupLink',
  args: z.object({ user: actorArg, link: z.enum(['emailed', 'forged']).default('emailed') }).strict(),
  api: async (ctx, { user, link }) => {
    const token = link === 'forged' ? ZEROS : await emailedToken(ctx, user, 'Your CarbonOS access is approved', '/set-password')
    return ctx.session().get(`/api/access-requests/setup/${token}`)
  },
  ui: ({ user, link }) => [
    { op: 'emailLink', actor: user, subject: 'Your CarbonOS access is approved', path: '/set-password', forged: link === 'forged' },
  ],
  postconditions: () => [],
})

export const renameProfile = defineVerb({
  name: 'renameProfile',
  args: z.object({ user: actorArg, displayName: z.string() }).strict(),
  api: async (ctx, { displayName }) => ctx.session().put('/api/profile', { displayName }),
  ui: ({ displayName }) => [
    { op: 'accountMenu', item: S.nav.editProfile },
    { op: 'fill', label: S.field.displayName, value: displayName },
    { op: 'click', button: S.button.saveChanges },
  ],
  postconditions: ({ user, displayName }) => [{ outcome: 'displayName', args: { user, name: displayName } }],
})

export const changePassword = defineVerb({
  name: 'changePassword',
  args: z.object({ user: actorArg, current: passwordArg, new: z.string() }).strict(),
  api: async (ctx, { user, current, new: next }) => {
    const out = await ctx.session().put('/api/profile/password', {
      currentPassword: resolvePassword(ctx, user, current),
      newPassword: next,
    })
    if (out.ok) ctx.setPassword(user, next)
    return out
  },
  ui: ({ user, current, new: next }) => [
    { op: 'accountMenu', item: S.nav.editProfile },
    { op: 'fill', label: S.field.currentPassword, value: tok.password(user, current) },
    { op: 'fill', label: S.field.newPassword, value: next },
    { op: 'fill', label: S.field.confirmNewPassword, value: next },
    { op: 'click', button: S.button.changePassword },
  ],
  postconditions: ({ user }) => [
    { outcome: 'otherSessionsEnded', args: { user } },
    { outcome: 'emailReceived', args: { to: user, subject: 'Your CarbonOS password was changed' } },
  ],
})

export const requestPasswordReset = defineVerb({
  name: 'requestPasswordReset',
  args: z
    .object({ user: actorArg.optional(), email: z.string().optional() })
    .strict()
    .refine((a) => (a.user ? 1 : 0) + (a.email ? 1 : 0) === 1, { message: 'name an actor or an address' }),
  api: async (ctx, { user, email }) =>
    ctx.session().post('/api/auth/password-reset', { email: user ? account(ctx, user).email : email }),
  ui: ({ user, email }) => [
    { op: 'goto', path: '/login' },
    { op: 'click', button: S.nav.forgotPassword },
    { op: 'fill', label: S.field.email, value: user ? tok.email(user) : email! },
    { op: 'click', button: S.button.sendResetLink },
  ],
  postconditions: () => [{ outcome: 'resetRequestAccepted', args: {} }],
})

export const resetPasswordFromLink = defineVerb({
  name: 'resetPasswordFromLink',
  args: z.object({ user: actorArg, password: passwordArg, confirm: z.string().optional() }).strict(),
  api: async (ctx, { user, password, confirm }) => {
    const chosen = resolvePassword(ctx, user, password)
    if (confirm !== undefined && confirm !== chosen) {
      return { status: 0, ok: false, na: 'the confirmation field belongs to the page, not the server' }
    }
    const token = await emailedToken(ctx, user, 'Reset your CarbonOS password', '/reset-password')
    const out = await ctx.session().post('/api/auth/password-reset/complete', { token, password: chosen })
    if (out.ok) ctx.setPassword(user, chosen)
    return out
  },
  ui: ({ user, password, confirm }) => [
    { op: 'emailLink', actor: user, subject: 'Reset your CarbonOS password', path: '/reset-password' },
    { op: 'fill', label: S.field.newPassword, value: tok.password(user, password) },
    { op: 'fill', label: S.field.confirmPassword, value: confirm ?? tok.password(user, password) },
    { op: 'click', button: S.button.setNewPassword },
  ],
  postconditions: ({ user }) => [{ outcome: 'allSessionsEnded', args: { user } }],
})

export const openResetLink = defineVerb({
  name: 'openResetLink',
  args: z.object({ user: actorArg, link: z.enum(['emailed', 'forged']).default('emailed') }).strict(),
  api: async (ctx, { user, link }) => {
    const token = link === 'forged' ? ZEROS : await emailedToken(ctx, user, 'Reset your CarbonOS password', '/reset-password')
    return ctx.session().get(`/api/auth/password-reset/${token}`)
  },
  ui: ({ user, link }) => [
    { op: 'emailLink', actor: user, subject: 'Reset your CarbonOS password', path: '/reset-password', forged: link === 'forged' },
  ],
  postconditions: () => [],
})

export const passwordVerbs = [
  setPasswordFromLink,
  openSetupLink,
  renameProfile,
  changePassword,
  requestPasswordReset,
  resetPasswordFromLink,
  openResetLink,
]
