import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { postSearchEvent } from './api'
import { SearchBox } from './components/SearchBox'
import { StillNeedHelp } from './components/StillNeedHelp'
import { manifest } from './manifest'
import { search, snippet } from './search'

const SEEN_KEY = 'help.search.seen'

/** Records each executed query once per session, so the miss rate counts people, not keystrokes. */
function reportOnce(query: string, hit: boolean) {
  try {
    const seen: string[] = JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? '[]')
    const key = query.trim().toLowerCase()
    if (seen.includes(key)) return
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen, key].slice(-50)))
  } catch {
    // storage may be unavailable; the count is best effort
  }
  postSearchEvent(hit ? { hit } : { hit, query }).catch(() => undefined)
}

export function SearchPage() {
  const [params] = useSearchParams()
  const query = params.get('q') ?? ''
  const active = query.trim().length >= 2
  const results = useQuery({
    queryKey: ['help', 'search', query],
    queryFn: () => search(query),
    enabled: active,
    staleTime: Infinity,
  })
  const hits = active ? (results.data ?? null) : null

  useEffect(() => {
    document.title = query ? `“${query}” | CarbonOS help` : 'Search | CarbonOS help'
  }, [query])

  // one report per executed query, once the reader has had a moment to look at it
  useEffect(() => {
    if (!hits) return
    const timer = window.setTimeout(() => reportOnce(query, hits.length > 0), 600)
    return () => window.clearTimeout(timer)
  }, [hits, query])

  return (
    <div className="help-page">
      <h1 className="help-h1">Search the help</h1>
      <div className="help-search-form">
        <SearchBox id="help-search-page" initial={query} autoFocus={!query} />
      </div>
      {hits && hits.length > 0 && (
        <>
          <p className="help-search-count" role="status">
            {hits.length} result{hits.length === 1 ? '' : 's'} for “{query}”
          </p>
          <ol className="help-results">
            {hits.map((hit) => (
              <li key={hit.id} className="help-result">
                <Link
                  to={`/help/${hit.slug}${hit.anchor ? `#${hit.anchor}` : ''}`}
                  className="help-result-title"
                >
                  {hit.title}
                  {hit.heading ? (
                    <span className="help-result-heading"> › {hit.heading}</span>
                  ) : null}
                </Link>
                <p className="help-result-snippet">{snippet(hit.text, query)}</p>
                <p className="help-result-group">
                  {manifest.groups.find((g) => g.slug === hit.group)?.title ?? 'Glossary'}
                </p>
              </li>
            ))}
          </ol>
        </>
      )}
      {hits && hits.length === 0 && (
        <div className="help-empty" role="status">
          <p>Nothing matched “{query}”. Try another word, or start from a topic:</p>
          <ul>
            {manifest.groups.map((g) => (
              <li key={g.slug}>
                <Link to={`/help/${g.slug}`}>{g.title}</Link>
              </li>
            ))}
          </ul>
          <StillNeedHelp title={`Search: ${query}`} />
        </div>
      )}
    </div>
  )
}
