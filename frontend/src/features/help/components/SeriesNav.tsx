import { Link } from 'react-router-dom'
import { prevNextFor } from '../manifest'

/** Previous and next inside a series such as Get started; nothing on other articles. */
export function SeriesNav({ slug }: { slug: string }) {
  const { prev, next } = prevNextFor(slug)
  if (!prev && !next) return null
  return (
    <nav className="help-series" aria-label="Series">
      {prev ? (
        <Link to={`/help/${prev.slug}`} className="help-series-link is-prev">
          <span className="help-series-label">Previous</span>
          {prev.title}
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link to={`/help/${next.slug}`} className="help-series-link is-next">
          <span className="help-series-label">Next</span>
          {next.title}
        </Link>
      )}
    </nav>
  )
}
