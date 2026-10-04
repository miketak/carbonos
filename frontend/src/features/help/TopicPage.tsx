import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Panel } from '../../components/Panel'
import { HelpBreadcrumb } from './HelpBreadcrumb'
import { HelpNotFound } from './HelpNotFound'
import { groupBySlug, manifest } from './manifest'

/** A group's page: its articles as cards with one sentence each, then the neighbouring groups. */
export function TopicPage() {
  const { group: slug } = useParams()
  const group = groupBySlug(slug)
  useEffect(() => {
    if (group) document.title = `${group.title} | CarbonOS help`
  }, [group])
  if (!group) return <HelpNotFound />
  const index = manifest.groups.indexOf(group)
  const neighbours = [manifest.groups[index - 1], manifest.groups[index + 1]].filter(Boolean)
  return (
    <div className="help-page">
      <HelpBreadcrumb
        crumbs={[
          { to: '/help', label: 'Help' },
          { to: `/help/${group.slug}`, label: group.title },
        ]}
      />
      <h1 className="help-h1">{group.title}</h1>
      {group.tagline && <p className="help-tagline">{group.tagline}</p>}
      <ul className="help-cards">
        {group.articles.map((articleSlug) => {
          const page = manifest.pages[articleSlug]
          if (!page) return null
          return (
            <li key={articleSlug}>
              <Panel className="help-card">
                <h2 className="help-card-title">
                  <Link to={`/help/${articleSlug}`}>
                    {group.series && page.step ? `${page.step}. ` : ''}
                    {page.title}
                  </Link>
                </h2>
                <p className="help-card-text">{page.description}</p>
                <Link
                  to={`/help/${articleSlug}`}
                  className="help-card-link"
                  aria-hidden
                  tabIndex={-1}
                >
                  View topic
                </Link>
              </Panel>
            </li>
          )
        })}
      </ul>
      {neighbours.length > 0 && (
        <section className="help-explore" aria-labelledby="explore-more">
          <h2 id="explore-more" className="help-h2">
            Explore more
          </h2>
          <ul>
            {neighbours.map((n) => (
              <li key={n.slug}>
                <Link to={`/help/${n.slug}`}>{n.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
