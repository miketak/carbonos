#!/usr/bin/env node
/*
 * The design-token guard (spec 10, ADR 0009): a feature file uses the kit and
 * the token utilities, never the brand palette, a tint of it, a Tailwind
 * colour scale, a blur, a monospace face or a hex literal. The landing page
 * (src/features/home) keeps its own look and the style sheet defines the
 * tokens, so both are exempt. Run as part of `npm run lint`; exit 1 on any hit.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = new URL('../src/', import.meta.url).pathname
// the brand palette stays on the landing page, the symbol and the splash (spec 10);
// the style sheet defines the tokens; the tests assert class names
const exempt = [
  join(root, 'features/home'),
  join(root, 'features/auth/SplashScreen.tsx'),
  join(root, 'components/AmbientBackground.tsx'),
  join(root, 'components/carbonOsMarkGeometry.ts'),
  join(root, 'components/Wordmark.tsx'),
  join(root, 'index.css'),
  join(root, 'test'),
]

const rules = [
  [
    /\b(?:text|bg|border|ring|from|to|via|accent|decoration|fill|stroke)-(?:dark-teal|teal|bright-teal|accent-green|soft-mint|teal-deep)(?:\/\d+)?\b/,
    'brand palette utility',
  ],
  [/\b(?:bg|border|ring|text|from|to|via)-(?:white|black)\/\d+\b/, 'white or black tint'],
  [/\bbackdrop-(?:blur|saturate)/, 'backdrop filter'],
  [
    /\b(?:text|bg|border|ring|accent|decoration)-(?:red|amber|slate|gray|zinc|neutral|stone|green|emerald|blue|sky|orange|yellow|rose|pink|purple|indigo|violet)-\d{2,3}(?:\/\d+)?\b/,
    'Tailwind colour scale',
  ],
  [/\bfont-mono\b/, 'monospace face'],
  [/\btabular-nums\b/, 'tabular figures'],
  [/#[0-9a-fA-F]{6}\b/, 'hex colour literal'],
  [/\bGlassCard\b/, 'GlassCard (use Panel)'],
  [/\bStatusPill\b/, 'StatusPill (use StatusDot)'],
]

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (exempt.some((e) => path === e || path.startsWith(e + '/'))) continue
    if (statSync(path).isDirectory()) yield* files(path)
    else if (/\.(tsx|ts|css)$/.test(name) && !/\.test\.tsx?$/.test(name)) yield path
  }
}

const hits = []
for (const path of files(root)) {
  const lines = readFileSync(path, 'utf8').split('\n')
  lines.forEach((line, i) => {
    for (const [pattern, why] of rules) {
      const match = line.match(pattern)
      if (match) hits.push(`${relative(root, path)}:${i + 1}: ${why}: ${match[0]}`)
    }
  })
}

if (hits.length) {
  console.error(
    `design tokens: ${hits.length} hit(s) outside the landing page and the style sheet\n`,
  )
  for (const hit of hits) console.error('  ' + hit)
  console.error('\nUse the kit and the token utilities (spec 10, ADR 0009).')
  process.exit(1)
}
console.log('design tokens: ok')
