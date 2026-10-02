/**
 * The contract every verb and outcome of the vocabulary satisfies. A verb is a
 * domain action; an outcome is a domain statement about the state afterwards.
 * Each carries both projections (how the API driver performs or checks it and
 * how the UI driver does) and its narration, so the scenarios stay pure.
 */
import type { z } from 'zod'
import type { Pack, ResolvedActor } from '../model.ts'
import type { UiCheck, UiOp } from './ui/ops.ts'

/** What the API driver got back from the verb's call. */
export interface ApiOutcome {
  status: number
  body?: unknown
  /** The problem detail's `rule` member, when the call was refused by a named rule. */
  rule?: string
  ok: boolean
  /** The verb cannot be performed through the API (a page-only act); the step is N/A for this driver. */
  na?: string
}

export interface MailMessage {
  id: string
  to: string
  subject: string
  text: string
  links: string[]
}

export interface Mailbox {
  /** The newest message to the address with the subject, waiting for it to arrive. */
  latest(to: string, subject: string): Promise<MailMessage | undefined>
  /** True when no such message arrives within a short grace period. */
  none(to: string, subject: string): Promise<boolean>
}

export interface ApiSession {
  get(path: string): Promise<ApiOutcome>
  post(path: string, body?: unknown): Promise<ApiOutcome>
  put(path: string, body?: unknown): Promise<ApiOutcome>
  delete(path: string): Promise<ApiOutcome>
}

/** What a verb or outcome knows at run time, in either driver. */
export interface RunContext {
  pack: Pack
  /** The actor the step runs as. */
  actor: ResolvedActor
  actorOf(key: string): ResolvedActor
  /** The current password of an account; a verb that changes it updates this. */
  passwordOf(actorKey: string): string
  setPassword(actorKey: string, password: string): void
  /** Values captured earlier in the chain by name. */
  captured(name: string): number
  capture(name: string, value: number): void
  mail: Mailbox
}

export interface ApiContext extends RunContext {
  /** The API session of the step's actor (a visitor's is anonymous). */
  session(): ApiSession
  sessionOf(actorKey: string): ApiSession
  /** A signed-in platform administrator's session, for outcomes that read what only an administrator may. */
  admin(): Promise<ApiSession>
}

export interface CheckResult {
  ok: boolean
  /** Why the check failed, or the measured value when it passed. */
  detail?: string
  /** The driver cannot observe this outcome; recorded N/A, never a pass. */
  na?: string
  /** A sentence a human must judge; recorded MANUAL. */
  manual?: string
}

/** The UI driver's view of the page, as the UI projections see it. */
export interface UiContext extends RunContext {
  /** Values the plan may need from the run (a token from an email, a measured count). */
  emailLink(actorKey: string, subject: string, path: string): Promise<string>
}

/** How the exporter turns an actor into words. */
export interface NarrationContext {
  pack: Pack
  actorName(key: string): string
  /** "the Kofi alias": the account's address as the README names it. */
  actorAlias(key: string): string
}

export type OutcomeRef = { outcome: string; args: Record<string, unknown> }

export interface Verb<A = Record<string, unknown>> {
  name: string
  args: z.ZodType<A>
  api: (ctx: ApiContext, args: A) => Promise<ApiOutcome>
  /** One plan: the UI driver executes it, the exporter narrates it. */
  ui: (args: A) => UiOp[]
  /** What must hold after the verb succeeds; verified by both drivers on every step. */
  postconditions: (args: A) => OutcomeRef[]
  /** Overrides the narration the UI plan would produce, when the plan reads badly as prose. */
  narrate?: (args: A, ctx: NarrationContext) => string
}

export interface Outcome<A = Record<string, unknown>> {
  name: string
  args: z.ZodType<A>
  api: (ctx: ApiContext, args: A, last: ApiOutcome | undefined) => Promise<CheckResult>
  ui: (args: A) => UiCheck[]
  narrate: (args: A, ctx: NarrationContext) => string
  /** A number the chain may capture (`capture: { usersAtStart: userCount }`). */
  measureApi?: (ctx: ApiContext, args: A) => Promise<number>
}

export function defineVerb<A>(verb: Verb<A>): Verb<A> {
  return verb
}

export function defineOutcome<A>(outcome: Outcome<A>): Outcome<A> {
  return outcome
}

export const pass = (detail?: string): CheckResult => ({ ok: true, detail })
export const fail = (detail: string): CheckResult => ({ ok: false, detail })
export const notApplicable = (why: string): CheckResult => ({ ok: true, na: why })
