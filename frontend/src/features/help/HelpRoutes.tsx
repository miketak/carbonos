import { Route, Routes } from 'react-router-dom'
import { ArticlePage } from './ArticlePage'
import { GlossaryPage } from './GlossaryPage'
import { HelpNotFound } from './HelpNotFound'
import { HelpShell } from './HelpShell'
import { HubPage } from './HubPage'
import { SearchPage } from './SearchPage'
import { TopicPage } from './TopicPage'

/** The help centre's own router, mounted lazily under /help/* (spec 09, ADR 0006). */
export default function HelpRoutes() {
  return (
    <Routes>
      <Route element={<HelpShell />}>
        <Route index element={<HubPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="glossary" element={<GlossaryPage />} />
        <Route path=":group" element={<TopicPage />} />
        <Route path=":group/:article" element={<ArticlePage />} />
        <Route path="*" element={<HelpNotFound />} />
      </Route>
    </Routes>
  )
}
