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
  uploadAvatar: vi.fn(),
  uploadResume: vi.fn(),
  fetchAvatar: vi.fn(),
  fetchResume: vi.fn(),
}))
vi.mock('../auth/api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
}))

import { fetchAvatar, getProfile, updateProfile, uploadResume } from './api'

const profile = (overrides: Partial<Profile> = {}): Profile => ({
  id: 'u1',
  email: 'someone@ecoriv.com',
  displayName: 'Someone',
  hasAvatar: false,
  hasResume: false,
  resumeFilename: null,
  ...overrides,
})

beforeEach(() => {
  vi.mocked(getProfile).mockReset()
  vi.mocked(updateProfile).mockReset()
  vi.mocked(uploadResume).mockReset()
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
  expect(screen.getByText(/no resume uploaded/i)).toBeInTheDocument()
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

test('uploads a resume from the file input', async () => {
  vi.mocked(getProfile).mockResolvedValue(profile())
  vi.mocked(uploadResume).mockResolvedValue(profile({ hasResume: true, resumeFilename: 'cv.pdf' }))
  renderWithProviders(<ProfilePage />)

  const input = await screen.findByLabelText(/resume file/i)
  const file = new File(['%PDF-fake'], 'cv.pdf', { type: 'application/pdf' })
  await userEvent.upload(input, file)

  expect(uploadResume).toHaveBeenCalledWith(file, expect.anything())
  expect(await screen.findByRole('link', { name: /cv\.pdf/i })).toBeInTheDocument()
})
