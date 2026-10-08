import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ApiError } from '../../lib/api'
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
    dateFormat: null,
  })
  vi.mocked(getProfile).mockReset().mockResolvedValue({
    id: 'u1',
    email: 'ama@ecoriv.test',
    displayName: 'Ama Mensah',
    hasAvatar: false,
    dateFormat: null,
  })
  vi.mocked(listOrganizations).mockReset().mockResolvedValue([organization])
  vi.mocked(listFactorPackNotices).mockReset().mockResolvedValue([])
  vi.mocked(getOrganization).mockReset().mockResolvedValue(organization)
})

/**
 * The layout is mounted as the real nested route it is, so `NavLink` resolves
 * its relative targets and marks the active one the way it does in the app.
 */
function renderAt(route: string | { pathname: string; state?: unknown }) {
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
              <Route path="settings/baseline" element={<p>baseline</p>} />
              <Route path="base-year" element={<Navigate to="../settings/baseline" replace />} />
            </Route>
            <Route path="/app" element={<p>the landing resolver</p>} />
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

const allSections = [
  'Overview',
  'Legal entities',
  'Facilities',
  'Activity data',
  'Inventories',
  'Emission factors',
  'Updates',
  'Units',
  'Settings',
]

test('an owner is offered Settings, last in the sidebar, and no Base year entry (spec 01.7)', async () => {
  renderAt('/app/ghg/org-1')

  await screen.findByRole('link', { name: 'Settings' })
  expect(await navLabels()).toEqual(allSections)
})

// Settings holds Baseline and targets, which every member uses; only its
// Organization tab is the owner's
test.each([['PREPARER'], ['REVIEWER'], ['VERIFIER'], ['ADMIN']])(
  'a %s is offered Settings too (spec 01.7)',
  async (role) => {
    vi.mocked(getOrganization).mockResolvedValue({ ...organization, myRole: role as MyRole })
    renderAt('/app/ghg/org-1')

    await waitFor(() => expect(vi.mocked(getOrganization)).toHaveBeenCalled())
    expect(await navLabels()).toEqual(allSections)
  },
)

test('the old base-year address lands on Baseline and targets under Settings', async () => {
  renderAt('/app/ghg/org-1/base-year')

  expect(await screen.findByText('baseline')).toBeInTheDocument()
  expect(await screen.findByRole('link', { name: 'Settings' })).toHaveAttribute(
    'aria-current',
    'page',
  )
})

test('Settings is the active entry when it is open', async () => {
  renderAt('/app/ghg/org-1/settings')

  expect(await screen.findByRole('link', { name: 'Settings' })).toHaveAttribute(
    'aria-current',
    'page',
  )
})

test('an owner reads their own role in the sidebar (spec 01.4)', async () => {
  renderAt('/app/ghg/org-1')

  expect(await screen.findByText('Your role: Owner')).toBeInTheDocument()
})

test.each([
  ['PREPARER', 'Your role: Preparer'],
  ['REVIEWER', 'Your role: Reviewer'],
  ['VERIFIER', 'Your role: Verifier'],
])('a %s reads their own role in the sidebar (spec 01.4)', async (role, line) => {
  vi.mocked(getOrganization).mockResolvedValue({ ...organization, myRole: role as MyRole })
  renderAt('/app/ghg/org-1')

  expect(await screen.findByText(line)).toBeInTheDocument()
})

test('a support grant is named as one in the sidebar, not as a role (spec 01.3)', async () => {
  vi.mocked(getOrganization).mockResolvedValue({ ...organization, myRole: 'ADMIN' })
  renderAt('/app/ghg/org-1')

  expect(await screen.findByText('Support access')).toBeInTheDocument()
  expect(screen.queryByText(/Your role:/)).toBeNull()
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

// spec 01.6: the deep link the sign-in page follows wins only when it opens
test('an organization the sign-in deep link cannot open falls back to the resolver', async () => {
  vi.mocked(getOrganization).mockRejectedValue(new ApiError(404))
  renderAt({ pathname: '/app/ghg/org-gone/settings', state: { fromSignIn: true } })

  await waitFor(() => expect(screen.getByText('the landing resolver')).toBeInTheDocument())
  expect(screen.queryByRole('heading', { name: 'Organization not found' })).not.toBeInTheDocument()
})

test('an organization that stops answering mid-session keeps its explanation and a way out', async () => {
  vi.mocked(getOrganization).mockRejectedValue(new ApiError(404))
  renderAt('/app/ghg/org-gone/settings')

  await screen.findByRole('heading', { name: 'Organization not found' })
  expect(screen.getByText(/head back to the list to pick another/i)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Back to the organizations list' })).toHaveAttribute(
    'href',
    '/app/ghg',
  )
  expect(screen.queryByText('the landing resolver')).not.toBeInTheDocument()
})
