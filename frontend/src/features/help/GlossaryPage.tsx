import { useEffect } from 'react'
import { ArticleBody } from './components/ArticleBody'
import { FeedbackWidget } from './components/FeedbackWidget'
import { HelpSkeleton } from './components/HelpSkeleton'
import { StillNeedHelp } from './components/StillNeedHelp'
import { HelpBreadcrumb } from './HelpBreadcrumb'
import { HelpNotFound } from './HelpNotFound'
import { pageBySlug } from './manifest'
import { useHelpPage } from './pages'

export function GlossaryPage() {
  const page = pageBySlug('glossary')
  const body = useHelpPage('glossary')
  useEffect(() => {
    document.title = 'Glossary | CarbonOS help'
  }, [])
  if (!page) return <HelpNotFound />
  const letters = [...new Set(page.headings.map((h) => h.text[0]?.toUpperCase()).filter(Boolean))]
  return (
    <div className="help-page help-article">
      <div className="help-article-main">
        <HelpBreadcrumb
          crumbs={[
            { to: '/help', label: 'Help' },
            { to: '/help/glossary', label: 'Glossary' },
          ]}
        />
        <h1 className="help-h1">Glossary</h1>
        {letters.length > 3 && (
          <nav aria-label="Jump to a letter" className="help-letters">
            {letters.map((letter) => {
              const first = page.headings.find((h) => h.text[0]?.toUpperCase() === letter)
              return (
                <a key={letter} href={`#${first?.id}`}>
                  {letter}
                </a>
              )
            })}
          </nav>
        )}
        {body.isPending && <HelpSkeleton />}
        {body.data && <ArticleBody html={body.data} />}
        <FeedbackWidget slug="glossary" />
        <StillNeedHelp title="Glossary" />
      </div>
    </div>
  )
}
