#!/usr/bin/env node
/*
 * Compiles the end-user help (help/docs, help/tree.yaml) into what the React
 * help centre renders: a manifest, one sanitised HTML body per article, a
 * search index of article sections, and the assets. It also checks the
 * content the way `mkdocs build --strict` used to, and more (ADR 0006).
 *
 * Usage:
 *   node scripts/compile-help.mjs             compile and check
 *   node scripts/compile-help.mjs --check     check only, write nothing
 *   node scripts/compile-help.mjs --strict    warnings (budgets, descriptions) fail too
 *   node scripts/compile-help.mjs --if-present  keep the existing output when help/ is absent
 *
 * During the transition an article's source is help/docs/<group>/<article>.md
 * when that file exists and the first `from:` path in the tree otherwise, so
 * the MkDocs site keeps building from the old paths until the takeover.
 */
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
  copyFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve, extname, posix } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import { visit } from 'unist-util-visit'
import { toString as mdastToString } from 'mdast-util-to-string'
import { toString as hastToString } from 'hast-util-to-string'

const here = dirname(fileURLToPath(import.meta.url))
const FRONTEND = resolve(here, '..')
const HELP = resolve(FRONTEND, '..', 'help')
const DOCS = join(HELP, 'docs')
const TREE = join(HELP, 'tree.yaml')
const QUESTIONS = join(HELP, 'questions.yaml')
const OUT = join(FRONTEND, 'src', 'features', 'help', 'generated')
const ASSETS_OUT = join(FRONTEND, 'public', 'help-assets')
const DIAGRAMS = join(DOCS, 'assets', 'diagrams')

const args = new Set(process.argv.slice(2))
const CHECK_ONLY = args.has('--check')
const STRICT = args.has('--strict')
const IF_PRESENT = args.has('--if-present')

/** Word budgets by kind (plan section 1). [warnAt, failAt]; null = exempt. */
const BUDGETS = {
  task: [900, 1200],
  'what-is': [400, 400],
  step: [700, 700],
  fix: [800, 800],
  reference: [1200, 1200],
  glossary: null,
}

const problems = []
const warnings = []
const fail = (file, message) => problems.push(`${file}: ${message}`)
const warn = (file, message) => (STRICT ? problems : warnings).push(`${file}: ${message}`)

if (!existsSync(HELP) || !existsSync(TREE)) {
  if (IF_PRESENT && existsSync(join(OUT, 'manifest.json'))) {
    console.log('help/ is absent; keeping the compiled help already in place')
    process.exit(0)
  }
  console.error(`help tree not found at ${TREE}`)
  process.exit(1)
}

const tree = parseYaml(readFileSync(TREE, 'utf8'))
const questions = existsSync(QUESTIONS)
  ? parseYaml(readFileSync(QUESTIONS, 'utf8'))
  : { questions: [] }

/* ---------- resolve every article to a source file ---------- */

const pages = new Map() // key -> page record
const sourceToKey = new Map() // docs-relative source path -> key
const seenSlugs = new Set()

function register(key, group, article, sourceRel) {
  if (seenSlugs.has(key)) fail(TREE, `duplicate slug ${key}`)
  seenSlugs.add(key)
  const source = join(DOCS, sourceRel)
  if (!existsSync(source)) {
    fail(TREE, `${key}: source file not found (${sourceRel})`)
    return
  }
  pages.set(key, { key, group, article, sourceRel, source })
  sourceToKey.set(sourceRel, key)
}

function sourceFor(group, article) {
  const moved = posix.join(group, `${article.slug}.md`)
  if (existsSync(join(DOCS, moved))) return moved
  const from = Array.isArray(article.from) ? article.from[0] : article.from
  if (!from || from === 'new') return moved
  return from
}

for (const group of tree.groups ?? []) {
  for (const article of group.articles ?? []) {
    register(`${group.slug}/${article.slug}`, group, article, sourceFor(group.slug, article))
  }
}
if (tree.glossary) {
  register(
    'glossary',
    null,
    {
      slug: 'glossary',
      kind: 'glossary',
      title: tree.glossary.title ?? 'Glossary',
      from: tree.glossary.from,
    },
    sourceFor('', tree.glossary).replace(/^\//, ''),
  )
}

// every additional `from:` path also points at the merged article, so links to
// the old pages resolve during the transition
for (const group of tree.groups ?? []) {
  for (const article of group.articles ?? []) {
    const froms = Array.isArray(article.from) ? article.from : article.from ? [article.from] : []
    for (const f of froms)
      if (f !== 'new' && !sourceToKey.has(f)) sourceToKey.set(f, `${group.slug}/${article.slug}`)
  }
}

/* every page under help/docs must be in the tree or listed as dropped */
const dropped = new Set((tree.dropped ?? []).map((d) => (typeof d === 'string' ? d : d.path)))
function walkDocs(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) walkDocs(p, acc)
    else if (extname(entry) === '.md') acc.push(relative(DOCS, p).split('\\').join('/'))
  }
  return acc
}
for (const rel of walkDocs(DOCS)) {
  if (!sourceToKey.has(rel) && !dropped.has(rel))
    fail(join('help/docs', rel), 'page is neither in help/tree.yaml nor listed under dropped:')
}

/* ---------- markdown pipeline ---------- */

const EM_DASH = /\u2014/

/** `!!! note "Title"` followed by an indented block becomes an aside. */
function remarkAdmonition() {
  return (root) => {
    const children = root.children
    for (let i = 0; i < children.length; i++) {
      const node = children[i]
      if (node.type !== 'paragraph') continue
      const text = mdastToString(node)
      const m = text.match(/^!!!\s+(note|tip|warning|info)(?:\s+"([^"]*)")?\s*$/)
      if (!m) continue
      const body =
        children[i + 1]?.type === 'code' && !children[i + 1].lang ? children[i + 1].value : ''
      const inner = unified().use(remarkParse).use(remarkGfm).parse(body)
      const title = m[2] ?? m[1][0].toUpperCase() + m[1].slice(1)
      const aside = {
        type: 'admonition',
        data: {
          hName: 'aside',
          hProperties: { className: ['help-callout', `help-callout--${m[1]}`], role: 'note' },
        },
        children: [
          {
            type: 'paragraph',
            data: { hName: 'p', hProperties: { className: ['help-callout__title'] } },
            children: [{ type: 'text', value: title }],
          },
          ...inner.children,
        ],
      }
      children.splice(i, body ? 2 : 1, aside)
    }
  }
}

/** A mermaid fence becomes a figure showing the SVG rendered by `npm run help:diagrams`. */
function remarkMermaid(page) {
  return (root) => {
    let n = 0
    visit(root, 'code', (node, index, parent) => {
      if (node.lang !== 'mermaid') return
      n += 1
      const file = `${page.key.replace('/', '__')}-${n}.svg`
      const title = (node.value.match(/accTitle:\s*(.*)/) ?? [])[1]?.trim() ?? 'Diagram'
      const descr = (node.value.match(/accDescr:\s*(.*)/) ?? [])[1]?.trim() ?? ''
      const hash = createHash('sha256').update(node.value.trim()).digest('hex').slice(0, 16)
      const svgPath = join(DIAGRAMS, file)
      if (!existsSync(svgPath))
        fail(page.sourceRel, `diagram ${n} has no rendered SVG (run npm run help:diagrams)`)
      else if (!readFileSync(svgPath, 'utf8').includes(`source-sha256:${hash}`))
        fail(page.sourceRel, `diagram ${n} is stale (run npm run help:diagrams)`)
      page.diagrams.push({ file, hash, source: node.value })
      parent.children[index] = {
        type: 'figure',
        data: { hName: 'figure', hProperties: { className: ['help-figure'] } },
        children: [
          {
            type: 'image',
            url: `/help-assets/diagrams/${file}`,
            alt: title,
            data: { hProperties: { loading: 'lazy' } },
          },
          {
            type: 'paragraph',
            data: { hName: 'figcaption' },
            children: [{ type: 'text', value: descr }],
          },
        ],
      }
    })
  }
}

/**
 * A paragraph that is one Markdown image of a screenshot becomes a figure:
 * the file is served from /help-assets, loads lazily, and the alt text is
 * also the caption, so a reader knows what the picture is meant to show.
 */
function remarkScreenshots(page) {
  return (root) => {
    visit(root, 'paragraph', (node, index, parent) => {
      if (node.children.length !== 1 || node.children[0].type !== 'image') return
      const image = node.children[0]
      if (/^(https?:)?\/\//.test(image.url)) return
      const rel = posix.normalize(posix.join(posix.dirname(page.sourceRel), image.url))
      if (!rel.startsWith('assets/')) return
      if (!existsSync(join(DOCS, rel))) fail(page.sourceRel, `image ${image.url} not found`)
      const isScreen = rel.startsWith('assets/screens/')
      parent.children[index] = {
        type: 'figure',
        data: {
          hName: 'figure',
          hProperties: {
            className: isScreen ? ['help-figure', 'help-screenshot'] : ['help-figure'],
          },
        },
        children: [
          {
            type: 'image',
            url: `/help-assets/${rel.slice('assets/'.length)}`,
            alt: image.alt ?? '',
            data: { hProperties: { loading: 'lazy' } },
          },
          ...(image.alt
            ? [
                {
                  type: 'paragraph',
                  data: { hName: 'figcaption' },
                  children: [{ type: 'text', value: image.alt }],
                },
              ]
            : []),
        ],
      }
    })
  }
}

/** Drops HTML comments (the sources comment) and refuses any other raw HTML. */
function remarkNoHtml(page) {
  return (root) => {
    visit(root, 'html', (node, index, parent) => {
      if (/^\s*<!--[\s\S]*-->\s*$/.test(node.value)) parent.children.splice(index, 1)
      else if (/^<br\s*\/?>$/i.test(node.value.trim())) parent.children[index] = { type: 'break' }
      else fail(page.sourceRel, `raw HTML is not allowed: ${node.value.slice(0, 40)}`)
    })
  }
}

/** Relative .md links become /help routes; assets become /help-assets; external links open safely. */
function rehypeHelpLinks(page, links) {
  return (root) => {
    visit(root, 'element', (node) => {
      if (node.tagName !== 'a' || typeof node.properties?.href !== 'string') return
      const href = node.properties.href
      if (/^(https?:)?\/\//.test(href) || href.startsWith('mailto:')) {
        node.properties.target = '_blank'
        node.properties.rel = 'noopener'
        return
      }
      if (href.startsWith('#')) {
        links.push({ target: page.key, anchor: href.slice(1) })
        return
      }
      const [path, anchor] = href.split('#')
      const rel = posix.normalize(posix.join(posix.dirname(page.sourceRel), path))
      if (rel.startsWith('assets/')) {
        node.properties.href = `/help-assets/${rel.slice('assets/'.length)}`
        return
      }
      if (rel.startsWith('/help/')) {
        node.properties.href = href
        links.push({ target: rel.slice('/help/'.length).replace(/\/$/, ''), anchor })
        return
      }
      const key = sourceToKey.get(rel)
      if (!key) {
        if (dropped.has(rel)) {
          // a link to a page the tree dropped (an old index) lands on the hub until the writers relink it
          warn(page.sourceRel, `link to dropped page ${rel} now points at the hub`)
          node.properties.href = '/help'
          return
        }
        fail(page.sourceRel, `broken link ${href}`)
        return
      }
      node.properties.href = `/help/${key}${anchor ? `#${anchor}` : ''}`
      links.push({ target: key, anchor })
    })
    visit(root, 'element', (node, index, parent) => {
      if (node.tagName === 'table' && parent && parent.tagName !== 'div') {
        parent.children[index] = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['help-table'] },
          children: [node],
        }
      }
    })
  }
}

const schema = {
  ...defaultSchema,
  clobberPrefix: '',
  clobber: [],
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes['*'] ?? []), 'className', 'id', 'role'],
    img: ['src', 'alt', 'loading', 'width', 'height'],
    a: ['href', 'target', 'rel', 'id'],
  },
  tagNames: [...defaultSchema.tagNames, 'aside', 'figure', 'figcaption'],
}

function countWords(root) {
  let words = 0
  visit(root, (node) => {
    if (node.type === 'code' || node.type === 'yaml' || node.type === 'html') return
    if (node.type === 'text' || node.type === 'inlineCode')
      words += node.value.split(/\s+/).filter(Boolean).length
  })
  return words
}

function sections(root) {
  // one search document per H2 section (the text before the first H2 belongs to the title)
  const out = []
  let current = { heading: '', anchor: '', parts: [] }
  for (const node of root.children) {
    if (node.type === 'heading' && node.depth === 2) {
      out.push(current)
      current = { heading: mdastToString(node), anchor: '', parts: [] }
    } else if (node.type !== 'yaml' && node.type !== 'html' && node.type !== 'code') {
      current.parts.push(mdastToString(node))
    }
  }
  out.push(current)
  return out
}

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')

async function compilePage(page) {
  const raw = readFileSync(page.source, 'utf8')
  const article = page.article
  page.diagrams = []
  const links = []

  // em-dash outside fenced code
  const withoutFences = raw.replace(/```[\s\S]*?```/g, '')
  const dashLine = withoutFences.split('\n').findIndex((l) => EM_DASH.test(l))
  if (dashLine >= 0) fail(page.sourceRel, `em-dash on line ${dashLine + 1}`)

  const parser = unified().use(remarkParse).use(remarkFrontmatter, ['yaml']).use(remarkGfm)
  const mdast = parser.parse(raw)
  await parser.run(mdast)

  const fm = mdast.children.find((n) => n.type === 'yaml')
  const meta = fm ? (parseYaml(fm.value) ?? {}) : {}
  if (!meta.owner || !meta.last_reviewed)
    fail(page.sourceRel, 'front matter needs owner and last_reviewed')

  // the single H1 is the page title; the tree's title wins when set
  const h1s = mdast.children.filter((n) => n.type === 'heading' && n.depth === 1)
  if (h1s.length !== 1) fail(page.sourceRel, `expected one H1, found ${h1s.length}`)
  const title = article.title ?? (h1s[0] ? mdastToString(h1s[0]) : page.key)
  mdast.children = mdast.children.filter((n) => !(n.type === 'heading' && n.depth === 1))

  // skipped heading levels
  let last = 1
  for (const n of mdast.children) {
    if (n.type !== 'heading') continue
    if (n.depth > last + 1)
      fail(page.sourceRel, `heading level skips from ${last} to ${n.depth}: ${mdastToString(n)}`)
    last = n.depth
  }

  // the old "**Role needed:** ..." lead becomes the role pill
  let role = meta.role
  const first = mdast.children.find((n) => n.type !== 'yaml' && n.type !== 'html')
  if (!role && first?.type === 'paragraph') {
    const t = mdastToString(first)
    const m = t.match(/^Role needed:\s*(.+)$/s)
    if (m) {
      role = m[1].trim()
      mdast.children.splice(mdast.children.indexOf(first), 1)
    }
  }

  const words = countWords(mdast)
  const kind = article.kind ?? 'task'
  const budget = kind in BUDGETS ? BUDGETS[kind] : BUDGETS.task
  if (budget) {
    const [warnAt, failAt] = budget
    if (words > failAt)
      warn(page.sourceRel, `${words} words exceeds the ${kind} budget of ${failAt}`)
    else if (words > warnAt)
      warn(page.sourceRel, `${words} words is over the ${kind} target of ${warnAt}`)
  }
  let callouts = 0
  visit(mdast, 'admonition', () => callouts++)

  let description = meta.description
  if (!description) {
    const p = mdast.children.find((n) => n.type === 'paragraph')
    description = p
      ? mdastToString(p)
          .replace(/\s+/g, ' ')
          .split(/(?<=\.)\s/)[0]
          .slice(0, 220)
      : ''
    warn(page.sourceRel, 'no description in the front matter; using the first sentence')
  } else {
    const n = description.split(/\s+/).length
    if (n < 15 || n > 30) warn(page.sourceRel, `description is ${n} words; 15 to 30 expected`)
  }

  const secs = sections(mdast)

  const processor = unified()
    .use(remarkAdmonition)
    .use(remarkMermaid, page)
    .use(remarkScreenshots, page)
    .use(remarkNoHtml, page)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSlug)
    .use(rehypeHelpLinks, page, links)
    .use(rehypeSanitize, schema)
    .use(rehypeStringify)
  visit(mdast, 'admonition', () => callouts++)
  const hast = await processor.run(mdast)
  const html = processor.stringify(hast)

  if (kind === 'task' && callouts > 1)
    warn(page.sourceRel, `${callouts} callouts; a task carries at most one`)

  const headings = []
  visit(hast, 'element', (node) => {
    if (node.tagName === 'h2' || node.tagName === 'h3')
      headings.push({
        id: node.properties.id,
        text: hastToString(node),
        level: node.tagName === 'h2' ? 2 : 3,
      })
  })
  for (const s of secs)
    s.anchor = s.heading
      ? (headings.find((h) => h.text === s.heading)?.id ?? slugify(s.heading))
      : ''

  for (const screen of meta.screens ?? []) {
    if (!existsSync(join(DOCS, 'assets', 'screens', screen)))
      fail(page.sourceRel, `screenshot ${screen} not found under assets/screens`)
  }

  Object.assign(page, {
    title,
    description,
    kind,
    role: role ?? null,
    minutes: meta.minutes ?? null,
    keywords: meta.keywords ?? [],
    words,
    lastReviewed: String(meta.last_reviewed ?? ''),
    owner: meta.owner ?? '',
    headings,
    html,
    links,
    sections: secs,
  })
}

for (const page of pages.values()) await compilePage(page)

/* ---------- cross-page checks ---------- */

const anchorsOf = (key) => new Set((pages.get(key)?.headings ?? []).map((h) => h.id))
for (const page of pages.values()) {
  for (const link of page.links) {
    if (!pages.has(link.target)) fail(page.sourceRel, `link to unknown article ${link.target}`)
    else if (link.anchor && !anchorsOf(link.target).has(link.anchor))
      fail(page.sourceRel, `link to unknown anchor #${link.anchor} on ${link.target}`)
  }
}
for (const q of questions.questions ?? []) {
  const [key, anchor] = String(q.answer).split('#')
  if (!pages.has(key)) fail('help/questions.yaml', `${q.id}: answer ${key} is not an article`)
  else if (anchor && !anchorsOf(key).has(anchor))
    warn('help/questions.yaml', `${q.id}: anchor #${anchor} does not exist on ${key} yet`)
  for (const alt of q.also ?? [])
    if (!pages.has(String(alt).split('#')[0]))
      fail('help/questions.yaml', `${q.id}: alternate ${alt} is not an article`)
}

/* ---------- report ---------- */

for (const w of warnings) console.warn(`warning ${w}`)
for (const p of problems) console.error(`error ${p}`)
if (problems.length) {
  console.error(`help: ${problems.length} error(s), ${warnings.length} warning(s)`)
  process.exit(1)
}
console.log(`help: ${pages.size} articles, ${warnings.length} warning(s)`)
if (CHECK_ONLY) process.exit(0)

/* ---------- emit ---------- */

rmSync(OUT, { recursive: true, force: true })
mkdirSync(join(OUT, 'pages'), { recursive: true })
mkdirSync(ASSETS_OUT, { recursive: true })

const groups = (tree.groups ?? []).map((g) => ({
  slug: g.slug,
  title: g.title,
  tagline: g.tagline ?? '',
  showMoreAfter: g.showMoreAfter ?? 8,
  series: (tree.series ?? []).includes(g.slug),
  articles: (g.articles ?? []).map((a) => `${g.slug}/${a.slug}`),
}))
const manifest = { builtAt: new Date().toISOString(), groups, pages: {}, legacy: tree.legacy ?? {} }
const search = []
for (const page of pages.values()) {
  const step = groups.find((g) => g.slug === page.group?.slug)?.series
    ? page.group.articles
        .filter((a) => a.kind === 'step')
        .findIndex((a) => a.slug === page.article.slug) + 1 || null
    : null
  manifest.pages[page.key] = {
    slug: page.key,
    group: page.group?.slug ?? null,
    title: page.title,
    description: page.description,
    kind: page.kind,
    role: page.role,
    minutes: page.minutes,
    step,
    words: page.words,
    lastReviewed: page.lastReviewed,
    owner: page.owner,
    headings: page.headings,
  }
  writeFileSync(
    join(OUT, 'pages', `${page.key.replace('/', '__')}.json`),
    JSON.stringify({ slug: page.key, html: page.html }),
  )
  for (const s of page.sections) {
    const text = s.parts.join(' ').replace(/\s+/g, ' ').trim().slice(0, 600)
    if (!text && !s.heading) continue
    search.push({
      id: `${page.key}#${s.anchor}`,
      slug: page.key,
      anchor: s.anchor,
      group: page.group?.slug ?? 'glossary',
      title: page.title,
      heading: s.heading,
      text,
      keywords: page.keywords,
    })
  }
}
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1))
writeFileSync(join(OUT, 'search.json'), JSON.stringify(search))

// assets: everything under help/docs/assets that is not markdown, synced in
// place. The folder is never removed and recreated: the Vite dev server lists
// public/ once and follows changes inside it, and a recreated folder would drop
// out of that list until the server restarts.
function syncAssets(dir, outDir) {
  if (!existsSync(dir)) return
  mkdirSync(outDir, { recursive: true })
  const wanted = new Set()
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) {
      wanted.add(entry)
      syncAssets(p, join(outDir, entry))
    } else if (extname(entry) !== '.md') {
      wanted.add(entry)
      copyFileSync(p, join(outDir, entry))
    }
  }
  for (const entry of readdirSync(outDir)) {
    if (!wanted.has(entry)) rmSync(join(outDir, entry), { recursive: true, force: true })
  }
}
syncAssets(join(DOCS, 'assets'), ASSETS_OUT)
console.log(
  `help: wrote ${pages.size} pages, ${search.length} search sections, assets to public/help-assets`,
)
