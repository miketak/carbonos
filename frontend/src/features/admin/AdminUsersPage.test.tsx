import { screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { AdminUsersPage } from './AdminUsersPage'
import type { User } from './api'

vi.mock('./api', () => ({
  listUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  listAccessRequests: vi.fn(),
  approveAccessRequest: vi.fn(),
  denyAccessRequest: vi.fn(),
  getAccountsSummary: vi.fn(),
  getPlatformSummary: vi.fn(),
}))
vi.mock('../auth/api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
}))

import { listAccessRequests, listUsers } from './api'

const user: User = {
  id: 'u1',
  email: 'kofi@ecoriv.com',
  displayName: 'Kofi Mensah',
  role: 'MEMBER',
  status: 'ACTIVE',
  createdAt: '2026-09-01T00:00:00Z',
}

beforeEach(() => {
  vi.mocked(listUsers).mockReset().mockResolvedValue([user])
  vi.mocked(listAccessRequests).mockReset().mockResolvedValue([])
})

test('the page is the users list', async () => {
  renderWithProviders(<AdminUsersPage />, { route: '/admin/users' })

  expect(await screen.findByRole('heading', { name: /^users$/i })).toBeInTheDocument()
  expect(await screen.findByText('Kofi Mensah')).toBeInTheDocument()
})

test('access requests are no longer buried on it', async () => {
  renderWithProviders(<AdminUsersPage />, { route: '/admin/users' })

  // spec 01.5: the queue has its own route and its own badge, so it is not a
  // section at the top of an unrelated list
  await screen.findByText('Kofi Mensah')
  expect(screen.queryByText(/waiting for a decision/i)).not.toBeInTheDocument()
  expect(listAccessRequests).not.toHaveBeenCalled()
})
