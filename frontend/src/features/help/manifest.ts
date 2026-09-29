import manifestJson from './generated/manifest.json'

/*
 * The compiled help tree (frontend/scripts/compile-help.mjs writes it from
 * help/tree.yaml and help/docs). Everything the shell needs to navigate,
 * without any article body: bodies load per page through pages.ts.
 */

export type HelpKind = 'task' | 'what-is' | 'step' | 'fix' | 'reference' | 'glossary'

export interface HelpHeading {
  id: string
  text: string
  level: 2 | 3
}

export interface HelpPageMeta {
  slug: string
  group: string | null
  title: string
  description: string
  kind: HelpKind
  role: string | null
  minutes: number | null
  step: number | null
  words: number
  lastReviewed: string
  owner: string
  headings: HelpHeading[]
}

export interface HelpGroup {
  slug: string
  title: string
  tagline: string
  showMoreAfter: number
  series: boolean
  articles: string[]
}

export interface HelpManifest {
  builtAt: string
  groups: HelpGroup[]
  pages: Record<string, HelpPageMeta>
  legacy: Record<string, string>
}

export const manifest = manifestJson as unknown as HelpManifest

export function groupBySlug(slug: string | undefined): HelpGroup | undefined {
  return manifest.groups.find((g) => g.slug === slug)
}

export function pageBySlug(slug: string | undefined): HelpPageMeta | undefined {
  return slug ? manifest.pages[slug] : undefined
}

export interface Crumb {
  to: string
  label: string
}

/** Help › group › article, as far as the slug goes. */
export function breadcrumbsFor(slug: string): Crumb[] {
  const crumbs: Crumb[] = [{ to: '/help', label: 'Help' }]
  const page = pageBySlug(slug)
  const group = groupBySlug(page?.group ?? slug)
  if (group) crumbs.push({ to: `/help/${group.slug}`, label: group.title })
  if (page) crumbs.push({ to: `/help/${page.slug}`, label: page.title })
  return crumbs
}

/** The previous and next article inside a series group; nothing elsewhere. */
export function prevNextFor(slug: string): { prev?: HelpPageMeta; next?: HelpPageMeta } {
  const page = pageBySlug(slug)
  const group = groupBySlug(page?.group ?? undefined)
  if (!page || !group?.series) return {}
  const steps = group.articles.map((s) => manifest.pages[s]).filter((p) => p?.kind === 'step')
  const index = steps.findIndex((p) => p.slug === slug)
  if (index < 0) return {}
  return { prev: steps[index - 1], next: steps[index + 1] }
}

/** The old MkDocs path for a slug, when the takeover map has one. */
export function legacyTarget(pathname: string): string | undefined {
  const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`
  return manifest.legacy[normalized] ?? manifest.legacy[pathname]
}
