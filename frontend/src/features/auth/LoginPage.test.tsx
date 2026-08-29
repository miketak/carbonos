import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { ApiError } from '../../lib/api'
import { renderWithProviders } from '../../test/utils'
import { LoginPage } from './LoginPage'
import type { SessionUser } from './api'

vi.mock('./api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
}))

import { login } from './api'

const admin: SessionUser = {
  id: 'u1',
  email: 'admin@ecoriv.com',
  displayName: 'Ama Admin',
  role: 'ADMIN',
  status: 'ACTIVE',
  createdAt: '2026-08-28T00:00:00Z',
}

beforeEach(() => {
  vi.mocked(login).mockReset()
})

test('submits credentials and navigates on success', async () => {
  const user = userEvent.setup({ delay: null })
  vi.mocked(login).mockResolvedValue(admin)
  renderWithProviders(<LoginPage />, {
    route: '/login',
    extraRoutes: [{ path: '/app', element: <p>welcome home</p> }],
  })

  await user.type(screen.getByLabelText(/email/i), 'admin@ecoriv.com')
  await user.type(screen.getByLabelText(/password/i), 'correct-horse')
  await user.click(screen.getByRole('button', { name: /sign in/i }))

  await waitFor(() => expect(screen.getByText('welcome home')).toBeInTheDocument())
  expect(login).toHaveBeenCalledWith('admin@ecoriv.com', 'correct-horse')
})

test('shows an invalid-credentials message on 401', async () => {
  const user = userEvent.setup({ delay: null })
  vi.mocked(login).mockRejectedValue(new ApiError(401))
  renderWithProviders(<LoginPage />, { route: '/login' })

  await user.type(screen.getByLabelText(/email/i), 'admin@ecoriv.com')
  await user.type(screen.getByLabelText(/password/i), 'wrong')
  await user.click(screen.getByRole('button', { name: /sign in/i }))

  expect(await screen.findByRole('alert')).toHaveTextContent(/invalid email or password/i)
})
