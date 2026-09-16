import { screen, within } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { AdminDashboardPage } from './AdminDashboardPage'
import type { AccountsSummary, PlatformSummary } from './api'

vi.mock('./api', () => ({
  getAccountsSummary: vi.fn(),
  getPlatformSummary: vi.fn(),
  getPlatformSettings: vi.fn(),
}))
vi.mock('../auth/api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
}))

import { getAccountsSummary, getPlatformSettings, getPlatformSummary } from './api'

const accounts: AccountsSummary = {
  usersTotal: 12,
  usersActive: 10,
  usersPending: 2,
  administrators: 2,
  accessRequestsPending: 0,
}

const platform: PlatformSummary = {
  organizations: 4,
  packFamilies: 3,
  publishedEditions: 9,
  draftEditionCount: 0,
  withdrawnEditions: 1,
  openNotices: 0,
  draftEditions: [],
  grants: [],
  recentActivity: [],
}

beforeEach(() => {
  vi.mocked(getAccountsSummary).mockReset().mockResolvedValue(accounts)
  vi.mocked(getPlatformSummary).mockReset().mockResolvedValue(platform)
  vi.mocked(getPlatformSettings).mockReset().mockResolvedValue({
    supportAccessWindowHours: 24,
    organizationCreation: 'EVERYONE',
    updatedAt: '2026-09-14T00:00:00Z',
    updatedBy: null,
  })
})

function renderPage() {
  return renderWithProviders(<AdminDashboardPage />, { route: '/admin' })
}

test('a skeleton names what it is loading', () => {
  vi.mocked(getAccountsSummary).mockReturnValue(new Promise(() => {}))
  renderPage()

  expect(screen.getByLabelText(/loading the platform summary/i)).toBeInTheDocument()
})

test('with nothing outstanding the queue says so', async () => {
  renderPage()

  expect(await screen.findByText(/nothing is waiting on you/i)).toBeInTheDocument()
})

test('each queue row links to the page that clears it', async () => {
  vi.mocked(getAccountsSummary).mockResolvedValue({ ...accounts, accessRequestsPending: 3 })
  vi.mocked(getPlatformSummary).mockResolvedValue({
    ...platform,
    draftEditionCount: 2,
    draftEditions: [
      {
        editionId: 'defra-2027',
        packKey: 'defra',
        name: 'DEFRA 2027',
        curatorEmail: 'ama@ecoriv.com',
        rowCount: 10,
        mayApprove: false,
      },
      {
        editionId: 'ghana-2027',
        packKey: 'ghana',
        name: 'Ghana 2027',
        curatorEmail: 'kofi@ecoriv.com',
        rowCount: 8,
        mayApprove: true,
      },
    ],
  })
  renderPage()

  const requests = await screen.findByRole('link', { name: /3 access requests waiting/i })
  expect(requests).toHaveAttribute('href', '/admin/access-requests')

  const drafts = screen.getByRole('link', { name: /2 draft factor pack editions unpublished/i })
  expect(drafts).toHaveAttribute('href', '/admin/factor-packs')
  // spec 02.5: an approver may not be the curator, so the row says how many are actually yours
  expect(drafts).toHaveTextContent(/you may approve 1 of them/i)
})

test('a lone administrator is told, because publishing needs a second pair of hands', async () => {
  vi.mocked(getAccountsSummary).mockResolvedValue({ ...accounts, administrators: 1 })
  renderPage()

  expect(await screen.findByText(/only active administrator/i)).toBeInTheDocument()
})

test('the support access register lists live and recently closed grants with their reason', async () => {
  vi.mocked(getPlatformSummary).mockResolvedValue({
    ...platform,
    grants: [
      {
        organizationId: 'org-1',
        organizationName: 'Sankofa Gold plc',
        adminEmail: 'ama@ecoriv.com',
        reason: 'ticket 4512, preparer cannot open the run',
        grantedAt: '2026-09-14T09:00:00Z',
        expiresAt: '2026-09-15T09:00:00Z',
        endedAt: null,
        mine: true,
      },
    ],
  })
  renderPage()

  expect(await screen.findByText(/sankofa gold plc/i)).toBeInTheDocument()
  expect(screen.getByText(/ticket 4512/i)).toBeInTheDocument()
  expect(
    screen.getByRole('link', { name: /you hold support access to 1 organization/i }),
  ).toHaveAttribute('href', '/admin/organizations')
})

test('open adoption notices are a bare total, never a named organization', async () => {
  vi.mocked(getPlatformSummary).mockResolvedValue({ ...platform, openNotices: 5 })
  renderPage()

  // spec 01.5: a notice states a movement computed from the tenant's own activity
  // data, so the panel counts them and never says whose they are
  const tile = (await screen.findByText(/open adoption notices/i)).closest('a, div') as HTMLElement
  expect(within(tile).getByText('5')).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /adoption notice/i })).not.toBeInTheDocument()
})

test('the policy in force is printed with a way to change it', async () => {
  vi.mocked(getPlatformSettings).mockResolvedValue({
    supportAccessWindowHours: 2,
    organizationCreation: 'ADMINISTRATORS',
    updatedAt: '2026-09-14T00:00:00Z',
    updatedBy: 'ama@ecoriv.com',
  })
  renderPage()

  expect(await screen.findByText(/2 hours/i)).toBeInTheDocument()
  expect(screen.getByText(/only administrators/i)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /platform settings/i })).toHaveAttribute(
    'href',
    '/admin/settings',
  )
})
