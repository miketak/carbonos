/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/*
 * Spec 10's token table, held to WCAG 2.2 AA: every text token clears 4.5:1 on
 * each surface it is meant for, in the light set and the dark set. The test
 * reads src/index.css itself, so a token cannot change without this changing.
 * Dots and borders are not tested: a status is always a dot and a word, and a
 * control's boundary is read together with its label and fill.
 */

// the sheet as written, not as Tailwind compiles it: a ?raw import goes through the plugin
const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`)
  if (start < 0) throw new Error(`no ${selector} block in index.css`)
  const body = css.slice(start, css.indexOf('}', start))
  const tokens: Record<string, string> = {}
  for (const match of body.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/g)) tokens[match[1]] = match[2]
  return tokens
}

function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const pageSurfaces = ['ground', 'surface', 'surface-sunken', 'surface-raised', 'selected']
const toneSurfaces = ['ground', 'surface', 'surface-sunken']

/** text token → the surfaces it must read on */
const pairs: ReadonlyArray<[string, ReadonlyArray<string>]> = [
  ['ink', pageSurfaces],
  ['ink-muted', pageSurfaces],
  ['link', toneSurfaces],
  ['success', toneSurfaces],
  ['warning', toneSurfaces],
  ['danger', toneSurfaces],
  ['info', toneSurfaces],
  ['primary-ink', ['primary']],
  ['sidebar-ink', ['sidebar-bg', 'sidebar-active']],
  ['sidebar-muted', ['sidebar-bg', 'sidebar-active']],
  ['sidebar-accent', ['sidebar-bg', 'sidebar-active']],
]

describe.each([
  ['light', ':root'],
  ['dark', "[data-theme='dark']"],
])('%s tokens', (_name, selector) => {
  const tokens = block(selector)

  it('defines every token the pairs name', () => {
    for (const [text, surfaces] of pairs) {
      expect(tokens[text], text).toMatch(/^#/)
      for (const surface of surfaces) expect(tokens[surface], surface).toMatch(/^#/)
    }
  })

  it.each(pairs.flatMap(([text, surfaces]) => surfaces.map((surface) => [text, surface])))(
    '%s on %s clears 4.5:1',
    (text, surface) => {
      expect(contrast(tokens[text], tokens[surface])).toBeGreaterThanOrEqual(4.5)
    },
  )
})
