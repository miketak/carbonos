/**
 * Projection 1: the tester-facing procedure Markdown, in today's layout
 * (docs/qa/governance/README.md, "How to read a procedure"), with wording the
 * narrator produces from the vocabulary's UI projections.
 */
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { REPO_ROOT } from '../load.ts'
import { resolveActor, type Pack, type Procedure, type Step } from '../model.ts'
import type { NarrationContext } from '../vocabulary/contract.ts'
import { outcome as outcomeByName, verb as verbByName } from '../vocabulary/index.ts'
import { S, settingValueLabel } from '../vocabulary/ui/surface.ts'
import { b, capitalize, code, joinExpected, narrateOps, narrateWhereToLook } from '../vocabulary/ui/narrate.ts'

export interface StepOutcome {
  status: 'PASS' | 'FAIL' | 'NA' | 'MANUAL'
  note?: string
}

export function narrationContext(pack: Pack): NarrationContext {
  return {
    pack,
    actorName: (key) => {
      const actor = resolveActor(pack, key)
      return actor.account?.name ?? 'the visitor'
    },
    actorAlias: (key) => addressOf(pack, key),
  }
}

/**
 * The address a step types or reads, so a tester never leaves the page to
 * look it up: the README's placeholder `you+kofi@…` (an alias of the mailbox
 * the tester reads), or, for the seeded administrator whose account the
 * engineering team made for the tester's own address, words.
 */
export function addressOf(pack: Pack, key: string): string {
  const actor = resolveActor(pack, key)
  if (!actor.account) return 'the visitor'
  if (actor.account.seeded) return 'your administrator address'
  return `\`you+${actor.account.alias}@…\``
}

/** The password a step types: the pack's, or, for the seeded administrator, the one the team sent. */
export function passwordOf(pack: Pack, key: string): string {
  const actor = resolveActor(pack, key)
  if (actor.account?.seeded) return 'the password the engineering team sent you'
  return `\`${actor.account?.password ?? ''}\``
}

/**
 * The accounts a procedure signs in with or names, as prerequisite lines, so
 * each document and each workbook sheet carries its own addresses, passwords
 * and windows (the README's table is the source; this is its projection).
 */
export function accountLines(pack: Pack, procedure: Procedure): string[] {
  const keys = new Set<string>()
  const visit = (value: unknown): void => {
    if (typeof value === 'string') {
      if (value in pack.actors) keys.add(value)
      for (const m of value.matchAll(/\{(?:email|name|password|role|roleLabel):([a-zA-Z0-9]+)\}/g)) keys.add(m[1]!)
    } else if (Array.isArray(value)) value.forEach(visit)
    else if (value && typeof value === 'object') Object.values(value).forEach(visit)
  }
  for (const section of procedure.sections)
    for (const c of section.cases)
      for (const step of c.steps) {
        if (step.as) keys.add(step.as)
        visit(step.do?.args)
        visit(step.expect.map((e) => e.args))
      }
  const seen = new Set<string>()
  const lines: string[] = []
  for (const key of keys) {
    const actor = resolveActor(pack, key)
    if (!actor.account || seen.has(actor.account.key)) continue
    seen.add(actor.account.key)
    const window = actor.window === 'private' ? 'the private window' : 'the normal window'
    lines.push(`${actor.account.name} signs in with ${addressOf(pack, key)} and ${passwordOf(pack, key)}, in ${window}.`)
  }
  if (lines.length > 0) lines.unshift('Accounts in this procedure (replace `you+…@…` with aliases of the mailbox you read):')
  return lines
}

/** Resolves the typed tokens of plans and narration into words for the reader. */
export function wordsFor(pack: Pack, text: string): string {
  const n = narrationContext(pack)
  return text
    .replace(/\{email:([a-zA-Z0-9]+)\}/g, (_, k: string) => n.actorAlias(k))
    .replace(/\{name:([a-zA-Z0-9]+)\}/g, (_, k: string) => `"${n.actorName(k)}"`)
    .replace(/\{password:([a-zA-Z0-9]+)\}/g, (_, k: string) => passwordOf(pack, k))
    .replace(/\{role:([a-zA-Z0-9]+)\}/g, (_, k: string) => S.option.role[resolveActor(pack, k).account?.platformRole ?? 'MEMBER'] ?? '')
    .replace(/\{roleLabel:([a-zA-Z0-9]+)\}/g, (_, k: string) => S.option.role[resolveActor(pack, k).account?.platformRole ?? 'MEMBER'] ?? '')
    .replace(/\{setting:([a-zA-Z]+)=([^}]+)\}/g, (_, key: string, value: string) => settingValueLabel(key, value))
    .replace(/`\{wrong\}`/g, 'a wrong password')
    .replace(/\{wrong\}/g, 'a wrong password')
}

/** `covers: ["01", "01.1"]` to the spec files they name. */
export function specFile(id: string): string | undefined {
  const dir = join(REPO_ROOT, 'specs')
  if (!existsSync(dir)) return undefined
  return readdirSync(dir).find((f) => f.startsWith(`${id}-`) && f.endsWith('.md'))
}

export function renderProcedure(pack: Pack, procedure: Procedure, results?: Map<string, StepOutcome>): string {
  const n = narrationContext(pack)
  const capturedIn = new Map<string, string>()
  for (const section of procedure.sections)
    for (const c of section.cases) for (const step of c.steps) for (const name of Object.keys(step.capture ?? {})) capturedIn.set(name, c.id)
  const inCase = (text: string) => text.replace(/\{capture:([a-zA-Z0-9]+)\}/g, (_, name: string) => `case ${capturedIn.get(name) ?? name}`)
  const out: string[] = []
  out.push(`<!-- generated from ${procedure.file} by make qa-export; edit the YAML -->`)
  out.push(`# Procedure ${procedure.procedure}: ${procedure.title}`)
  out.push('')
  out.push(`**Objective.** ${procedure.docs.objective}`)
  out.push('')
  out.push(coversLine(procedure))
  out.push('')
  out.push(`**Estimated time:** ${procedure.docs.estimatedMinutes} minutes.`)
  if (procedure.docs.version > 1) {
    const last = procedure.docs.changeNotes.at(-1)
    out.push('')
    out.push(`**Procedure version:** ${procedure.docs.version}${last ? ` (${last.date})` : ''}. The change notes are at the foot.`)
  }
  out.push('')
  out.push(
    procedure.after === undefined
      ? `**Run this procedure** first.${procedure.docs.runNote ? ` ${procedure.docs.runNote}` : ''}`
      : `**Run this procedure** after procedure ${procedure.after}.${procedure.docs.runNote ? ` ${procedure.docs.runNote}` : ''}`,
  )
  out.push('')
  out.push('## Prerequisites')
  out.push('')
  for (const line of procedure.docs.prerequisitesText) out.push(`- ${line}`)
  for (const line of accountLines(pack, procedure)) out.push(`- ${line}`)
  let actor: string | undefined
  for (const section of procedure.sections) {
    out.push('')
    out.push(`## ${section.id}. ${section.title}`)
    if (section.intro) {
      out.push('')
      out.push(section.intro)
    }
    for (const c of section.cases) {
      out.push('')
      out.push(`### ${c.id}. ${c.title}`)
      const rationale = procedure.docs.rationale?.[c.id]
      if (rationale) {
        out.push('')
        out.push(rationale)
      }
      out.push('')
      out.push('| Step | Action | Expected result | Pass/Fail | Notes |')
      out.push('| --- | --- | --- | --- | --- |')
      c.steps.forEach((step, index) => {
        const id = `${procedure.procedure}.${c.id}.${index + 1}`
        const { action, expected, nextActor } = narrateStep(pack, n, step, actor)
        actor = nextActor
        const result = results?.get(id)
        const passFail = result ? (result.status === 'FAIL' ? 'FAIL' : result.status === 'PASS' ? 'PASS' : result.status) : ''
        const notes = result?.note ?? ''
        out.push(`| ${index + 1} | ${cell(inCase(action))} | ${cell(inCase(expected))} | ${passFail} | ${cell(notes)} |`)
      })
    }
  }
  out.push('')
  out.push('## Sign-off')
  out.push('')
  out.push('| Field | Value |')
  out.push('| --- | --- |')
  out.push('| Procedure and version tested | |')
  out.push('| Tester and date | |')
  out.push('| Cases failed | |')
  out.push('| Issues filed | |')
  if (procedure.docs.knownNonGoals) {
    out.push('')
    out.push(`**Known non-goals:** ${procedure.docs.knownNonGoals}`)
  }
  if (procedure.docs.changeNotes.length > 0) {
    out.push('')
    out.push('## Change notes')
    out.push('')
    for (const note of procedure.docs.changeNotes) out.push(`- **Version ${note.version}, ${note.date}.** ${note.text}`)
  }
  out.push('')
  return out.join('\n')
}

function coversLine(procedure: Procedure): string {
  const links = procedure.covers.map((id) => {
    const file = specFile(id)
    return file ? `[spec ${id}](../../../specs/${file})` : `spec ${id}`
  })
  const list = links.length <= 1 ? links.join('') : `${links.slice(0, -1).join(', ')} and ${links.at(-1)}`
  return `**Covers** ${list}.${procedure.docs.coversText ? ` ${procedure.docs.coversText}` : ''}`
}

function cell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

export function narrateStep(
  pack: Pack,
  n: NarrationContext,
  step: Step,
  previousActor: string | undefined,
): { action: string; expected: string; nextActor: string | undefined } {
  const actorKey = step.as ?? previousActor
  const actorChanged = step.as !== undefined && step.as !== previousActor
  const prefix = actorChanged && actorKey ? asPrefix(pack, n, actorKey) : ''
  let action = ''
  const expectedParts: string[] = []
  if (step.do) {
    const verb = verbByName(step.do.verb)
    const args = verb.args.parse(step.do.args)
    action = verb.narrate ? verb.narrate(args, n) : narrateOps(verb.ui(args))
    if (step.expect.length === 0) {
      for (const ref of verb.postconditions(args)) {
        const outcome = outcomeByName(ref.outcome)
        expectedParts.push(outcome.narrate(outcome.args.parse(ref.args), n))
      }
    }
  } else if (step.expect.length > 0) {
    const first = step.expect[0]!
    const outcome = outcomeByName(first.outcome)
    action = narrateWhereToLook(outcome.ui(outcome.args.parse(first.args))) ?? 'Look.'
  } else if (step.capture) {
    action = `Note the number on ${b(S.tile.users)}.`
  }
  for (const clause of step.expect) {
    const outcome = outcomeByName(clause.outcome)
    let sentence = outcome.narrate(outcome.args.parse(clause.args), n)
    if (clause.why) sentence = `${sentence.replace(/\.$/, '')}: ${clause.why}.`
    expectedParts.push(sentence)
  }
  if (step.capture) {
    for (const outcomeName of Object.values(step.capture)) {
      if (outcomeName === 'userCount') expectedParts.push(`Note the number on ${b(S.tile.users)}.`)
      else expectedParts.push(`Note the value of ${outcomeName}.`)
    }
  }
  if (step.why) expectedParts.push(capitalize(step.why.replace(/\.?$/, '.')))
  const actionText = wordsFor(pack, prefix ? `${prefix} ${lowerFirst(action)}` : action)
  const expected = wordsFor(pack, joinExpected(expectedParts))
  return { action: actionText, expected, nextActor: actorKey }
}

function asPrefix(pack: Pack, n: NarrationContext, actorKey: string): string {
  const actor = resolveActor(pack, actorKey)
  const where = actor.window === 'private' ? 'in the private window' : 'in the normal window'
  if (actor.anonymous) return `Signed out, ${where},`
  return `As ${n.actorName(actorKey)} ${where},`
}

function lowerFirst(text: string): string {
  if (text.startsWith('**') || text.startsWith('`') || text.startsWith('"')) return text
  return text.charAt(0).toLowerCase() + text.slice(1)
}
