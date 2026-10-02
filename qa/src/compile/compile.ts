/**
 * Projections 2 and 3: one Playwright spec per procedure and driver, calling
 * the thin runtime. The files are generated from the YAML and committed; the
 * YAML's sha256 in the header lets the runtime refuse a stale script.
 */
import type { Procedure, Step } from '../model.ts'

export function specFileName(procedure: Procedure, driver: 'api' | 'ui'): string {
  return `${String(procedure.procedure).padStart(3, '0')}-${procedure.slug}.${driver}.spec.ts`
}

const lit = (value: unknown) => JSON.stringify(value)

export function compileProcedure(persona: string, procedure: Procedure, driver: 'api' | 'ui'): string {
  const lines: string[] = []
  lines.push(`// generated from ${procedure.file} (sha256 ${procedure.sha256}); edit the YAML, then \`make qa-compile\``)
  lines.push(`import { procedure, test } from '../../../src/runtime/${driver}/index.ts'`)
  lines.push('')
  lines.push(`const P = procedure(${lit(persona)}, ${procedure.procedure}, ${lit(procedure.sha256)})`)
  lines.push('')
  lines.push(`test.describe.configure({ mode: 'serial' })`)
  lines.push(`test.describe(${lit(`Procedure ${procedure.procedure}: ${procedure.title}`)}, () => {`)
  lines.push(`  test.beforeAll(async () => P.start())`)
  lines.push(`  test.afterAll(async () => P.finish())`)
  for (const section of procedure.sections) {
    for (const c of section.cases) {
      lines.push('')
      lines.push(`  test(${lit(`${c.id}. ${c.title}`)}, async () => {`)
      c.steps.forEach((step, index) => {
        const id = `${procedure.procedure}.${c.id}.${index + 1}`
        lines.push(`    await test.step(${lit(id)}, async () => {`)
        lines.push(...compileStep(id, step).map((l) => `      ${l}`))
        lines.push(`    })`)
      })
      lines.push(`  })`)
    }
  }
  lines.push(`})`)
  lines.push('')
  return lines.join('\n')
}

function compileStep(id: string, step: Step): string[] {
  const out: string[] = []
  const chain = step.as ? `P.step(${lit(id)}).as(${lit(step.as)})` : `P.step(${lit(id)})`
  out.push(`const s = ${chain}`)
  if (step.do) {
    out.push(`const out = await s.do(${lit(step.do.verb)}, ${lit(step.do.args)})`)
  }
  const clauses = step.expect.map((e) => ({ outcome: e.outcome, args: e.args, ...(e.why ? { why: e.why } : {}) }))
  if (clauses.length > 0) {
    out.push(`await s.expect(${step.do ? 'out' : 'undefined'}, ${lit(clauses)})`)
  }
  if (step.capture) {
    out.push(`await s.capture(${lit(step.capture)})`)
  }
  if (clauses.length === 0 && !step.capture) {
    out.push(`await s.done()`)
  }
  return out
}
