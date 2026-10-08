import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { ApiError } from '../../lib/api'
import { renderWithProviders } from '../../test/utils'
import { AdminUsersPage } from './AdminUsersPage'
import type { User } from './api'

vi.mock('./api', () => ({
  listUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  sendPasswordReset: vi.fn(),
  listAccessRequests: vi.fn(),
  approveAccessRequest: vi.fn(),
  denyAccessRequest: vi.fn(),
  getAccountsSummary: vi.fn(),
  getPlatformSummary: vi.fn(),
  getHelpSummary: vi.fn(),
}))
vi.mock('../auth/api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
}))

import { listAccessRequests, listUsers, sendPasswordReset } from './api'

const user: User = {
  id: 'u1',
  email: 'kofi@ecoriv.com',
  displayName: 'Kofi Mensah',
  role: 'MEMBER',
  status: 'ACTIVE',
  createdAt: '2026-09-01T00:00:00Z',
  dateFormat: null,
}

beforeEach(() => {
  vi.mocked(listUsers).mockReset().mockResolvedValue([user])
  vi.mocked(listAccessRequests).mockReset().mockResolvedValue([])
  vi.mocked(sendPasswordReset).mockReset()
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

test('an administrator sends a reset link after confirming (spec 01.9)', async () => {
  const actor = userEvent.setup({ delay: null })
  vi.mocked(sendPasswordReset).mockResolvedValue(undefined)
  renderWithProviders(<AdminUsersPage />, { route: '/admin/users' })

  await actor.click(await screen.findByRole('button', { name: 'Reset password' }))
  expect(
    screen.getByRole('heading', { name: 'Reset the password of Kofi Mensah?' }),
  ).toBeInTheDocument()
  expect(screen.getByText(/valid for 1 hour and works once/)).toBeInTheDocument()
  await actor.click(screen.getByRole('button', { name: 'Send reset link' }))

  expect(await screen.findByText('Reset link sent to kofi@ecoriv.com.')).toBeInTheDocument()
  expect(sendPasswordReset).toHaveBeenCalledWith('u1')
})

test('a refused reset shows the server sentence', async () => {
  const actor = userEvent.setup({ delay: null })
  vi.mocked(sendPasswordReset).mockRejectedValue(
    new ApiError(409, { detail: 'Enable the account before sending a password reset link.' }),
  )
  renderWithProviders(<AdminUsersPage />, { route: '/admin/users' })

  await actor.click(await screen.findByRole('button', { name: 'Reset password' }))
  await actor.click(screen.getByRole('button', { name: 'Send reset link' }))
  expect(
    await screen.findByText('Enable the account before sending a password reset link.'),
  ).toBeInTheDocument()
})

test('only an active account offers a reset', async () => {
  vi.mocked(listUsers).mockResolvedValue([
    { ...user, id: 'u2', displayName: 'Pending Person', status: 'PENDING' },
    { ...user, id: 'u3', displayName: 'Gone Away', status: 'DISABLED' },
  ])
  renderWithProviders(<AdminUsersPage />, { route: '/admin/users' })

  await screen.findByText('Pending Person')
  expect(screen.queryByRole('button', { name: 'Reset password' })).not.toBeInTheDocument()
})
