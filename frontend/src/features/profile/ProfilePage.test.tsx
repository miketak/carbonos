import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { ApiError } from '../../lib/api'
import { renderWithProviders } from '../../test/utils'
import { ProfilePage } from './ProfilePage'
import type { Profile } from './api'

vi.mock('./api', () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  updatePreferences: vi.fn(),
  uploadAvatar: vi.fn(),
  fetchAvatar: vi.fn(),
  changePassword: vi.fn(),
}))
vi.mock('../auth/api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
}))

import { fetchAvatar, getProfile, updatePreferences, updateProfile } from './api'

const profile = (overrides: Partial<Profile> = {}): Profile => ({
  id: 'u1',
  email: 'someone@ecoriv.com',
  displayName: 'Someone',
  hasAvatar: false,
  dateFormat: null,
  ...overrides,
})

beforeEach(() => {
  vi.mocked(getProfile).mockReset()
  vi.mocked(updateProfile).mockReset()
  vi.mocked(updatePreferences).mockReset()
  vi.mocked(fetchAvatar).mockReset().mockResolvedValue(null)
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:mock'),
    revokeObjectURL: vi.fn(),
  })
})

test('renders the profile with a read-only email', async () => {
  vi.mocked(getProfile).mockResolvedValue(profile())
  renderWithProviders(<ProfilePage />)

  expect(await screen.findByLabelText(/email/i)).toBeDisabled()
  expect(screen.getByLabelText(/display name/i)).toHaveValue('Someone')
})

/** Spec 01.6 retired the experiment; the screen must not grow it back. */
test('offers no resume upload', async () => {
  vi.mocked(getProfile).mockResolvedValue(profile())
  renderWithProviders(<ProfilePage />)

  await screen.findByLabelText(/display name/i)
  expect(screen.queryByLabelText(/resume file/i)).not.toBeInTheDocument()
  expect(screen.queryByText(/resume/i)).not.toBeInTheDocument()
})

test('saves the display name', async () => {
  vi.mocked(getProfile).mockResolvedValue(profile())
  vi.mocked(updateProfile).mockResolvedValue(profile({ displayName: 'Renamed' }))
  renderWithProviders(<ProfilePage />)

  const input = await screen.findByLabelText(/display name/i)
  await userEvent.clear(input)
  await userEvent.type(input, 'Renamed')
  await userEvent.click(screen.getByRole('button', { name: /save changes/i }))

  expect(updateProfile).toHaveBeenCalledWith({ displayName: 'Renamed' }, expect.anything())
  expect(await screen.findByText(/profile updated/i)).toBeInTheDocument()
})

test('renders a 422 field error inline', async () => {
  vi.mocked(getProfile).mockResolvedValue(profile())
  vi.mocked(updateProfile).mockRejectedValue(
    new ApiError(422, { errors: { displayName: 'Display name is required.' } }),
  )
  renderWithProviders(<ProfilePage />)

  await screen.findByLabelText(/display name/i)
  await userEvent.click(screen.getByRole('button', { name: /save changes/i }))

  expect(await screen.findByText('Display name is required.')).toBeInTheDocument()
})

/** Spec 01.10: the date format is a personal choice, saved as soon as it is picked. */
test('shows the saved date format and saves a new one', async () => {
  vi.mocked(getProfile).mockResolvedValue(profile({ dateFormat: 'DMY' }))
  vi.mocked(updatePreferences).mockResolvedValue(profile({ dateFormat: 'MDY' }))
  renderWithProviders(<ProfilePage />)

  const select = await screen.findByLabelText(/date format/i)
  expect(select).toHaveValue('DMY')
  expect(
    screen.getByRole('option', { name: /^Day\/Month\/Year \(\d{2}\/\d{2}\/\d{4}\)$/ }),
  ).toBeInTheDocument()

  await userEvent.selectOptions(select, 'MDY')

  expect(updatePreferences).toHaveBeenCalledWith({ dateFormat: 'MDY' }, expect.anything())
  expect(await screen.findByText('Preferences updated')).toBeInTheDocument()
  expect(select).toHaveValue('MDY')
})

test('says it follows the browser until a format is chosen', async () => {
  vi.mocked(getProfile).mockResolvedValue(profile())
  renderWithProviders(<ProfilePage />)

  await screen.findByLabelText(/date format/i)
  expect(screen.getByText(/following your browser until you choose/i)).toBeInTheDocument()
})
