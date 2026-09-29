import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { HelpTreeDrawer } from './components/HelpTreeDrawer'
import { HelpHeader } from './HelpHeader'
import { HelpTree } from './HelpTree'

/**
 * The frame every help page sits in: the header with search, the tree of
 * groups on the left (a drawer on a phone), and the page. The page decides
 * whether it has an "On this page" rail.
 */
export function HelpShell() {
  const [treeOpen, setTreeOpen] = useState(false)
  const closeTree = useCallback(() => setTreeOpen(false), [])
  const { pathname, hash } = useLocation()

  // a new page starts at its top; a hash means the body scrolls to its section instead
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0 })
  }, [pathname, hash])

  return (
    <div className="help">
      <a href="#help-main" className="landing-skip">
        Skip to content
      </a>
      <HelpHeader onBrowse={() => setTreeOpen(true)} />
      <div className="help-frame">
        <nav aria-label="Help topics" className="help-tree-column">
          <HelpTree />
        </nav>
        <main id="help-main" className="help-main">
          <Outlet />
        </main>
      </div>
      {treeOpen && (
        <HelpTreeDrawer onClose={closeTree}>
          <HelpTree onNavigate={closeTree} />
        </HelpTreeDrawer>
      )}
    </div>
  )
}
