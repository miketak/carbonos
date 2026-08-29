import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { ApiError } from '../../../lib/api'
import { renderWithProviders } from '../../../test/utils'
import { UserFormModal } from './UserFormModal'

vi.mock('../api', () => ({
  listUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}))

import { createUser } from '../api'

beforeEach(() => {
  vi.mocked(createUser).mockReset()
})

test('submits the create payload', async () => {
  vi.mocked(createUser).mockResolvedValue({
    id: 'u2',
    email: 'kofi@ecoriv.com',
    displayName: 'Kofi Mensah',
    role: 'MEMBER',
    status: 'ACTIVE',
    createdAt: '2026-08-28T00:00:00Z',
  })
  const onSaved = vi.fn()
  const user = userEvent.setup({ delay: null })
  renderWithProviders(<UserFormModal onClose={vi.fn()} onSaved={onSaved} />)

  await user.type(screen.getByLabelText(/email/i), 'kofi@ecoriv.com')
  await user.type(screen.getByLabelText(/display name/i), 'Kofi Mensah')
  await user.type(screen.getByLabelText(/temporary password/i), 'temporary-1')
  await user.click(screen.getByRole('button', { name: /add user/i }))

  expect(createUser).toHaveBeenCalledWith({
    email: 'kofi@ecoriv.com',
    displayName: 'Kofi Mensah',
    role: 'MEMBER',
    temporaryPassword: 'temporary-1',
  })
  expect(onSaved).toHaveBeenCalledWith('Kofi Mensah added.')
})

test('surfaces 422 field errors inline', async () => {
  vi.mocked(createUser).mockRejectedValue(
    new ApiError(422, {
      title: 'Invalid request',
      status: 422,
      errors: { email: 'must be a well-formed email address' },
    }),
  )
  const user = userEvent.setup({ delay: null })
  renderWithProviders(<UserFormModal onClose={vi.fn()} onSaved={vi.fn()} />)

  await user.type(screen.getByLabelText(/email/i), 'not-an-email')
  await user.type(screen.getByLabelText(/display name/i), 'X')
  await user.type(screen.getByLabelText(/temporary password/i), 'temporary-1')
  await user.click(screen.getByRole('button', { name: /add user/i }))

  expect(await screen.findByText(/well-formed email address/i)).toBeInTheDocument()
})
