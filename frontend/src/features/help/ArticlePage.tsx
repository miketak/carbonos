import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ArticleBody } from './components/ArticleBody'
import { FeedbackWidget } from './components/FeedbackWidget'
import { HelpSkeleton } from './components/HelpSkeleton'
import { OnThisPage } from './components/OnThisPage'
import { RolePill } from './components/RolePill'
import { SeriesNav } from './components/SeriesNav'
import { StillNeedHelp } from './components/StillNeedHelp'
import { HelpBreadcrumb } from './HelpBreadcrumb'
import { HelpNotFound } from './HelpNotFound'
import { breadcrumbsFor, pageBySlug } from './manifest'
import { useHelpPage } from './pages'

/** One article: crumb, title, role, body, series links, feedback and the way out. */
export function ArticlePage() {
  const { group, article } = useParams()
  const slug = `${group}/${article}`
  const page = pageBySlug(slug)
  const body = useHelpPage(slug)

  useEffect(() => {
    if (page) document.title = `${page.title} | CarbonOS help`
  }, [page])

  if (!page) return <HelpNotFound />
  const rail = page.headings.filter((h) => h.level === 2)
  const reviewed = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(page.lastReviewed))
  return (
    <div className={`help-page help-article ${rail.length > 1 ? 'has-rail' : ''}`}>
      <div className="help-article-main">
        <HelpBreadcrumb crumbs={breadcrumbsFor(slug)} />
        <h1 className="help-h1">
          {page.step ? <span className="help-step-number">Step {page.step}</span> : null}
          {page.title}
        </h1>
        {(page.role || page.minutes) && (
          <p className="help-meta">
            {page.role && <RolePill role={page.role} />}
            {page.minutes && <span className="help-minutes">About {page.minutes} minutes</span>}
          </p>
        )}
        {rail.length > 1 && (
          <details className="help-onthispage-inline xl:hidden">
            <summary>On this page</summary>
            <OnThisPage headings={page.headings} ready={!!body.data} plain />
          </details>
        )}
        {body.isPending && <HelpSkeleton />}
        {body.isError && (
          <p role="alert" className="help-error">
            This page could not be loaded. Reload to try again.
          </p>
        )}
        {body.data && <ArticleBody html={body.data} />}
        <SeriesNav slug={slug} />
        <FeedbackWidget key={slug} slug={slug} />
        <StillNeedHelp title={page.title} />
        <p className="help-reviewed">Last reviewed {reviewed}</p>
      </div>
      {rail.length > 1 && (
        <aside className="help-rail" aria-label="On this page">
          <OnThisPage headings={page.headings} ready={!!body.data} />
        </aside>
      )}
    </div>
  )
}
