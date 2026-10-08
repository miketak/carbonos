import { screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { ApiError } from '../../lib/api'
import { renderWithProviders } from '../../test/utils'
import { LandingRedirect } from './LandingRedirect'
import type { SessionUser } from '../auth/api'
import type { Organization } from '../ghg/api'

vi.mock('../auth/api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
}))
vi.mock('../ghg/api', () => ({
  listOrganizations: vi.fn(),
}))

import { me } from '../auth/api'
import { listOrganizations } from '../ghg/api'

const member: SessionUser = {
  id: 'u1',
  email: 'kofi@sankofa.com',
  displayName: 'Kofi',
  role: 'MEMBER',
  status: 'ACTIVE',
  createdAt: '2026-08-28T00:00:00Z',
}

const organization = (id: string, name: string) =>
  ({ id, name, myRole: 'PREPARER', facilityCount: 0, supportAccess: [] }) as unknown as Organization

const landing = (destinations: string[]) =>
  renderWithProviders(<LandingRedirect />, {
    route: '/app',
    extraRoutes: destinations.map((path) => ({ path, element: <p>{path}</p> })),
  })

beforeEach(() => {
  vi.mocked(me).mockReset()
  vi.mocked(listOrganizations).mockReset()
})

test('an administrator lands in the administration panel', async () => {
  vi.mocked(me).mockResolvedValue({ ...member, role: 'ADMIN' })
  landing(['/admin', '/app/ghg'])

  await waitFor(() => expect(screen.getByText('/admin')).toBeInTheDocument())
  // the panel must not pull the membership list: it carries a facility count (spec 01.5)
  expect(listOrganizations).not.toHaveBeenCalled()
})

test('a member of one organization lands inside it', async () => {
  vi.mocked(me).mockResolvedValue(member)
  vi.mocked(listOrganizations).mockResolvedValue([organization('org-1', 'Sankofa Gold plc')])
  landing(['/app/ghg', '/app/ghg/org-1'])

  await waitFor(() => expect(screen.getByText('/app/ghg/org-1')).toBeInTheDocument())
})

test('a member of several organizations lands on the list', async () => {
  vi.mocked(me).mockResolvedValue(member)
  vi.mocked(listOrganizations).mockResolvedValue([
    organization('org-1', 'Sankofa Gold plc'),
    organization('org-2', 'Asante Gold Resources'),
  ])
  landing(['/app/ghg', '/app/ghg/org-1'])

  await waitFor(() => expect(screen.getByText('/app/ghg')).toBeInTheDocument())
})

test('a member of no organization lands on the list', async () => {
  vi.mocked(me).mockResolvedValue(member)
  vi.mocked(listOrganizations).mockResolvedValue([])
  landing(['/app/ghg'])

  await waitFor(() => expect(screen.getByText('/app/ghg')).toBeInTheDocument())
})

test('a failed lookup lands on the list rather than stranding the reader here', async () => {
  vi.mocked(me).mockResolvedValue(member)
  vi.mocked(listOrganizations).mockRejectedValue(new ApiError(500))
  landing(['/app/ghg'])

  await waitFor(() => expect(screen.getByText('/app/ghg')).toBeInTheDocument())
})
