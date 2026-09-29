import { useQuery } from '@tanstack/react-query'

/*
 * One lazy chunk per article body. The glob is resolved at build time, so a
 * slug that is not in the tree cannot be fetched at all.
 */
const bodies = import.meta.glob<{ default: { slug: string; html: string } }>(
  './generated/pages/*.json',
)

export function hasBody(slug: string): boolean {
  return `./generated/pages/${slug.replace('/', '__')}.json` in bodies
}

export async function loadBody(slug: string): Promise<string> {
  const loader = bodies[`./generated/pages/${slug.replace('/', '__')}.json`]
  if (!loader) throw new Error(`no help page ${slug}`)
  return (await loader()).default.html
}

export function useHelpPage(slug: string) {
  return useQuery({
    queryKey: ['help', 'page', slug],
    queryFn: () => loadBody(slug),
    staleTime: Infinity,
  })
}
