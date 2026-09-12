import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { AdminOrganizationsPage } from './AdminOrganizationsPage'
import type { AdminOrganization } from './api'

vi.mock('./api', () => ({
  listUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  listAccessRequests: vi.fn(),
  approveAccessRequest: vi.fn(),
  denyAccessRequest: vi.fn(),
  listAdminOrganizations: vi.fn(),
  assumeSupportAccess: vi.fn(),
  endSupportAccess: vi.fn(),
}))
vi.mock('../auth/api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
}))

import { assumeSupportAccess, endSupportAccess, listAdminOrganizations } from './api'

const organization: AdminOrganization = {
  id: 'org-1',
  name: 'Sankofa Gold plc',
  ownerEmails: ['kojo@sankofa.test'],
  memberCount: 3,
  supportAccess: null,
}

beforeEach(() => {
  vi.mocked(listAdminOrganizations).mockReset().mockResolvedValue([organization])
  vi.mocked(assumeSupportAccess).mockReset()
  vi.mocked(endSupportAccess).mockReset()
})

function renderPage() {
  return renderWithProviders(<AdminOrganizationsPage />, { route: '/admin/organizations' })
}

test('the support list names the owners and the member count, and no inventory data', async () => {
  renderPage()

  const row = (await screen.findByText('Sankofa Gold plc')).closest('tr') as HTMLElement
  expect(within(row).getByText('kojo@sankofa.test')).toBeInTheDocument()
  expect(within(row).getByText('3')).toBeInTheDocument()
  expect(within(row).getByText('None')).toBeInTheDocument()
  expect(screen.queryByText(/facilit/i)).not.toBeInTheDocument()
  expect(screen.queryByText(/t CO₂e/)).not.toBeInTheDocument()
})

test('access is assumed with a reason of at least ten characters (spec 01.3)', async () => {
  const user = userEvent.setup()
  vi.mocked(assumeSupportAccess).mockResolvedValue({
    adminEmail: 'support@ecoriv.com',
    grantedAt: '2026-09-12T09:14:00Z',
    expiresAt: '2026-09-13T09:14:00Z',
    reason: 'ticket 4512, preparer cannot open the run',
  })
  renderPage()

  await user.click(await screen.findByRole('button', { name: /assume access/i }))
  const dialog = await screen.findByRole('dialog', { name: /assume access to sankofa gold plc/i })
  expect(within(dialog).getByRole('button', { name: /assume access/i })).toBeDisabled()
  await user.type(
    within(dialog).getByLabelText(/reason/i),
    'ticket 4512, preparer cannot open the run',
  )
  await user.click(within(dialog).getByRole('button', { name: /assume access/i }))

  await waitFor(() =>
    expect(assumeSupportAccess).toHaveBeenCalledWith(
      'org-1',
      'ticket 4512, preparer cannot open the run',
    ),
  )
  expect(await screen.findByText(/support access to sankofa gold plc assumed/i)).toBeInTheDocument()
})

test('an active grant shows its expiry and can be ended', async () => {
  const user = userEvent.setup()
  vi.mocked(listAdminOrganizations).mockResolvedValue([
    {
      ...organization,
      supportAccess: {
        adminEmail: 'support@ecoriv.com',
        grantedAt: '2026-09-12T09:14:00Z',
        expiresAt: '2026-09-13T09:14:00Z',
        reason: 'ticket 4512, preparer cannot open the run',
      },
    },
  ])
  vi.mocked(endSupportAccess).mockResolvedValue(undefined)
  renderPage()

  expect(await screen.findByText(/ticket 4512, preparer cannot open the run/)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /end support access to sankofa gold plc/i }))
  await waitFor(() => expect(endSupportAccess).toHaveBeenCalledWith('org-1'))
  expect(await screen.findByText(/support access to sankofa gold plc ended/i)).toBeInTheDocument()
})
