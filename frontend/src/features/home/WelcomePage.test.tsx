import { screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { WelcomePage } from './WelcomePage'
import type { SessionUser } from '../auth/api'

vi.mock('../auth/api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
}))

import { me } from '../auth/api'

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

test('greets the user and shows the admin link for an ADMIN', async () => {
  vi.mocked(me).mockResolvedValue(user('ADMIN'))
  renderWithProviders(<WelcomePage />)

  expect(await screen.findByRole('heading', { name: /welcome, someone/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /manage users/i })).toBeInTheDocument()
})

test('hides the admin link for a MEMBER', async () => {
  vi.mocked(me).mockResolvedValue(user('MEMBER'))
  renderWithProviders(<WelcomePage />)

  expect(await screen.findByRole('heading', { name: /welcome, someone/i })).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /manage users/i })).not.toBeInTheDocument()
})
