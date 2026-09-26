import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, test, vi } from 'vitest'
import { ToastProvider } from '../../components/toast'
import { OrganizationLayout } from './OrganizationLayout'
import type { MyRole } from './roles'

vi.mock('./api', () => import('./testApiMock'))
vi.mock('../auth/api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
}))
// the shared header carries the account menu, which reads the profile (spec 01.6)
vi.mock('../profile/api', () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  uploadAvatar: vi.fn(),
  fetchAvatar: vi.fn(),
}))

import { getOrganization, listFactorPackNotices, listOrganizations } from './api'
import { me } from '../auth/api'
import { getProfile } from '../profile/api'

const organization = {
  id: 'org-1',
  name: 'Ecoriv Holdings',
  accountNo: 1,
  myRole: 'OWNER' as MyRole,
  address: null,
  contact: null,
  facilityCount: 1,
  supportAccess: [],
  createdAt: '2026-08-01T00:00:00Z',
}

beforeEach(() => {
  localStorage.clear()
  vi.mocked(me).mockResolvedValue({
    id: 'u1',
    email: 'ama@ecoriv.test',
    displayName: 'Ama Mensah',
    role: 'MEMBER',
    status: 'ACTIVE',
    createdAt: '2026-08-28T00:00:00Z',
  })
  vi.mocked(getProfile).mockReset().mockResolvedValue({
    id: 'u1',
    email: 'ama@ecoriv.test',
    displayName: 'Ama Mensah',
    hasAvatar: false,
  })
  vi.mocked(listOrganizations).mockReset().mockResolvedValue([organization])
  vi.mocked(listFactorPackNotices).mockReset().mockResolvedValue([])
  vi.mocked(getOrganization).mockReset().mockResolvedValue(organization)
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
            <Route path="/app/ghg/:organizationId" element={<OrganizationLayout />}>
              <Route index element={<p>overview</p>} />
              <Route path="units" element={<p>units</p>} />
              <Route path="settings" element={<p>settings</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

async function navLabels() {
  const nav = await screen.findByRole('navigation', { name: /organization sections/i })
  return within(nav)
    .getAllByRole('link')
    .map((link) => link.textContent?.trim())
}

test('an owner is offered Settings, last in the sidebar (spec 01.7)', async () => {
  renderAt('/app/ghg/org-1')

  // the entry waits on the organization, because the role is what decides it
  await screen.findByRole('link', { name: 'Settings' })
  expect(await navLabels()).toEqual([
    'Overview',
    'Legal entities',
    'Facilities',
    'Activity data',
    'Inventories',
    'Base year',
    'Emission factors',
    'Updates',
    'Units',
    'Settings',
  ])
})

test.each([['PREPARER'], ['REVIEWER'], ['VERIFIER']])(
  'a %s has no Settings entry (spec 01.7)',
  async (role) => {
    vi.mocked(getOrganization).mockResolvedValue({ ...organization, myRole: role as MyRole })
    renderAt('/app/ghg/org-1')

    // wait for the organization before concluding the entry is absent, or this
    // would pass on any role simply by reading the nav too early
    await waitFor(() => expect(vi.mocked(getOrganization)).toHaveBeenCalled())
    const labels = await navLabels()
    expect(labels).not.toContain('Settings')
    expect(labels).toContain('Units')
  },
)

test('support access does not carry Settings either (specs 01.3, 01.7)', async () => {
  vi.mocked(getOrganization).mockResolvedValue({ ...organization, myRole: 'ADMIN' })
  renderAt('/app/ghg/org-1')

  await waitFor(() => expect(vi.mocked(getOrganization)).toHaveBeenCalled())
  expect(await navLabels()).not.toContain('Settings')
})

/**
 * The active pill is positioned by counting rows and dividers in the sections
 * actually rendered. Hiding Settings must not move it, which it would if the
 * arithmetic still ran over the full list.
 */
test('the active entry is still marked when Settings is hidden', async () => {
  vi.mocked(getOrganization).mockResolvedValue({ ...organization, myRole: 'PREPARER' })
  renderAt('/app/ghg/org-1/units')

  const nav = await screen.findByRole('navigation', { name: /organization sections/i })
  const units = within(nav).getByRole('link', { name: 'Units' })
  expect(units).toHaveAttribute('aria-current', 'page')
})

test('Settings is the active entry when it is open', async () => {
  renderAt('/app/ghg/org-1/settings')

  expect(await screen.findByRole('link', { name: 'Settings' })).toHaveAttribute(
    'aria-current',
    'page',
  )
})

test('two organizations of one name are told apart in the switcher (spec 01.8)', async () => {
  const twin = { ...organization, id: 'org-2', accountNo: 2 }
  vi.mocked(listOrganizations).mockResolvedValue([organization, twin])
  renderAt('/app/ghg/org-1')

  const switcher = await screen.findByRole('combobox', { name: 'Organization' })
  await waitFor(() => expect(within(switcher).getAllByRole('option')).toHaveLength(2))
  expect(
    within(switcher)
      .getAllByRole('option')
      .map((option) => option.textContent),
  ).toEqual(['Ecoriv Holdings (ORG-0001)', 'Ecoriv Holdings (ORG-0002)'])
})
