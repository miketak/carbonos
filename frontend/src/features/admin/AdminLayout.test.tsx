import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, test, vi } from 'vitest'
import { ToastProvider } from '../../components/toast'
import { AdminLayout } from './AdminLayout'

vi.mock('./api', () => ({
  getAccountsSummary: vi.fn(),
  getPlatformSummary: vi.fn(),
}))
vi.mock('../auth/api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
}))

import { getAccountsSummary, getPlatformSummary } from './api'
import { me } from '../auth/api'

const accounts = {
  usersTotal: 4,
  usersActive: 3,
  usersPending: 1,
  administrators: 2,
  accessRequestsPending: 0,
}

const platform = {
  organizations: 2,
  packFamilies: 1,
  publishedEditions: 3,
  draftEditionCount: 0,
  withdrawnEditions: 0,
  openNotices: 0,
  draftEditions: [],
  grants: [],
  recentActivity: [],
}

beforeEach(() => {
  localStorage.clear()
  vi.mocked(me).mockResolvedValue({
    id: 'u1',
    email: 'admin@ecoriv.com',
    displayName: 'Ama Admin',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-08-28T00:00:00Z',
  })
  vi.mocked(getAccountsSummary).mockReset().mockResolvedValue(accounts)
  vi.mocked(getPlatformSummary).mockReset().mockResolvedValue(platform)
})

/**
 * The layout is mounted as the real nested route it is, so `NavLink` resolves
 * its relative targets and marks the active one the way it does in the app.
 */
function renderAt(route: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<p>dashboard</p>} />
              <Route path="factor-packs" element={<p>packs</p>} />
              <Route path="factor-packs/:editionId" element={<p>edition</p>} />
              <Route path="settings" element={<p>settings</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

test('the sidebar lists every administration section in order', async () => {
  renderAt('/admin')

  const nav = await screen.findByRole('navigation', { name: /administration sections/i })
  const labels = within(nav)
    .getAllByRole('link')
    .map((link) => link.textContent?.trim())
  expect(labels).toEqual([
    'Dashboard',
    'Access requests',
    'Users',
    'Organizations',
    'Factor packs',
    'Platform settings',
  ])
})

test('the badge counts the requests still waiting, and is absent at zero', async () => {
  vi.mocked(getAccountsSummary).mockResolvedValue({ ...accounts, accessRequestsPending: 3 })
  renderAt('/admin')

  // the count arrives with the summary, so wait for the badge itself
  const badge = await screen.findByTitle(/3 access requests waiting/i)
  expect(badge).toHaveTextContent('3')
  const requests = screen.getByRole('link', { name: /access requests/i })
  expect(within(requests).getByTitle(/3 access requests waiting/i)).toBeInTheDocument()
})

test('no badge when nothing is waiting', async () => {
  renderAt('/admin')

  await screen.findByRole('link', { name: /dashboard/i })
  expect(screen.queryByTitle(/access requests? waiting/i)).not.toBeInTheDocument()
})

test('an edition URL keeps the active entry on Factor packs', async () => {
  renderAt('/admin/factor-packs/defra-2026')

  const packs = await screen.findByRole('link', { name: /factor packs/i })
  expect(packs).toHaveAttribute('aria-current', 'page')
})

test('collapsing the sidebar is remembered', async () => {
  const user = userEvent.setup()
  renderAt('/admin')

  await user.click(await screen.findByTitle(/collapse sidebar/i))
  expect(localStorage.getItem('admin.sidebar')).toBe('collapsed')
  expect(await screen.findByTitle(/expand sidebar/i)).toBeInTheDocument()
})
