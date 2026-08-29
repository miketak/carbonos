import { screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { ApiError } from '../../lib/api'
import { renderWithProviders } from '../../test/utils'
import { RequireAuth } from './RequireAuth'
import type { SessionUser } from './api'

vi.mock('./api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
}))

import { me } from './api'

const user = (role: SessionUser['role']): SessionUser => ({
  id: 'u1',
  email: 'someone@ecoriv.com',
  displayName: 'Someone',
  role,
  status: 'ACTIVE',
  createdAt: '2026-08-28T00:00:00Z',
})

beforeEach(() => {
  vi.mocked(me).mockReset()
})

test('redirects to /login when there is no session', async () => {
  vi.mocked(me).mockRejectedValue(new ApiError(401))
  renderWithProviders(
    <RequireAuth>
      <p>secret</p>
    </RequireAuth>,
    { route: '/admin/users', extraRoutes: [{ path: '/login', element: <p>login page</p> }] },
  )

  await waitFor(() => expect(screen.getByText('login page')).toBeInTheDocument())
  expect(screen.queryByText('secret')).not.toBeInTheDocument()
})

test('shows access denied for a MEMBER on an ADMIN route', async () => {
  vi.mocked(me).mockResolvedValue(user('MEMBER'))
  renderWithProviders(
    <RequireAuth role="ADMIN">
      <p>secret</p>
    </RequireAuth>,
  )

  expect(await screen.findByRole('heading', { name: /access denied/i })).toBeInTheDocument()
  expect(screen.queryByText('secret')).not.toBeInTheDocument()
})

test('renders children for an ADMIN', async () => {
  vi.mocked(me).mockResolvedValue(user('ADMIN'))
  renderWithProviders(
    <RequireAuth role="ADMIN">
      <p>secret</p>
    </RequireAuth>,
  )

  expect(await screen.findByText('secret')).toBeInTheDocument()
})
