/**
 * The registry: every verb and outcome the scenarios may name, and the zod
 * schemas built from it. An unknown verb or outcome is a schema error; a verb
 * or outcome without both projections does not compile (contract.ts).
 */
import { z } from 'zod'
import type { Outcome, Verb } from './contract.ts'
import { authVerbs } from './verbs/auth.ts'
import { accountVerbs } from './verbs/accounts.ts'
import { settingsVerbs } from './verbs/settings.ts'
import { passwordVerbs } from './verbs/passwords.ts'
import { organizationVerbs } from './verbs/organization.ts'
import { structureVerbs } from './verbs/structure.ts'
import { libraryVerbs } from './verbs/library.ts'
import { activityVerbs } from './verbs/activities.ts'
import { accountOutcomes } from './outcomes/accounts.ts'
import { sessionOutcomes } from './outcomes/sessions.ts'
import { settingsOutcomes } from './outcomes/settings.ts'
import { generalOutcomes } from './outcomes/general.ts'
import { organizationOutcomes } from './outcomes/organization.ts'
import { activityOutcomes } from './outcomes/activities.ts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyVerb = Verb<any>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyOutcome = Outcome<any>

const verbList: AnyVerb[] = [...authVerbs, ...accountVerbs, ...settingsVerbs, ...passwordVerbs, ...organizationVerbs, ...structureVerbs, ...libraryVerbs, ...activityVerbs]
const outcomeList: AnyOutcome[] = [...accountOutcomes, ...sessionOutcomes, ...settingsOutcomes, ...generalOutcomes, ...organizationOutcomes, ...activityOutcomes]

export const verbs: ReadonlyMap<string, AnyVerb> = index(verbList, 'verb')
export const outcomes: ReadonlyMap<string, AnyOutcome> = index(outcomeList, 'outcome')

function index<T extends { name: string }>(items: T[], kind: string): Map<string, T> {
  const map = new Map<string, T>()
  for (const item of items) {
    if (map.has(item.name)) throw new Error(`${kind} '${item.name}' is registered twice`)
    map.set(item.name, item)
  }
  return map
}

export function verb(name: string): AnyVerb {
  const found = verbs.get(name)
  if (!found) throw new Error(`unknown verb '${name}'`)
  return found
}

export function outcome(name: string): AnyOutcome {
  const found = outcomes.get(name)
  if (!found) throw new Error(`unknown outcome '${name}'`)
  return found
}

/** `{ verbName: args }` with exactly one key, the args checked against the verb's schema. */
const doSchema = z
  .record(z.string(), z.unknown())
  .refine((clause) => Object.keys(clause).length === 1, { message: 'a do clause names exactly one verb' })
  .superRefine((clause, ctx) => {
    const [name, args] = Object.entries(clause)[0]!
    const found = verbs.get(name)
    if (!found) {
      ctx.addIssue({ code: 'custom', message: `unknown verb '${name}'`, path: [name] })
      return
    }
    const parsed = found.args.safeParse(args ?? {})
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue({ code: 'custom', message: issue.message, path: [name, ...issue.path.map(String)] })
      }
    }
  })

/** `{ outcomeName: args, why?: text }`. */
const expectSchema = z
  .record(z.string(), z.unknown())
  .superRefine((clause, ctx) => {
    const names = Object.keys(clause).filter((k) => k !== 'why')
    if (names.length !== 1) {
      ctx.addIssue({ code: 'custom', message: 'an expect clause names exactly one outcome' })
      return
    }
    const name = names[0]!
    const found = outcomes.get(name)
    if (!found) {
      ctx.addIssue({ code: 'custom', message: `unknown outcome '${name}'`, path: [name] })
      return
    }
    const parsed = found.args.safeParse(clause[name] ?? {})
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue({ code: 'custom', message: issue.message, path: [name, ...issue.path.map(String)] })
      }
    }
    if ('why' in clause && typeof clause.why !== 'string') {
      ctx.addIssue({ code: 'custom', message: 'why is prose', path: ['why'] })
    }
  })

const stepSchema = z
  .object({
    as: z.string().optional(),
    do: doSchema.optional(),
    expect: z.array(expectSchema).optional(),
    capture: z.record(z.string(), z.string()).optional(),
    why: z.string().optional(),
    continueOnFail: z.boolean().optional(),
  })
  .strict()
  .refine((step) => step.do || (step.expect && step.expect.length > 0) || step.capture, {
    message: 'a step does something, expects something, or captures a value',
  })

const caseSchema = z
  .object({
    id: z.string().regex(/^[A-Z]\d+$/, 'a case id is a section letter and a number, like A2'),
    title: z.string(),
    steps: z.array(stepSchema).min(1),
  })
  .strict()

const sectionSchema = z
  .object({
    id: z.string().regex(/^[A-Z]$/),
    title: z.string(),
    intro: z.string().optional(),
    cases: z.array(caseSchema).min(1),
  })
  .strict()

const changeNoteSchema = z.object({ version: z.number().int(), date: z.string(), text: z.string() }).strict()

const docsSchema = z
  .object({
    version: z.number().int().min(1),
    estimatedMinutes: z.number().int().positive(),
    objective: z.string(),
    coversText: z.string().optional(),
    runNote: z.string().optional(),
    prerequisitesText: z.array(z.string()).optional(),
    knownNonGoals: z.string().optional(),
    rationale: z.record(z.string(), z.string()).optional(),
    changeNotes: z.array(changeNoteSchema).optional(),
  })
  .strict()

export const procedureSchema = z
  .object({
    procedure: z.number().int().positive(),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string(),
    after: z.number().int().positive().optional(),
    covers: z.array(z.string()),
    let: z.record(z.string(), z.string()).optional(),
    sections: z.array(sectionSchema).min(1),
    docs: docsSchema,
  })
  .strict()

const actorSchema = z.union([
  z
    .object({
      name: z.string(),
      alias: z.string().regex(/^[a-z0-9]+$/),
      password: z.string().min(12),
      platformRole: z.enum(['ADMIN', 'MEMBER']),
      seeded: z.boolean().optional(),
      window: z.enum(['normal', 'private']),
    })
    .strict(),
  z.object({ sameAs: z.string(), window: z.enum(['normal', 'private']) }).strict(),
  z.object({ anonymous: z.literal(true), window: z.enum(['normal', 'private']) }).strict(),
])

export const packSchema = z
  .object({
    persona: z.string().regex(/^[a-z]+$/),
    title: z.string(),
    mailbox: z.object({ local: z.string(), domain: z.string() }).strict(),
    actors: z.record(z.string(), actorSchema),
    docs: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()

export type RawProcedure = z.infer<typeof procedureSchema>
export type RawStep = z.infer<typeof stepSchema>

/** The JSON Schema for editors (qa/schema/scenario.schema.json), from the same definitions. */
export function jsonSchema(): unknown {
  return z.toJSONSchema(procedureSchema, { unrepresentable: 'any', io: 'input' })
}
