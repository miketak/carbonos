/**
 * Loads a pack and its procedures from YAML, validates them against the
 * vocabulary's schema, and resolves the `${name}` holes from `let`.
 */
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { basename, join, relative, resolve } from 'node:path'
import { parse } from 'yaml'
import { z } from 'zod'
import type { Case, ExpectClause, Pack, Procedure, Section, Step } from './model.ts'
import { packSchema, procedureSchema, type RawProcedure, type RawStep } from './vocabulary/index.ts'

export const REPO_ROOT = resolve(import.meta.dirname, '..', '..')
export const PACKS_DIR = resolve(REPO_ROOT, 'qa', 'packs')

export class LoadError extends Error {
  constructor(
    readonly file: string,
    message: string,
  ) {
    super(`${file}: ${message}`)
  }
}

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.map(String).join('.') || '(root)'}: ${issue.message}`)
    .join('\n  ')
}

export function loadPack(persona: string): Pack {
  const file = join(PACKS_DIR, persona, 'pack.yaml')
  const parsed = packSchema.safeParse(parse(readFileSync(file, 'utf8')))
  if (!parsed.success) throw new LoadError(relative(REPO_ROOT, file), formatIssues(parsed.error))
  return parsed.data as Pack
}

export function procedureFiles(persona: string): string[] {
  return readdirSync(join(PACKS_DIR, persona))
    .filter((name) => /^\d{3}-.*\.yaml$/.test(name))
    .sort()
    .map((name) => join(PACKS_DIR, persona, name))
}

export function loadProcedure(file: string): Procedure {
  const text = readFileSync(file, 'utf8')
  const rel = relative(REPO_ROOT, file)
  const parsed = procedureSchema.safeParse(parse(text))
  if (!parsed.success) throw new LoadError(rel, formatIssues(parsed.error))
  const raw = parsed.data
  const expectedName = `${String(raw.procedure).padStart(3, '0')}-${raw.slug}.yaml`
  if (basename(file) !== expectedName) throw new LoadError(rel, `file should be named ${expectedName}`)
  const vars = raw.let ?? {}
  const sections: Section[] = raw.sections.map((section) => ({
    id: section.id,
    title: section.title,
    intro: section.intro,
    cases: section.cases.map(
      (c): Case => ({
        id: c.id,
        title: c.title,
        steps: c.steps.map((step) => toStep(step, vars, rel)),
      }),
    ),
  }))
  return {
    procedure: raw.procedure,
    slug: raw.slug,
    title: raw.title,
    after: raw.after,
    covers: raw.covers,
    let: vars,
    sections,
    docs: {
      ...raw.docs,
      prerequisitesText: raw.docs.prerequisitesText ?? [],
      changeNotes: raw.docs.changeNotes ?? [],
    },
    file: rel,
    sha256: createHash('sha256').update(text).digest('hex'),
  }
}

export function loadProcedures(persona: string): Procedure[] {
  return procedureFiles(persona).map(loadProcedure)
}

function toStep(step: RawStep, vars: Record<string, string>, file: string): Step {
  const out: Step = { expect: [] }
  if (step.as) out.as = step.as
  if (step.why) out.why = step.why
  if (step.continueOnFail) out.continueOnFail = true
  if (step.capture) out.capture = step.capture
  if (step.do) {
    const [verb, args] = single(step.do, file, 'do')
    out.do = { verb, args: resolveHoles(args, vars, file) as Record<string, unknown> }
  }
  for (const item of step.expect ?? []) {
    const { why, ...rest } = item as Record<string, unknown> & { why?: string }
    const [outcome, args] = single(rest, file, 'expect')
    const clause: ExpectClause = { outcome, args: resolveHoles(args, vars, file) as Record<string, unknown> }
    if (why) clause.why = why
    out.expect.push(clause)
  }
  return out
}

function single(clause: Record<string, unknown>, file: string, what: string): [string, Record<string, unknown>] {
  const keys = Object.keys(clause)
  if (keys.length !== 1) throw new LoadError(file, `a ${what} clause names exactly one thing, got ${keys.join(', ')}`)
  const name = keys[0]!
  const args = clause[name] ?? {}
  if (typeof args !== 'object' || Array.isArray(args)) throw new LoadError(file, `${what} ${name}: arguments must be a mapping`)
  return [name, args as Record<string, unknown>]
}

/** Replaces `${name}` in every string with the `let` value; an unknown name is an error. */
export function resolveHoles(value: unknown, vars: Record<string, string>, file: string): unknown {
  if (typeof value === 'string') {
    return value.replace(/\$\{([a-zA-Z0-9_]+)\}/g, (_, name: string) => {
      const found = vars[name]
      if (found === undefined) throw new LoadError(file, `unknown \${${name}}; add it to let`)
      return found
    })
  }
  if (Array.isArray(value)) return value.map((item) => resolveHoles(item, vars, file))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveHoles(v, vars, file)]))
  }
  return value
}

export type { RawProcedure }
