#!/usr/bin/env node
/*
 * Renders every Mermaid fence in the help to an SVG under
 * help/docs/assets/diagrams, named <group>__<article>-<n>.svg, with the
 * fence's hash embedded so compile-help.mjs can tell a stale diagram from a
 * fresh one. Run it on the author's machine after editing a diagram and
 * commit the SVGs; the browser never runs Mermaid (ADR 0006).
 *
 * Rendering uses the Mermaid package inside a Playwright page, so no extra
 * download beyond the Playwright browser is needed.
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve, posix } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'
import { chromium } from '@playwright/test'
import { homedir } from 'node:os'

const here = dirname(fileURLToPath(import.meta.url))
const FRONTEND = resolve(here, '..')
const HELP = resolve(FRONTEND, '..', 'help')
const DOCS = join(HELP, 'docs')
const DIAGRAMS = join(DOCS, 'assets', 'diagrams')
const MERMAID = resolve(FRONTEND, 'node_modules', 'mermaid', 'dist', 'mermaid.min.js')

const tree = parseYaml(readFileSync(join(HELP, 'tree.yaml'), 'utf8'))
const jobs = []

function sourceFor(group, article) {
  const moved = posix.join(group, `${article.slug}.md`)
  if (existsSync(join(DOCS, moved))) return moved
  const from = Array.isArray(article.from) ? article.from[0] : article.from
  return from && from !== 'new' ? from : moved
}
function collect(key, sourceRel) {
  const source = join(DOCS, sourceRel)
  if (!existsSync(source)) return
  const raw = readFileSync(source, 'utf8')
  let n = 0
  for (const m of raw.matchAll(/```mermaid\n([\s\S]*?)```/g)) {
    n += 1
    const code = m[1]
    jobs.push({
      file: `${key.replace('/', '__')}-${n}.svg`,
      code,
      hash: createHash('sha256').update(code.trim()).digest('hex').slice(0, 16),
    })
  }
}
for (const g of tree.groups ?? [])
  for (const a of g.articles ?? []) collect(`${g.slug}/${a.slug}`, sourceFor(g.slug, a))
if (tree.glossary) collect('glossary', sourceFor('', tree.glossary).replace(/^\//, ''))

mkdirSync(DIAGRAMS, { recursive: true })
const wanted = new Set(jobs.map((j) => j.file))
for (const f of readdirSync(DIAGRAMS))
  if (f.endsWith('.svg') && !wanted.has(f)) rmSync(join(DIAGRAMS, f))

const stale = jobs.filter((j) => {
  const p = join(DIAGRAMS, j.file)
  return !existsSync(p) || !readFileSync(p, 'utf8').includes(`source-sha256:${j.hash}`)
})
console.log(`${jobs.length} diagram(s), ${stale.length} to render`)
if (stale.length === 0) process.exit(0)

// Playwright's own browser when it is installed (npx playwright install chromium);
// otherwise any headless shell already in the cache, whatever version put it there
function cachedShell() {
  const cache = join(homedir(), '.cache', 'ms-playwright')
  if (!existsSync(cache)) return undefined
  const dir = readdirSync(cache)
    .filter((d) => d.startsWith('chromium_headless_shell-'))
    .sort()
    .at(-1)
  const exe = dir && join(cache, dir, 'chrome-headless-shell-linux64', 'chrome-headless-shell')
  return exe && existsSync(exe) ? exe : undefined
}
let browser
try {
  browser = await chromium.launch()
} catch {
  const executablePath = cachedShell()
  if (!executablePath) throw new Error('no Playwright browser: run npx playwright install chromium')
  browser = await chromium.launch({ executablePath })
}
const page = await browser.newPage()
await page.setContent('<!doctype html><html><body><div id="host"></div></body></html>')
// the classic bundle is injected inline: a blank page cannot import a module from disk
await page.addScriptTag({ content: readFileSync(MERMAID, 'utf8') })
await page.evaluate(() => {
  window.mermaid.initialize({
    startOnLoad: false,
    theme: 'neutral',
    fontFamily: 'Inter, system-ui, sans-serif',
  })
  window.renderMermaid = async (code, id) => (await window.mermaid.render(id, code)).svg
})
for (const job of stale) {
  try {
    const svg = await page.evaluate(
      ([code, id]) => window.renderMermaid(code, id),
      [job.code, 'd' + job.hash],
    )
    const cleaned = svg.replace(/<svg /, `<!-- source-sha256:${job.hash} --><svg `)
    writeFileSync(join(DIAGRAMS, job.file), cleaned)
    console.log(`rendered ${job.file}`)
  } catch (error) {
    console.error(`failed ${job.file}: ${String(error).split('\n')[0]}`)
    process.exitCode = 1
  }
}
await browser.close()
