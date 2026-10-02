#!/usr/bin/env node
/**
 * The qa command. From qa/: `npm run qa -- <command>`; from the repo root the
 * Makefile's qa-* targets.
 *
 *   lint                      schema, ids, rules, specs, surface strings, em-dashes
 *   export [--check]          the procedure Markdown under docs/qa/<persona>/
 *   compile [--check]         the API and UI specs under qa/generated/<persona>/
 *   schema                    qa/schema/scenario.schema.json
 *   rules                     pull the rule catalogue from the running backend
 *   reset                     POST /api/qa/reset and clear Mailpit
 *   record PROC DRIVER        the run record from the last run's results
 *   doctor                    is the stack ready for a run?
 *
 * Options: --persona <name> (default governance).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { REPO_ROOT, loadPack, loadProcedures } from './load.ts'
import { compileProcedure, specFileName } from './compile/compile.ts'
import { renderProcedure } from './export/render.ts'
import { lint } from './lint/lint.ts'
import { record } from './record/record.ts'
import { jsonSchema } from './vocabulary/index.ts'
import { catalogueSha256 } from './vocabulary/rules/index.ts'

const argv = process.argv.slice(2)
const flags = new Set(argv.filter((a) => a.startsWith('--')))
const positional = argv.filter((a) => !a.startsWith('--'))
const personaIndex = argv.indexOf('--persona')
const persona = personaIndex >= 0 ? (argv[personaIndex + 1] ?? 'governance') : 'governance'
if (personaIndex >= 0) positional.splice(positional.indexOf(argv[personaIndex + 1]!), 1)
const command = positional[0]
const check = flags.has('--check')

function writeOrCheck(file: string, content: string, changed: string[]): void {
  const current = existsSync(file) ? readFileSync(file, 'utf8') : undefined
  if (current === content) return
  if (check) {
    changed.push(file)
    return
  }
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, content)
  console.log(`wrote ${file.replace(REPO_ROOT + '/', '')}`)
}

function finishCheck(changed: string[], what: string): void {
  if (changed.length === 0) {
    console.log(`${what}: up to date`)
    return
  }
  console.error(`${what}: ${changed.length} file(s) differ from the YAML; run without --check:`)
  for (const file of changed) console.error(`  ${file.replace(REPO_ROOT + '/', '')}`)
  process.exit(1)
}

async function main(): Promise<void> {
  switch (command) {
    case 'lint': {
      const report = lint(persona)
      for (const line of report.summary) console.log(line)
      for (const line of report.warnings) console.warn(`warning: ${line}`)
      for (const line of report.problems) console.error(`error: ${line}`)
      if (report.problems.length) process.exit(1)
      console.log(`qa lint: ${report.problems.length} problems, ${report.warnings.length} warnings`)
      return
    }
    case 'export': {
      const pack = loadPack(persona)
      const changed: string[] = []
      for (const procedure of loadProcedures(persona)) {
        const file = join(REPO_ROOT, 'docs', 'qa', persona, `${String(procedure.procedure).padStart(3, '0')}-${procedure.slug}.md`)
        writeOrCheck(file, renderProcedure(pack, procedure), changed)
      }
      if (check) finishCheck(changed, 'qa export')
      return
    }
    case 'compile': {
      const changed: string[] = []
      for (const procedure of loadProcedures(persona)) {
        for (const driver of ['api', 'ui'] as const) {
          const file = join(REPO_ROOT, 'qa', 'generated', persona, driver, specFileName(procedure, driver))
          writeOrCheck(file, compileProcedure(persona, procedure, driver), changed)
        }
      }
      if (check) finishCheck(changed, 'qa compile')
      return
    }
    case 'schema': {
      const changed: string[] = []
      writeOrCheck(join(REPO_ROOT, 'qa', 'schema', 'scenario.schema.json'), JSON.stringify(jsonSchema(), null, 2) + '\n', changed)
      if (check) finishCheck(changed, 'qa schema')
      return
    }
    case 'rules': {
      const { QaHooks } = await import('./runtime/shared/qa.ts')
      const hooks = new QaHooks(loadPack(persona))
      const catalogue = await hooks.rules()
      const file = join(REPO_ROOT, 'qa', 'src', 'vocabulary', 'rules', 'catalogue.json')
      writeFileSync(file, JSON.stringify(catalogue, null, 2) + '\n')
      console.log(`wrote ${catalogue.rules.length} rules (sha256 ${catalogue.sha256})${catalogue.sha256 === catalogueSha256 ? ', unchanged' : ''}`)
      await hooks.session.dispose()
      return
    }
    case 'reset': {
      const { QaHooks } = await import('./runtime/shared/qa.ts')
      const { Mailpit } = await import('./runtime/shared/mailpit.ts')
      const { env } = await import('./runtime/shared/env.ts')
      const { clearState } = await import('./runtime/shared/state.ts')
      const hooks = new QaHooks(loadPack(persona))
      await hooks.reset()
      await new Mailpit(env.mailpitUrl).clear()
      clearState(persona, 'api')
      clearState(persona, 'ui')
      console.log('reset: the migrations, the seeded administrator, an empty mailbox')
      return
    }
    case 'record': {
      const number = Number(positional[1])
      const driver = positional[2]
      if (!number || (driver !== 'api' && driver !== 'ui')) throw new Error('usage: record <procedure> <api|ui>')
      const out = record(persona, number, driver)
      console.log(`recorded procedure ${number} (${driver}): ${out.counts.pass} pass, ${out.counts.na} N/A, ${out.counts.manual} manual; digest ${out.digestSha256.slice(0, 12)}`)
      return
    }
    case 'doctor': {
      const { QaHooks } = await import('./runtime/shared/qa.ts')
      const { env } = await import('./runtime/shared/env.ts')
      const pack = loadPack(persona)
      const lines: string[] = []
      let ok = true
      const probe = async (label: string, fn: () => Promise<string>) => {
        try {
          lines.push(`ok    ${label}: ${await fn()}`)
        } catch (error) {
          ok = false
          lines.push(`FAIL  ${label}: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
      await probe('backend', async () => {
        const r = await fetch(`${env.apiUrl}/actuator/health`)
        if (!r.ok) throw new Error(`${r.status}`)
        return env.apiUrl
      })
      const hooks = new QaHooks(pack)
      await probe('seeded administrator and /api/qa', async () => {
        const catalogue = await hooks.rules()
        return `${catalogue.rules.length} rules${catalogue.sha256 === catalogueSha256 ? ', catalogue up to date' : ', CATALOGUE DIFFERS: run make qa-rules'}`
      })
      await probe('mailpit', async () => {
        const r = await fetch(`${env.mailpitUrl}/api/v1/info`)
        if (!r.ok) throw new Error(`${r.status}`)
        return env.mailpitUrl
      })
      await probe('frontend', async () => {
        const r = await fetch(env.appUrl)
        if (!r.ok) throw new Error(`${r.status}`)
        return env.appUrl
      })
      await hooks.session.dispose()
      for (const line of lines) console.log(line)
      if (!ok) process.exit(1)
      return
    }
    default:
      console.error('usage: qa <lint|export|compile|schema|rules|reset|record|doctor> [--check] [--persona name]')
      process.exit(2)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
