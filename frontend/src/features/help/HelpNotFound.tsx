import { useEffect } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { legacyTarget, manifest } from './manifest'

/** A missing page: an old MkDocs URL redirects to its article; anything else offers the groups. */
export function HelpNotFound() {
  const location = useLocation()
  const target = legacyTarget(location.pathname)
  useEffect(() => {
    if (target === undefined) document.title = 'Page not found | CarbonOS help'
  }, [target])
  // an empty target is the hub itself; a group slug is its topic page
  if (target !== undefined)
    return <Navigate to={`/help${target ? `/${target}` : ''}${location.hash}`} replace />
  return (
    <div className="help-page">
      <h1 className="help-h1">That page is not here</h1>
      <p className="help-tagline">
        The help was reorganised by what you are trying to do. Start from a topic:
      </p>
      <ul className="help-empty-list">
        {manifest.groups.map((g) => (
          <li key={g.slug}>
            <Link to={`/help/${g.slug}`}>{g.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
