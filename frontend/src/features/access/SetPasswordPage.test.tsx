import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { SetPasswordPage } from './SetPasswordPage'
import type { SessionUser } from '../auth/api'

vi.mock('./api', () => ({
  submitAccessRequest: vi.fn(),
  getSetupInfo: vi.fn(),
  completeSetup: vi.fn(),
}))

import { completeSetup, getSetupInfo } from './api'

const newUser: SessionUser = {
  id: 'user-1',
  email: 'kofi.mensah@ecoriv.com',
  displayName: 'Kofi Mensah',
  role: 'MEMBER',
  status: 'ACTIVE',
  createdAt: '2026-08-29T00:00:00Z',
}

function renderPage(route = '/set-password?token=tok-1') {
  return renderWithProviders(<SetPasswordPage />, {
    route,
    path: '/set-password',
    extraRoutes: [{ path: '/app', element: <h1>App home</h1> }],
  })
}

beforeEach(() => {
  vi.mocked(getSetupInfo).mockReset()
  vi.mocked(completeSetup).mockReset()
})

test('greets the requester and signs them in after setting a password', async () => {
  const user = userEvent.setup()
  vi.mocked(getSetupInfo).mockResolvedValue({
    email: 'kofi.mensah@ecoriv.com',
    displayName: 'Kofi Mensah',
  })
  vi.mocked(completeSetup).mockResolvedValue(newUser)
  renderPage()

  expect(await screen.findByText('Kofi Mensah')).toBeInTheDocument()
  await user.type(screen.getByLabelText(/new password/i), 'brand-new-secret')
  await user.type(screen.getByLabelText(/confirm password/i), 'brand-new-secret')
  await user.click(screen.getByRole('button', { name: /set password and sign in/i }))

  expect(await screen.findByRole('heading', { name: 'App home' })).toBeInTheDocument()
  expect(vi.mocked(completeSetup)).toHaveBeenCalledWith('tok-1', 'brand-new-secret')
})

test('rejects mismatched passwords before calling the API', async () => {
  const user = userEvent.setup()
  vi.mocked(getSetupInfo).mockResolvedValue({
    email: 'kofi.mensah@ecoriv.com',
    displayName: 'Kofi Mensah',
  })
  renderPage()

  await screen.findByText('Kofi Mensah')
  await user.type(screen.getByLabelText(/new password/i), 'brand-new-secret')
  await user.type(screen.getByLabelText(/confirm password/i), 'something-else')
  await user.click(screen.getByRole('button', { name: /set password and sign in/i }))

  expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
  expect(vi.mocked(completeSetup)).not.toHaveBeenCalled()
})

test('shows the invalid-link state for a bad token', async () => {
  vi.mocked(getSetupInfo).mockRejectedValue(new Error('gone'))
  renderPage()
  expect(await screen.findByText(/invalid or has expired/i)).toBeInTheDocument()
})

test('shows the invalid-link state when the token is missing entirely', () => {
  renderPage('/set-password')
  expect(screen.getByText(/invalid or has expired/i)).toBeInTheDocument()
  expect(vi.mocked(getSetupInfo)).not.toHaveBeenCalled()
})
