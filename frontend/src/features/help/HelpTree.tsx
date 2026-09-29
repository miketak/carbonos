import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { manifest } from './manifest'

const TREE_FOLD = 6

/**
 * The left tree: every group by title, the current group open, and the
 * rest folded to their titles. Inside a group the first six articles show
 * and the rest wait behind "Show more"; a series numbers its steps.
 */
export function HelpTree({ onNavigate }: { onNavigate?: () => void } = {}) {
  const { group: currentGroup, article } = useParams()
  const onGlossary = useLocation().pathname === '/help/glossary'
  const currentSlug = article ? `${currentGroup}/${article}` : undefined
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  return (
    <ul className="help-tree">
      {manifest.groups.map((group) => {
        const isOpen = open[group.slug] ?? group.slug === currentGroup
        const fold = group.showMoreAfter ?? TREE_FOLD
        const currentIndex = currentSlug ? group.articles.indexOf(currentSlug) : -1
        const shown =
          expanded[group.slug] || currentIndex >= fold
            ? group.articles
            : group.articles.slice(0, fold)
        const hidden = group.articles.length - shown.length
        return (
          <li key={group.slug} className="help-tree-group">
            <div className={`help-tree-title ${isOpen ? 'is-open' : ''}`}>
              <button
                type="button"
                className="help-tree-toggle"
                aria-expanded={isOpen}
                aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${group.title}`}
                onClick={() => setOpen((o) => ({ ...o, [group.slug]: !isOpen }))}
              >
                <span className="help-tree-chevron" aria-hidden />
              </button>
              <Link
                to={`/help/${group.slug}`}
                className="help-tree-title-link"
                onClick={onNavigate}
              >
                {group.title}
              </Link>
            </div>
            {isOpen && (
              <ul className="help-tree-list">
                {shown.map((slug) => {
                  const page = manifest.pages[slug]
                  if (!page) return null
                  return (
                    <li key={slug}>
                      <Link
                        to={`/help/${slug}`}
                        aria-current={slug === currentSlug ? 'page' : undefined}
                        className="help-tree-link"
                        onClick={onNavigate}
                      >
                        {group.series && page.step ? (
                          <span className="help-tree-step">{page.step}</span>
                        ) : null}
                        {page.title}
                      </Link>
                    </li>
                  )
                })}
                {hidden > 0 && (
                  <li>
                    <button
                      type="button"
                      className="help-tree-more"
                      onClick={() => setExpanded((e) => ({ ...e, [group.slug]: true }))}
                    >
                      Show more ({hidden})
                    </button>
                  </li>
                )}
              </ul>
            )}
          </li>
        )
      })}
      <li className="help-tree-group">
        <Link
          to="/help/glossary"
          className="help-tree-glossary"
          onClick={onNavigate}
          aria-current={onGlossary ? 'page' : undefined}
        >
          Glossary
        </Link>
      </li>
    </ul>
  )
}
