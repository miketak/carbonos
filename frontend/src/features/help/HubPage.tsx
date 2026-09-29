import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShowMoreList } from './components/ShowMoreList'
import { manifest } from './manifest'

/** The resources hub: the groups by the reader's job, each a plain list of articles. */
export function HubPage() {
  useEffect(() => {
    document.title = 'CarbonOS help'
  }, [])
  return (
    <div className="help-page">
      <h1 className="help-h1">CarbonOS help</h1>
      <p className="help-tagline">
        How to record, classify, calculate, publish and administer a greenhouse gas inventory in
        CarbonOS, one job at a time.
      </p>
      <div className="help-hub">
        {manifest.groups.map((group) => (
          <section
            key={group.slug}
            className="help-hub-group"
            aria-labelledby={`hub-${group.slug}`}
          >
            <h2 id={`hub-${group.slug}`} className="help-hub-title">
              <Link to={`/help/${group.slug}`}>{group.title}</Link>
            </h2>
            {group.tagline && <p className="help-hub-tagline">{group.tagline}</p>}
            <ShowMoreList
              items={group.articles.map((slug) => ({
                to: `/help/${slug}`,
                label: manifest.pages[slug]?.title ?? slug,
              }))}
              fold={group.showMoreAfter}
            />
          </section>
        ))}
        <section className="help-hub-group" aria-labelledby="hub-glossary">
          <h2 id="hub-glossary" className="help-hub-title">
            <Link to="/help/glossary">Glossary</Link>
          </h2>
          <p className="help-hub-tagline">One stable name for each thing in CarbonOS.</p>
        </section>
      </div>
    </div>
  )
}
