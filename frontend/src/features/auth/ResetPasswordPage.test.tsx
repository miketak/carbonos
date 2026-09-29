import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { ApiError } from '../../lib/api'
import { renderWithProviders } from '../../test/utils'
import { ResetPasswordPage } from './ResetPasswordPage'

vi.mock('./passwordApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./passwordApi')>()),
  getPasswordResetInfo: vi.fn(),
  completePasswordReset: vi.fn(),
}))

import { completePasswordReset, getPasswordResetInfo } from './passwordApi'

function renderPage(route = '/reset-password?token=tok-1') {
  return renderWithProviders(<ResetPasswordPage />, {
    route,
    path: '/reset-password',
    extraRoutes: [{ path: '/login', element: <h1>Sign in page</h1> }],
  })
}

beforeEach(() => {
  vi.mocked(getPasswordResetInfo).mockReset()
  vi.mocked(completePasswordReset).mockReset()
})

test('sets the new password and sends the holder to sign in', async () => {
  const user = userEvent.setup({ delay: null })
  vi.mocked(getPasswordResetInfo).mockResolvedValue({ email: 'kofi@ecoriv.com' })
  vi.mocked(completePasswordReset).mockResolvedValue(undefined)
  renderPage()

  expect(await screen.findByText('kofi@ecoriv.com')).toBeInTheDocument()
  await user.type(screen.getByLabelText('New password'), 'reset-password-56')
  await user.type(screen.getByLabelText('Confirm password'), 'reset-password-56')
  await user.click(screen.getByRole('button', { name: 'Set new password' }))

  expect(await screen.findByRole('heading', { name: 'Sign in page' })).toBeInTheDocument()
  expect(completePasswordReset).toHaveBeenCalledWith('tok-1', 'reset-password-56')
})

test('the rule and the confirmation are checked before calling the API', async () => {
  const user = userEvent.setup({ delay: null })
  vi.mocked(getPasswordResetInfo).mockResolvedValue({ email: 'kofi@ecoriv.com' })
  renderPage()

  await screen.findByText('kofi@ecoriv.com')
  await user.type(screen.getByLabelText('New password'), 'short1')
  await user.click(screen.getByRole('button', { name: 'Set new password' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'At least 12 characters, with a letter and a digit.',
  )

  await user.clear(screen.getByLabelText('New password'))
  await user.type(screen.getByLabelText('New password'), 'reset-password-56')
  await user.type(screen.getByLabelText('Confirm password'), 'something-else-7')
  await user.click(screen.getByRole('button', { name: 'Set new password' }))
  expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument()
  expect(completePasswordReset).not.toHaveBeenCalled()
})

test('a used link says so and offers a new one', async () => {
  vi.mocked(getPasswordResetInfo).mockRejectedValue(
    new ApiError(410, { detail: 'This reset link has already been used.' }),
  )
  renderPage()

  expect(await screen.findByText(/This reset link has already been used\./)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Ask for a new link' })).toHaveAttribute(
    'href',
    '/forgot-password',
  )
})

test('an expired link says so', async () => {
  vi.mocked(getPasswordResetInfo).mockRejectedValue(
    new ApiError(410, {
      detail: 'This reset link has expired. Reset links are valid for 1 hour.',
    }),
  )
  renderPage()
  expect(await screen.findByText(/Reset links are valid for 1 hour\./)).toBeInTheDocument()
})

test('a link that expires while the page is open is refused on saving', async () => {
  const user = userEvent.setup({ delay: null })
  vi.mocked(getPasswordResetInfo).mockResolvedValue({ email: 'kofi@ecoriv.com' })
  vi.mocked(completePasswordReset).mockRejectedValue(
    new ApiError(410, {
      detail: 'This reset link has expired. Reset links are valid for 1 hour.',
    }),
  )
  renderPage()

  await screen.findByText('kofi@ecoriv.com')
  await user.type(screen.getByLabelText('New password'), 'reset-password-56')
  await user.type(screen.getByLabelText('Confirm password'), 'reset-password-56')
  await user.click(screen.getByRole('button', { name: 'Set new password' }))
  expect(await screen.findByText(/Reset links are valid for 1 hour\./)).toBeInTheDocument()
})

test('a missing token is not a valid link', () => {
  renderPage('/reset-password')
  expect(screen.getByText(/This reset link is not valid\./)).toBeInTheDocument()
  expect(getPasswordResetInfo).not.toHaveBeenCalled()
})
