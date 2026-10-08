/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { expect, it } from 'vitest'

/*
 * Every date the app prints goes through src/lib/dates.ts, so one form (ISO,
 * ECO-134) holds on every screen. A feature that formats a date on its own
 * would print the browser's form again, and the one place that should catch
 * it is here, not a tester in Accra.
 */

const root = resolve(process.cwd(), 'src')

// the help centre prints its review date with the month written out, which no reader misorders
const allowed = new Set([
  'lib/dates.ts',
  'lib/dates.test.ts',
  'features/help/ArticlePage.tsx',
  'test/dates-guard.test.ts',
])

const forbidden = [
  /\.toLocaleDateString\(/,
  /\.toLocaleTimeString\(/,
  /new Date\([^)]*\)\s*\.toLocaleString\(/,
  /Intl\.DateTimeFormat\(/,
  /dateStyle:/,
]

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sources(path)
    return /\.(ts|tsx)$/.test(name) ? [path] : []
  })
}

it('formats dates only through src/lib/dates.ts', () => {
  const offenders: string[] = []
  for (const path of sources(root)) {
    const file = relative(root, path)
    if (allowed.has(file)) continue
    const text = readFileSync(path, 'utf8')
    for (const pattern of forbidden) {
      if (pattern.test(text)) offenders.push(`${file}: ${pattern.source}`)
    }
  }
  expect(offenders).toEqual([])
})
