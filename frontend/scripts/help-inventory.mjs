// Inventory of the end-user help under ../help/docs: one line per page with
// its path, word count, H1 and H2 list. Used by the help centre rebuild
// (docs/reviews/2026-09-28-help-ia.md) and by the later compiler phases.
//
// Usage: node scripts/help-inventory.mjs [--json] [docsDir]
//
// The word count excludes YAML front matter and HTML comments (the sources
// comment), so it matches what a reader sees. Fenced code is counted, since
// the reader sees it too.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const asJson = args.includes('--json')
const docsDir = resolve(
  args.find((a) => !a.startsWith('--')) ?? join(here, '..', '..', 'help', 'docs'),
)

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (name.endsWith('.md')) out.push(full)
  }
  return out
}

export function stripFrontMatterAndComments(source) {
  let text = source.replace(/\r\n/g, '\n')
  if (text.startsWith('---\n')) {
    const end = text.indexOf('\n---\n', 4)
    if (end !== -1) text = text.slice(end + 5)
  }
  return text.replace(/<!--[\s\S]*?-->/g, '')
}

export function inventoryPage(source) {
  const body = stripFrontMatterAndComments(source)
  const words = body.split(/\s+/).filter((w) => w.length > 0).length
  let h1 = ''
  const h2 = []
  let inFence = false
  for (const line of body.split('\n')) {
    if (/^(```|~~~)/.test(line)) inFence = !inFence
    if (inFence) continue
    const m1 = line.match(/^# (.+?)\s*#*\s*$/)
    if (m1 && !h1) h1 = m1[1].trim()
    const m2 = line.match(/^## (.+?)\s*#*\s*$/)
    if (m2) h2.push(m2[1].trim())
  }
  return { words, h1, h2 }
}

export function inventory(root) {
  return walk(root).map((file) => ({
    path: relative(root, file).split(sep).join('/'),
    ...inventoryPage(readFileSync(file, 'utf8')),
  }))
}

const pages = inventory(docsDir)
if (asJson) {
  process.stdout.write(JSON.stringify(pages, null, 2) + '\n')
} else {
  for (const p of pages) {
    process.stdout.write(`${p.path}\t${p.words}\t${p.h1}\t${p.h2.join(' | ')}\n`)
  }
  process.stderr.write(`${pages.length} pages, ${pages.reduce((n, p) => n + p.words, 0)} words\n`)
}
