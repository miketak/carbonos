/**
 * Projection 4: the run record. Converts the last run's results into
 * qa/runs/<persona>/<NNN>.<driver>.json, refusing on any FAIL or SKIP, on a
 * YAML that changed since the script was generated, and on a digest that
 * disagrees with the other driver's record for the same YAML.
 */
import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { REPO_ROOT, loadProcedures } from '../load.ts'
import { resultsPath, type RunResults } from '../runtime/shared/results.ts'

export interface RunRecord {
  procedure: number
  driver: 'api' | 'ui'
  yamlSha256: string
  productVersion: string | null
  gitSha: string
  date: string
  specialist: string
  digestSha256: string
  counts: { pass: number; na: number; manual: number }
  steps: Array<{ id: string; status: string; note?: string }>
}

export function recordPath(persona: string, procedure: number, driver: string): string {
  return join(REPO_ROOT, 'qa', 'runs', persona, `${String(procedure).padStart(3, '0')}.${driver}.json`)
}

export function record(persona: string, number: number, driver: 'api' | 'ui'): RunRecord {
  const file = resultsPath(persona, number, driver)
  if (!existsSync(file)) throw new Error(`no results at ${file}; run the ${driver} driver for procedure ${number} first`)
  const results = JSON.parse(readFileSync(file, 'utf8')) as RunResults
  const procedure = loadProcedures(persona).find((p) => p.procedure === number)
  if (!procedure) throw new Error(`no procedure ${number}`)
  if (procedure.sha256 !== results.yamlSha256) throw new Error(`${procedure.file} changed since the run; run it again`)
  if (!results.finishedAt) throw new Error('the run did not finish')
  const failed = results.steps.filter((s) => s.status === 'FAIL')
  if (failed.length) throw new Error(`refusing to record: ${failed.map((s) => `${s.id} ${s.note ?? ''}`).join('; ')}`)
  const expected = procedure.sections.flatMap((s) => s.cases.flatMap((c) => c.steps.map((_, i) => `${number}.${c.id}.${i + 1}`)))
  const ran = new Set(results.steps.map((s) => s.id))
  const skipped = expected.filter((id) => !ran.has(id))
  if (skipped.length) throw new Error(`refusing to record: steps not run (SKIP): ${skipped.join(', ')}`)
  if (!results.digestSha256) throw new Error('the run has no digest')
  const digest = stateDigest(results)
  const other = recordPath(persona, number, driver === 'api' ? 'ui' : 'api')
  if (existsSync(other)) {
    const otherRecord = JSON.parse(readFileSync(other, 'utf8')) as RunRecord
    if (otherRecord.yamlSha256 === results.yamlSha256 && otherRecord.digestSha256 !== digest) {
      throw new Error(
        `the ${driver} run left the product in a different state from the ${otherRecord.driver} run: digest ${digest} vs ${otherRecord.digestSha256}`,
      )
    }
  }
  const out: RunRecord = {
    procedure: number,
    driver,
    yamlSha256: results.yamlSha256,
    productVersion: null,
    gitSha: execSync('git rev-parse HEAD', { cwd: REPO_ROOT }).toString().trim(),
    date: results.finishedAt.slice(0, 10),
    specialist: process.env.QA_SPECIALIST ?? process.env.USER ?? 'unknown',
    digestSha256: digest,
    counts: {
      pass: results.steps.filter((s) => s.status === 'PASS').length,
      na: results.steps.filter((s) => s.status === 'NA').length,
      manual: results.steps.filter((s) => s.status === 'MANUAL').length,
    },
    steps: results.steps.map(({ id, status, note }) => (note ? { id, status, note } : { id, status })),
  }
  const target = recordPath(persona, number, driver)
  mkdirSync(join(REPO_ROOT, 'qa', 'runs', persona), { recursive: true })
  writeFileSync(target, JSON.stringify(out, null, 2) + '\n')
  return out
}

/** The tables the two drivers must leave alike: the product's state, not its audit trail. */
const ACTS = new Set(['ghg_audit_events'])

/**
 * The digest the record compares: the row counts the run ended with, without
 * the audit trail. A screen reaches a decision in several acts where a client
 * sends one call (the drawer saves the factor, then the scope, then the
 * category), and each act is history; the state both drivers leave is the
 * same. Falls back to the server's digest for a run that carries no counts.
 */
export function stateDigest(results: RunResults): string {
  if (!results.digest) return results.digestSha256 ?? ''
  const text = Object.entries(results.digest)
    .filter(([table]) => !ACTS.has(table))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([table, count]) => `${table}=${count}\n`)
    .join('')
  return createHash('sha256').update(text).digest('hex')
}
