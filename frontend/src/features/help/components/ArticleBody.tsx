import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * The article's HTML. It is the compiler's sanitised output of a Markdown
 * file in the repository, never anything a user typed, which is why it can
 * be set as innerHTML. Clicks on links into the help go through the router.
 */
export function ArticleBody({ html }: { html: string }) {
  const ref = useRef<HTMLElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return
      const anchor = (event.target as HTMLElement).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href') ?? ''
      if (href.startsWith('/help')) {
        event.preventDefault()
        navigate(href)
      }
    }
    root.addEventListener('click', onClick)
    return () => root.removeEventListener('click', onClick)
  }, [navigate])

  // land on the section the link or the search result pointed at
  useEffect(() => {
    if (!location.hash) return
    const id = decodeURIComponent(location.hash.slice(1))
    const target = document.getElementById(id)
    target?.scrollIntoView({ block: 'start' })
  }, [location.hash, html])

  return <article ref={ref} className="help-prose" dangerouslySetInnerHTML={{ __html: html }} />
}
