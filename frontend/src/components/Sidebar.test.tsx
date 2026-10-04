import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, test, vi } from 'vitest'
import { RailLink, Sidebar, railIcons } from './Sidebar'

vi.mock('./AccountMenu', () => ({
  AccountMenu: ({ roleLine }: { roleLine?: string }) => <p>{roleLine ?? 'account'}</p>,
}))

/**
 * The rail is mounted as the parent of its sections, the way the layouts
 * mount it, so the relative links resolve and mark the active one as in the
 * app.
 */
function renderRail(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route
          path="/app/ghg/:organizationId"
          element={
            <Sidebar
              navLabel="Organization sections"
              sections={[
                { to: '.', label: 'Overview', end: true, num: '—' },
                { to: 'entities', label: 'Legal entities', num: '01', ruleBefore: true },
                { to: 'factors', label: 'Emission factors', ruleBefore: true },
                {
                  to: 'factor-updates',
                  label: 'Updates',
                  badge: { count: 2, title: '2 factor pack updates waiting', srLabel: 'updates' },
                },
              ]}
              tail={[{ to: 'settings', label: 'Settings', ruleBefore: true }]}
              workspaceLabel="Workspace"
              workspace={<p>Gye Nyame Gold</p>}
              foot={
                <RailLink to="/help" external icon={railIcons.help}>
                  Help
                </RailLink>
              }
              roleLine="Your role: Owner"
            />
          }
        >
          <Route index element={null} />
          <Route path="entities" element={null} />
          <Route path="factors" element={null} />
          <Route path="factor-updates" element={null} />
          <Route path="settings" element={null} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

test('the rail numbers the workflow as decoration, leaves the reference sections bare, and marks the open one', () => {
  renderRail('/app/ghg/org-1/entities')
  const nav = screen.getByRole('navigation', { name: 'Organization sections' })
  const links = within(nav).getAllByRole('link')
  // a reader and a test get the labels alone; the numbers live on data-num
  expect(links.map((link) => link.textContent?.trim())).toEqual([
    'Overview',
    'Legal entities',
    'Emission factors',
    'Updates2 updates',
    'Settings',
  ])
  expect(links[0]).toHaveAttribute('data-num', '—')
  expect(links[1]).toHaveAttribute('data-num', '01')
  expect(links[2]).not.toHaveAttribute('data-num')
  expect(within(nav).getByRole('link', { name: /legal entities/i })).toHaveAttribute(
    'aria-current',
    'page',
  )
  expect(within(nav).getByRole('link', { name: /overview/i })).not.toHaveAttribute('aria-current')
  expect(screen.getByTitle('2 factor pack updates waiting')).toHaveTextContent('2')
})

test('the rail carries the workspace, the links out, and the role line', () => {
  renderRail('/app/ghg/org-1')
  expect(screen.getByText('Workspace')).toBeInTheDocument()
  expect(screen.getByText('Gye Nyame Gold')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Help' })).toHaveAttribute('target', '_blank')
  expect(screen.getByText('Your role: Owner')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'CarbonOS home' })).toHaveAttribute('href', '/app')
})
