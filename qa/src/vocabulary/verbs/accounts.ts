import { z } from 'zod'
import { defineVerb } from '../contract.ts'
import { account, actorArg, findUser, passwordArg, resolvePassword, tok } from '../helpers.ts'
import { S } from '../ui/surface.ts'

/** What an administrator does to accounts on Users and Access requests (specs 01, 01.1). */

export const createUser = defineVerb({
  name: 'createUser',
  args: z.object({ user: actorArg, password: passwordArg }).strict(),
  api: async (ctx, { user, password }) => {
    const acct = account(ctx, user)
    return ctx.session().post('/api/admin/users', {
      email: acct.email,
      displayName: acct.name,
      role: acct.platformRole,
      temporaryPassword: resolvePassword(ctx, user, password),
    })
  },
  ui: ({ user, password }) => [
    { op: 'open', nav: S.nav.users },
    { op: 'click', button: S.button.addUser },
    { op: 'fill', label: S.field.email, value: tok.email(user), within: S.dialog.addUser },
    { op: 'fill', label: S.field.displayName, value: tok.name(user), within: S.dialog.addUser },
    { op: 'choose', label: S.field.role, option: `{role:${user}}`, within: S.dialog.addUser },
    { op: 'fill', label: S.field.temporaryPassword, value: tok.password(user, password), within: S.dialog.addUser },
    { op: 'click', button: S.button.addUser, within: S.dialog.addUser },
  ],
  postconditions: ({ user }) => [{ outcome: 'userListed', args: { user, role: '{role}', status: 'ACTIVE' } }],
  narrate: ({ user, password }) =>
    `Click **${S.button.addUser}**. Fill in ${tok.email(user)}, the display name ${tok.name(user)}, the role **{role:${user}}** and the temporary password ${password ? `\`${password}\`` : tok.password(user)}. Submit.`,
})

const roleArg = z.enum(['ADMIN', 'MEMBER'])

export const changeUserRole = defineVerb({
  name: 'changeUserRole',
  args: z.object({ user: actorArg, role: roleArg }).strict(),
  api: async (ctx, { user, role }) => {
    const row = await findUser(ctx, user)
    if (!row) return { status: 404, ok: false, body: { detail: `no account for ${user}` } }
    return ctx.session().put(`/api/admin/users/${row.id}`, { displayName: row.displayName, role, status: row.status })
  },
  ui: ({ user, role }) => [
    { op: 'open', nav: S.nav.users },
    { op: 'row', text: tok.name(user), button: S.button.edit },
    { op: 'choose', label: S.field.role, option: S.option.role[role]!, within: `Edit {name:${user}}` },
    { op: 'click', button: S.button.saveChanges, within: `Edit {name:${user}}` },
  ],
  postconditions: ({ user, role }) => [{ outcome: 'userListed', args: { user, role } }],
})

function setStatus(status: 'ACTIVE' | 'DISABLED') {
  return async (ctx: Parameters<typeof changeUserRole.api>[0], { user }: { user: string }) => {
    const row = await findUser(ctx, user)
    if (!row) return { status: 404, ok: false, body: { detail: `no account for ${user}` } }
    return ctx.session().put(`/api/admin/users/${row.id}`, { displayName: row.displayName, role: row.role, status })
  }
}

export const disableUser = defineVerb({
  name: 'disableUser',
  args: z.object({ user: actorArg }).strict(),
  api: setStatus('DISABLED'),
  ui: ({ user }) => [
    { op: 'open', nav: S.nav.users },
    { op: 'row', text: tok.name(user), button: S.button.disable },
  ],
  postconditions: ({ user }) => [{ outcome: 'userListed', args: { user, status: 'DISABLED' } }],
})

export const enableUser = defineVerb({
  name: 'enableUser',
  args: z.object({ user: actorArg }).strict(),
  api: setStatus('ACTIVE'),
  ui: ({ user }) => [
    { op: 'open', nav: S.nav.users },
    { op: 'row', text: tok.name(user), button: S.button.enable },
  ],
  postconditions: ({ user }) => [{ outcome: 'userListed', args: { user, status: 'ACTIVE' } }],
})

export const deleteUser = defineVerb({
  name: 'deleteUser',
  args: z.object({ user: actorArg }).strict(),
  api: async (ctx, { user }) => {
    const row = await findUser(ctx, user)
    if (!row) return { status: 404, ok: false, body: { detail: `no account for ${user}` } }
    return ctx.session().delete(`/api/admin/users/${row.id}`)
  },
  ui: ({ user }) => [
    { op: 'open', nav: S.nav.users },
    { op: 'row', text: tok.name(user), button: S.button.delete },
    { op: 'confirm', dialog: `Delete {name:${user}}?`, button: S.button.deleteUser },
  ],
  postconditions: ({ user }) => [{ outcome: 'userAbsent', args: { user } }],
})

export const approveAccessRequest = defineVerb({
  name: 'approveAccessRequest',
  args: z.object({ user: actorArg }).strict(),
  api: async (ctx, { user }) => {
    const email = account(ctx, user).email
    const list = await ctx.session().get('/api/admin/access-requests')
    if (!list.ok) return list
    const pending = (list.body as Array<{ id: string; email: string; status: string }>).find(
      (r) => r.email === email && r.status === 'PENDING',
    )
    if (!pending) return { status: 404, ok: false, body: { detail: `no pending request for ${user}` } }
    return ctx.session().post(`/api/admin/access-requests/${pending.id}/approve`)
  },
  ui: ({ user }) => [
    { op: 'open', nav: S.nav.accessRequests },
    { op: 'row', text: tok.name(user), button: S.button.approve },
  ],
  postconditions: ({ user }) => [
    { outcome: 'accessRequestStatus', args: { user, status: 'APPROVED' } },
    { outcome: 'userListed', args: { user, status: 'PENDING' } },
    { outcome: 'emailReceived', args: { to: user, subject: 'Your CarbonOS access is approved', linkTo: '/set-password' } },
  ],
})

export const sendResetLink = defineVerb({
  name: 'sendResetLink',
  args: z.object({ user: actorArg }).strict(),
  api: async (ctx, { user }) => {
    const row = await findUser(ctx, user)
    if (!row) return { status: 404, ok: false, body: { detail: `no account for ${user}` } }
    return ctx.session().post(`/api/admin/users/${row.id}/password-reset`)
  },
  ui: ({ user }) => [
    { op: 'open', nav: S.nav.users },
    { op: 'row', text: tok.name(user), button: S.button.resetPassword },
    { op: 'confirm', dialog: `Reset the password of {name:${user}}?`, button: S.button.sendResetLink },
  ],
  postconditions: ({ user }) => [
    {
      outcome: 'emailReceived',
      args: {
        to: user,
        subject: 'Reset your CarbonOS password',
        containing: 'A CarbonOS administrator sent you this link',
        linkTo: '/reset-password',
      },
    },
  ],
})

export const accountVerbs = [createUser, changeUserRole, disableUser, enableUser, deleteUser, approveAccessRequest, sendResetLink]
