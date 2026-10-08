import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { useLocation } from 'react-router-dom'
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
  dateFormat: null,
}

beforeEach(() => {
  vi.mocked(login).mockReset()
})

test('signing in hands off to the landing resolver', async () => {
  const user = userEvent.setup({ delay: null })
  vi.mocked(login).mockResolvedValue(admin)
  renderWithProviders(<LoginPage />, {
    route: '/login',
    extraRoutes: [
      { path: '/app', element: <p>the landing resolver</p> },
      { path: '/admin', element: <p>platform overview</p> },
    ],
  })

  await user.type(screen.getByLabelText(/email/i), 'admin@ecoriv.com')
  await user.type(screen.getByLabelText(/password/i), 'correct-horse')
  await user.click(screen.getByRole('button', { name: /sign in/i }))

  // spec 01.6: the role rule lives in one place, so the form always goes to
  // "/app" and LandingRedirect decides. LandingRedirect.test.tsx covers the split.
  await waitFor(() => expect(screen.getByText('the landing resolver')).toBeInTheDocument())
  expect(screen.queryByText('platform overview')).not.toBeInTheDocument()
  expect(login).toHaveBeenCalledWith('admin@ecoriv.com', 'correct-horse')
})

test('a deep link returns the account to the page it asked for', async () => {
  const user = userEvent.setup({ delay: null })
  vi.mocked(login).mockResolvedValue(admin)
  renderWithProviders(<LoginPage />, {
    route: { pathname: '/login', state: { from: '/admin/users' } },
    extraRoutes: [
      { path: '/app', element: <p>the landing resolver</p> },
      { path: '/admin/users', element: <p>the users page</p> },
    ],
  })

  await user.type(screen.getByLabelText(/email/i), 'admin@ecoriv.com')
  await user.type(screen.getByLabelText(/password/i), 'correct-horse')
  await user.click(screen.getByRole('button', { name: /sign in/i }))

  await waitFor(() => expect(screen.getByText('the users page')).toBeInTheDocument())
  expect(screen.queryByText('the landing resolver')).not.toBeInTheDocument()
})

test('the page a deep link opens is told it came from the sign-in', async () => {
  const user = userEvent.setup({ delay: null })
  vi.mocked(login).mockResolvedValue(admin)
  renderWithProviders(<LoginPage />, {
    route: { pathname: '/login', state: { from: '/admin/users' } },
    extraRoutes: [
      { path: '/app', element: <p>the landing resolver</p> },
      { path: '/admin/users', element: <StateProbe /> },
    ],
  })

  await user.type(screen.getByLabelText(/email/i), 'admin@ecoriv.com')
  await user.type(screen.getByLabelText(/password/i), 'correct-horse')
  await user.click(screen.getByRole('button', { name: /sign in/i }))

  await waitFor(() => expect(screen.getByText('fromSignIn: true')).toBeInTheDocument())
})

/** Prints the router state the page arrived with. */
function StateProbe() {
  const state = useLocation().state as { fromSignIn?: boolean } | null
  return <p>fromSignIn: {String(state?.fromSignIn)}</p>
}

test('a sign-out clears the deep link so the next account lands on its own work', async () => {
  const user = userEvent.setup({ delay: null })
  vi.mocked(login).mockResolvedValue(admin)
  // RequireAuth writes `from` while the session empties; useLogout then
  // replaces the entry with `signedOut`, and the form must not follow `from`
  renderWithProviders(<LoginPage />, {
    route: { pathname: '/login', state: { from: '/admin/users', signedOut: true } },
    extraRoutes: [
      { path: '/app', element: <p>the landing resolver</p> },
      { path: '/admin/users', element: <p>the users page</p> },
    ],
  })

  await user.type(screen.getByLabelText(/email/i), 'admin@ecoriv.com')
  await user.type(screen.getByLabelText(/password/i), 'correct-horse')
  await user.click(screen.getByRole('button', { name: /sign in/i }))

  await waitFor(() => expect(screen.getByText('the landing resolver')).toBeInTheDocument())
  expect(screen.queryByText('the users page')).not.toBeInTheDocument()
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

test('offers the forgotten-password page (spec 01.9)', async () => {
  const user = userEvent.setup({ delay: null })
  renderWithProviders(<LoginPage />, {
    route: '/login',
    extraRoutes: [{ path: '/forgot-password', element: <h1>Forgot page</h1> }],
  })

  await user.click(screen.getByRole('link', { name: 'Forgot your password?' }))
  expect(await screen.findByRole('heading', { name: 'Forgot page' })).toBeInTheDocument()
})

test('says the password is reset when a reset brought the visitor here', () => {
  renderWithProviders(<LoginPage />, {
    route: { pathname: '/login', state: { passwordReset: true } },
  })
  expect(
    screen.getByText('Your password is reset. Sign in with your new password.'),
  ).toBeInTheDocument()
})
