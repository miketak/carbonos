#!/usr/bin/env node
/*
 * Keeps the help centre within its bundle budget (plan section 2, ADR 0006):
 * the lazy route chunk, each article body, and the search index each have a
 * gzipped ceiling, and the main chunk may not grow because of the help.
 * Reads Vite's build manifest (build.manifest is on in vite.config.ts).
 */
import { readFileSync, statSync, readdirSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(here, '..', 'dist')
const ASSETS = join(DIST, 'assets')

const KB = 1024
const BUDGETS = {
  route: 60 * KB, // HelpRoutes chunk with the manifest
  page: 12 * KB, // one article body
  glossary: 20 * KB,
  search: 60 * KB, // the section documents plus MiniSearch, loaded on the first search
}

const gz = (file) => gzipSync(readFileSync(join(ASSETS, file))).length
const problems = []
const report = []

const files = readdirSync(ASSETS)
const check = (label, file, budget) => {
  const size = gz(file)
  report.push(
    `${label.padEnd(10)} ${file.padEnd(44)} ${(size / KB).toFixed(1).padStart(6)} KB gz  (budget ${budget / KB} KB)`,
  )
  if (size > budget)
    problems.push(
      `${file} is ${(size / KB).toFixed(1)} KB gzipped, over the ${label} budget of ${budget / KB} KB`,
    )
}

const route = files.find((f) => /^HelpRoutes-.*\.js$/.test(f))
if (!route) problems.push('no HelpRoutes chunk in dist/assets: the help route is not lazy')
else check('route', route, BUDGETS.route)

const search = files.find((f) => /^search-.*\.js$/.test(f))
if (search) check('search', search, BUDGETS.search)

for (const f of files.filter((f) => /__.*\.js$/.test(f) || /^glossary-.*\.js$/.test(f))) {
  check(
    f.startsWith('glossary') ? 'glossary' : 'page',
    f,
    f.startsWith('glossary') ? BUDGETS.glossary : BUDGETS.page,
  )
}

// the main chunk: report only; the review compares it against the previous release
const main = files.find((f) => /^index-.*\.js$/.test(f))
if (main)
  report.push(
    `main       ${main.padEnd(44)} ${(gz(main) / KB).toFixed(1).padStart(6)} KB gz  (raw ${(statSync(join(ASSETS, main)).size / KB).toFixed(0)} KB)`,
  )

console.log(report.filter((r) => !r.startsWith('page')).join('\n'))
const pages = report.filter((r) => r.startsWith('page'))
console.log(
  `${pages.length} article chunks; largest ${pages.map((r) => parseFloat(r.split('KB gz')[0].trim().split(' ').at(-1))).sort((a, b) => b - a)[0]} KB gz`,
)
if (problems.length) {
  for (const p of problems) console.error(`error ${p}`)
  process.exit(1)
}
console.log('bundle budget: ok')
