import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { ApiError } from '../../lib/api'
import { renderWithProviders } from '../../test/utils'
import { ChangePasswordSection } from './ChangePasswordSection'

vi.mock('./api', () => ({
  changePassword: vi.fn(),
}))

import { changePassword } from './api'

function renderSection() {
  return renderWithProviders(<ChangePasswordSection />, { route: '/app/profile' })
}

async function fill(current: string, next: string, confirm: string) {
  const user = userEvent.setup({ delay: null })
  if (current) await user.type(screen.getByLabelText('Current password'), current)
  if (next) await user.type(screen.getByLabelText('New password'), next)
  if (confirm) await user.type(screen.getByLabelText('Confirm new password'), confirm)
  await user.click(screen.getByRole('button', { name: 'Change password' }))
}

beforeEach(() => {
  vi.mocked(changePassword).mockReset()
})

test('changes the password, clears the form and says the other sessions ended', async () => {
  vi.mocked(changePassword).mockResolvedValue(undefined)
  renderSection()

  expect(screen.getByRole('heading', { name: 'Change password' })).toBeInTheDocument()
  await fill('old-password-12', 'new-password-34', 'new-password-34')

  expect(
    await screen.findByText('Password changed. Your other sessions are signed out.'),
  ).toBeInTheDocument()
  expect(changePassword).toHaveBeenCalledWith({
    currentPassword: 'old-password-12',
    newPassword: 'new-password-34',
  })
  expect(screen.getByLabelText('Current password')).toHaveValue('')
})

test('a wrong current password is shown on its field', async () => {
  vi.mocked(changePassword).mockRejectedValue(
    new ApiError(422, {
      detail: 'The current password is not correct.',
      errors: { currentPassword: 'The current password is not correct.' },
    }),
  )
  renderSection()

  await fill('not-my-password', 'new-password-34', 'new-password-34')
  expect(await screen.findByText('The current password is not correct.')).toBeInTheDocument()
  expect(screen.getByLabelText('Current password')).toHaveAttribute('aria-invalid', 'true')
})

test('the rule, the confirmation and the current password are checked before calling the API', async () => {
  renderSection()

  await fill('', 'short1', '')
  expect(await screen.findByText('Enter your current password.')).toBeInTheDocument()
  expect(screen.getAllByText('At least 12 characters, with a letter and a digit.')).toHaveLength(1)

  await userEvent.setup({ delay: null }).clear(screen.getByLabelText('New password'))
  await fill('old-password-12', 'new-password-34', 'different-password-5')
  expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument()
  expect(changePassword).not.toHaveBeenCalled()
})

test('the limit shows the server sentence', async () => {
  vi.mocked(changePassword).mockRejectedValue(
    new ApiError(429, {
      detail: 'Too many attempts to change the password. Try again in 15 minutes.',
    }),
  )
  renderSection()

  await fill('old-password-12', 'new-password-34', 'new-password-34')
  expect(
    await screen.findByText('Too many attempts to change the password. Try again in 15 minutes.'),
  ).toBeInTheDocument()
})
