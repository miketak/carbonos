import type MiniSearch from 'minisearch'

/*
 * Client-side search over article sections. The section documents ship as
 * one lazily loaded JSON file; the index is built in the browser on the
 * first search (about 450 documents, well under 50 ms). Results land on the
 * answering section, which is what the time-to-help metric measures.
 */

export interface SearchDoc {
  id: string
  slug: string
  anchor: string
  group: string
  title: string
  heading: string
  text: string
  keywords: string[]
}

export interface SearchHit extends SearchDoc {
  score: number
}

let index: Promise<MiniSearch<SearchDoc>> | undefined

function build(): Promise<MiniSearch<SearchDoc>> {
  index ??= Promise.all([import('minisearch'), import('./generated/search.json')]).then(
    ([lib, module]) => {
      const docs = module.default as SearchDoc[]
      const mini = new lib.default<SearchDoc>({
        fields: ['title', 'heading', 'keywords', 'text'],
        storeFields: ['slug', 'anchor', 'group', 'title', 'heading', 'text', 'keywords'],
        searchOptions: {
          boost: { title: 4, heading: 3, keywords: 3, text: 1 },
          prefix: true,
          fuzzy: 0.2,
        },
      })
      mini.addAll(docs)
      return mini
    },
  )
  return index
}

export async function search(query: string, limit = 20): Promise<SearchHit[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const mini = await build()
  return mini.search(q).slice(0, limit) as unknown as SearchHit[]
}

/** A short excerpt around the first query term, for the result list. */
export function snippet(text: string, query: string, length = 160): string {
  const term = query.trim().split(/\s+/)[0]?.toLowerCase() ?? ''
  const at = term ? text.toLowerCase().indexOf(term) : -1
  const start = Math.max(0, at - 60)
  const cut = text.slice(start, start + length)
  return (start > 0 ? '…' : '') + cut + (start + length < text.length ? '…' : '')
}
