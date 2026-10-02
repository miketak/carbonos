/** Small shared pieces of the projections: actor lookups, typed tokens, user lookups. */
import { z } from 'zod'
import type { ApiContext, ApiOutcome, ApiSession, RunContext } from './contract.ts'

export const actorArg = z.string().describe('an actor of the pack')
/** A password typed in a step: a literal, `{wrong}` for one that is not the account's, or absent for the pack's. */
export const passwordArg = z.string().optional()

export const WRONG_PASSWORD = 'not-the-password-0'

export function account(ctx: RunContext, key: string) {
  const actor = ctx.actorOf(key)
  if (!actor.account) throw new Error(`actor '${key}' has no account`)
  return actor.account
}

export function resolvePassword(ctx: RunContext, actorKey: string, value: string | undefined): string {
  if (value === undefined) return ctx.passwordOf(actorKey)
  if (value === '{wrong}') return WRONG_PASSWORD
  return value
}

/** Typed tokens in UI plans; the executor substitutes, the narrator names. */
export const tok = {
  email: (actor: string) => `{email:${actor}}`,
  password: (actor: string, literal?: string) =>
    literal === undefined ? `{password:${actor}}` : literal === '{wrong}' ? '{wrong}' : literal,
  name: (actor: string) => `{name:${actor}}`,
}

export interface UserRow {
  id: string
  email: string
  displayName: string
  role: 'ADMIN' | 'MEMBER'
  status: 'ACTIVE' | 'DISABLED' | 'PENDING'
}

export async function listUsers(admin: ApiSession): Promise<UserRow[]> {
  const out = await admin.get('/api/admin/users')
  if (!out.ok) throw new Error(`could not list users: ${out.status}`)
  return out.body as UserRow[]
}

export async function findUser(ctx: ApiContext, actorKey: string): Promise<UserRow | undefined> {
  const email = account(ctx, actorKey).email
  const users = await listUsers(await ctx.admin())
  return users.find((u) => u.email === email)
}

export function detailOf(out: ApiOutcome): string {
  const body = out.body as { detail?: string } | undefined
  return body?.detail ?? `status ${out.status}`
}
