import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { ApiError } from '../../lib/api'
import { renderWithProviders } from '../../test/utils'
import { ForgotPasswordPage } from './ForgotPasswordPage'

vi.mock('./passwordApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./passwordApi')>()),
  requestPasswordReset: vi.fn(),
}))

import { requestPasswordReset } from './passwordApi'

function renderPage() {
  return renderWithProviders(<ForgotPasswordPage />, { route: '/forgot-password' })
}

beforeEach(() => {
  vi.mocked(requestPasswordReset).mockReset()
})

test('sends the address and answers without saying whether an account exists', async () => {
  const user = userEvent.setup({ delay: null })
  vi.mocked(requestPasswordReset).mockResolvedValue(undefined)
  renderPage()

  await user.type(screen.getByLabelText('Email'), '  kofi@ecoriv.com ')
  await user.click(screen.getByRole('button', { name: 'Send reset link' }))

  expect(
    await screen.findByText(/belongs to an active CarbonOS account, a reset link is on its way/),
  ).toBeInTheDocument()
  expect(screen.getByText('kofi@ecoriv.com')).toBeInTheDocument()
  expect(screen.getByText(/valid for 1 hour and works once/)).toBeInTheDocument()
  expect(requestPasswordReset).toHaveBeenCalledWith('kofi@ecoriv.com')
})

test('an empty address is refused before calling the API', async () => {
  const user = userEvent.setup({ delay: null })
  renderPage()

  await user.click(screen.getByRole('button', { name: 'Send reset link' }))
  expect(await screen.findByText('Enter your email.')).toBeInTheDocument()
  expect(requestPasswordReset).not.toHaveBeenCalled()
})

test('the rate limit shows the server sentence', async () => {
  const user = userEvent.setup({ delay: null })
  vi.mocked(requestPasswordReset).mockRejectedValue(
    new ApiError(429, { detail: 'Too many password reset requests. Try again in 15 minutes.' }),
  )
  renderPage()

  await user.type(screen.getByLabelText('Email'), 'kofi@ecoriv.com')
  await user.click(screen.getByRole('button', { name: 'Send reset link' }))
  expect(
    await screen.findByText('Too many password reset requests. Try again in 15 minutes.'),
  ).toBeInTheDocument()
})
