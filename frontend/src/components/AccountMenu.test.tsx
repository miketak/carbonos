import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { AccountMenu } from './AccountMenu'
import type { SessionUser } from '../features/auth/api'

vi.mock('../features/auth/api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
}))
vi.mock('../features/profile/api', () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  uploadAvatar: vi.fn(),
  fetchAvatar: vi.fn(),
}))

import { logout, me } from '../features/auth/api'
import { getProfile } from '../features/profile/api'

const member: SessionUser = {
  id: 'u1',
  email: 'kofi@sankofa.com',
  displayName: 'Kofi Mensah',
  role: 'MEMBER',
  status: 'ACTIVE',
  createdAt: '2026-08-28T00:00:00Z',
}

const open = async (route = '/app/ghg') => {
  renderWithProviders(<AccountMenu />, { route, path: route })
  const trigger = await screen.findByRole('button', { name: /account menu/i })
  await userEvent.click(trigger)
  return trigger
}

beforeEach(() => {
  vi.mocked(me).mockReset()
  vi.mocked(logout).mockReset().mockResolvedValue(undefined)
  vi.mocked(getProfile).mockReset().mockResolvedValue({
    id: 'u1',
    email: member.email,
    displayName: member.displayName,
    hasAvatar: false,
  })
})

test('offers the profile and signing out, with the email as the heading', async () => {
  vi.mocked(me).mockResolvedValue(member)
  await open()

  expect(screen.getByRole('menu', { name: /account/i })).toBeInTheDocument()
  expect(screen.getByText('kofi@sankofa.com')).toBeInTheDocument()
  expect(screen.getByRole('menuitem', { name: /edit profile/i })).toHaveAttribute(
    'href',
    '/app/profile',
  )
  expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeInTheDocument()
})

test('a member is not offered the administration panel', async () => {
  vi.mocked(me).mockResolvedValue(member)
  await open()

  expect(screen.queryByRole('menuitem', { name: /administration/i })).not.toBeInTheDocument()
})

test('an administrator reaches the panel from the product', async () => {
  vi.mocked(me).mockResolvedValue({ ...member, role: 'ADMIN' })
  await open()

  // the welcome card used to be the only route back; now this is (spec 01.6)
  expect(screen.getByRole('menuitem', { name: /administration/i })).toHaveAttribute(
    'href',
    '/admin',
  )
})

test('the panel does not link to itself', async () => {
  vi.mocked(me).mockResolvedValue({ ...member, role: 'ADMIN' })
  await open('/admin/users')

  expect(screen.queryByRole('menuitem', { name: /administration/i })).not.toBeInTheDocument()
})

test('Escape closes the menu and gives the trigger back the focus', async () => {
  vi.mocked(me).mockResolvedValue(member)
  const trigger = await open()

  await userEvent.keyboard('{Escape}')

  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  expect(trigger).toHaveFocus()
})

test('signing out calls the server', async () => {
  vi.mocked(me).mockResolvedValue(member)
  await open()

  await userEvent.click(screen.getByRole('menuitem', { name: /sign out/i }))

  expect(logout).toHaveBeenCalled()
})
