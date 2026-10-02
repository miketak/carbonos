/**
 * `qa lint`: the checks that do not need a running stack. Schema and ids,
 * actors, rules in the catalogue, specs under covers, surface strings in the
 * frontend, no em-dash, generated files current.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { LoadError, REPO_ROOT, loadPack, loadProcedures } from '../load.ts'
import type { Procedure } from '../model.ts'
import { hasRule } from '../vocabulary/rules/index.ts'
import { surfaceStrings } from '../vocabulary/ui/surface.ts'
import { specFile } from '../export/render.ts'

export interface LintReport {
  problems: string[]
  warnings: string[]
  summary: string[]
}

export function lint(persona: string): LintReport {
  const problems: string[] = []
  const warnings: string[] = []
  const summary: string[] = []
  let procedures: Procedure[] = []
  try {
    loadPack(persona)
    procedures = loadProcedures(persona)
  } catch (error) {
    problems.push(error instanceof LoadError ? error.message : String(error))
    return { problems, warnings, summary }
  }
  const pack = loadPack(persona)
  const numbers = new Set<number>()
  for (const procedure of procedures) {
    const file = procedure.file
    if (numbers.has(procedure.procedure)) problems.push(`${file}: procedure ${procedure.procedure} appears twice`)
    numbers.add(procedure.procedure)
    if (procedure.after !== undefined && !procedures.some((p) => p.procedure === procedure.after)) {
      problems.push(`${file}: after: ${procedure.after} names no procedure of the pack`)
    }
    if (procedure.after !== undefined && procedure.after >= procedure.procedure) {
      problems.push(`${file}: after: ${procedure.after} must come before ${procedure.procedure}`)
    }
    for (const id of procedure.covers) {
      const spec = specFile(id)
      if (!spec) problems.push(`${file}: covers ${id}, which is not a spec under specs/`)
      else if (!readFileSync(join(REPO_ROOT, 'specs', spec), 'utf8').match(/^\| \*\*Status\*\* \| (Approved|Implemented)/m) && !specStatusOk(spec)) {
        warnings.push(`${file}: covers ${id} (${spec}), which is not Approved or Implemented`)
      }
    }
    const ids = new Set<string>()
    let steps = 0
    let observes = 0
    const kinds = new Map<string, number>()
    const last = procedure.docs.changeNotes.at(-1)
    if (last && last.version !== procedure.docs.version) {
      problems.push(`${file}: the last change note is version ${last.version}, docs.version is ${procedure.docs.version}`)
    }
    for (const section of procedure.sections) {
      for (const c of section.cases) {
        if (!c.id.startsWith(section.id)) problems.push(`${file}: case ${c.id} is not in section ${section.id}`)
        if (ids.has(c.id)) problems.push(`${file}: case ${c.id} appears twice`)
        ids.add(c.id)
        for (const step of c.steps) {
          steps++
          if (step.as && !pack.actors[step.as]) problems.push(`${file}: ${c.id} names unknown actor ${step.as}`)
          for (const clause of step.expect) {
            kinds.set(clause.outcome, (kinds.get(clause.outcome) ?? 0) + 1)
            if (clause.outcome === 'observe') observes++
            if (clause.outcome === 'refused') {
              const id = String(clause.args.rule)
              if (!hasRule(id)) problems.push(`${file}: ${c.id} expects the rule ${id}, which is not in the catalogue`)
            }
            for (const value of Object.values(clause.args)) {
              if (typeof value === 'string' && pack.actors[value] === undefined && /^[a-z]+[A-Z]?[a-z]*$/.test(value) && ['user', 'to', 'actor'].includes(''))
                problems.push(`${file}: ${c.id} names unknown actor ${value}`)
            }
          }
        }
      }
    }
    const text = readFileSync(join(REPO_ROOT, file), 'utf8')
    text.split('\n').forEach((line, i) => {
      if (line.includes('—')) problems.push(`${file}:${i + 1}: em-dash`)
    })
    summary.push(
      `${file}: ${steps} steps, ${[...kinds.entries()].map(([k, v]) => `${k} ${v}`).join(', ')}${observes ? `, observe ${observes} (MANUAL)` : ''}`,
    )
  }
  // every screen string the projections name is in the product
  const frontendText = readAll(join(REPO_ROOT, 'frontend', 'src')).replace(/\s+/g, ' ')
  for (const { path, value } of surfaceStrings()) {
    if (!frontendText.includes(value.replace(/\s+/g, ' '))) problems.push(`surface.ts: ${path} = "${value}" is not in frontend/src`)
  }
  return { problems, warnings, summary }
}

function specStatusOk(spec: string): boolean {
  const index = readFileSync(join(REPO_ROOT, 'specs', 'README.md'), 'utf8')
  const row = index.split('\n').find((line) => line.includes(`](${spec})`))
  return row !== undefined && /\| (Approved|Implemented|Superseded in part[^|]*) \|\s*$/.test(row)
}

function readAll(dir: string): string {
  const parts: string[] = []
  const walk = (d: string) => {
    for (const entry of readdirSync(d)) {
      const path = join(d, entry)
      if (statSync(path).isDirectory()) {
        if (entry !== 'generated' && entry !== 'node_modules') walk(path)
      } else if (/\.(tsx?|mjs)$/.test(entry) && !entry.endsWith('.test.tsx') && !entry.endsWith('.test.ts')) {
        parts.push(readFileSync(path, 'utf8'))
      }
    }
  }
  if (existsSync(dir)) walk(dir)
  // JSX escapes an apostrophe as &apos; or uses the curly one; match the product's text either way
  return parts.join('\n').replace(/&apos;/g, "'").replace(/\{'\s*'\}/g, ' ')
}
