/**
 * The scenario model: what a pack and a procedure look like once loaded and
 * validated. A step says who acts, what they do in domain terms and what must
 * hold afterwards; nothing in it names a page, a button or a message.
 */

export type Window = 'normal' | 'private'

export interface ActorDef {
  /** Display name; also what the product shows for the account. */
  name: string
  /** The plus-alias of the pack's mailbox: qa+<alias>@<domain>. */
  alias: string
  password: string
  platformRole: 'ADMIN' | 'MEMBER'
  /** The administrator the deployment seeds (CARBONOS_ADMIN_EMAIL); procedure 1 does not create it. */
  seeded?: boolean
  /** The browser window a tester uses for this actor; one browser context per actor in the UI driver. */
  window: Window
}

/** A second session of an existing actor (two windows of one account), or a visitor with no account. */
export interface ActorAlias {
  sameAs?: string
  anonymous?: boolean
  window: Window
}

export interface Pack {
  persona: string
  title: string
  mailbox: { local: string; domain: string }
  actors: Record<string, ActorDef | ActorAlias>
  docs?: Record<string, unknown>
}

/** `{ verbName: args }`: exactly one key. */
export type DoClause = Record<string, Record<string, unknown>>

/** `{ outcomeName: args, why?: string }`: exactly one outcome key. */
export interface ExpectClause {
  outcome: string
  args: Record<string, unknown>
  why?: string
}

export interface Step {
  /** The actor; persists until changed. */
  as?: string
  do?: { verb: string; args: Record<string, unknown> }
  expect: ExpectClause[]
  /** Name to measure: a value kept for later outcomes in the same chain. */
  capture?: Record<string, string>
  why?: string
  continueOnFail?: boolean
}

export interface Case {
  id: string
  title: string
  /** Prose under the case heading, when the docs block gives one. */
  steps: Step[]
}

export interface Section {
  id: string
  title: string
  intro?: string
  cases: Case[]
}

export interface ChangeNote {
  version: number
  date: string
  text: string
}

export interface ProcedureDocs {
  version: number
  estimatedMinutes: number
  objective: string
  coversText?: string
  runNote?: string
  prerequisitesText: string[]
  knownNonGoals?: string
  rationale?: Record<string, string>
  changeNotes: ChangeNote[]
}

export interface Procedure {
  procedure: number
  slug: string
  title: string
  after?: number
  covers: string[]
  let: Record<string, string>
  sections: Section[]
  docs: ProcedureDocs
  /** The YAML file the procedure was loaded from, relative to the repo root. */
  file: string
  /** sha256 of the YAML text, stamped on everything generated from it. */
  sha256: string
}

/** The actor resolved: a real account, possibly through an alias, or a visitor. */
export interface ResolvedActor {
  key: string
  account?: ActorDef & { key: string; email: string }
  anonymous: boolean
  window: Window
}

export function resolveActor(pack: Pack, key: string): ResolvedActor {
  const def = pack.actors[key]
  if (!def) throw new Error(`unknown actor '${key}'`)
  if ('anonymous' in def && def.anonymous) return { key, anonymous: true, window: def.window }
  if ('sameAs' in def && def.sameAs) {
    const base = pack.actors[def.sameAs]
    if (!base || !('alias' in base)) throw new Error(`actor '${key}' is the same as unknown '${def.sameAs}'`)
    return {
      key,
      anonymous: false,
      window: def.window,
      account: { ...base, key: def.sameAs, email: emailOf(pack, base) },
    }
  }
  const account = def as ActorDef
  return { key, anonymous: false, window: account.window, account: { ...account, key, email: emailOf(pack, account) } }
}

export function emailOf(pack: Pack, actor: ActorDef): string {
  return `${pack.mailbox.local}+${actor.alias}@${pack.mailbox.domain}`
}

export function accountActors(pack: Pack): Array<ActorDef & { key: string; email: string }> {
  return Object.entries(pack.actors)
    .filter((entry): entry is [string, ActorDef] => 'alias' in entry[1])
    .map(([key, def]) => ({ ...def, key, email: emailOf(pack, def) }))
}
