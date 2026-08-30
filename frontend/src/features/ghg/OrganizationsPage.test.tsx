import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { OrganizationsPage } from './OrganizationsPage'
import type { Organization } from './api'

vi.mock('./api', () => import('./testApiMock'))
vi.mock('../auth/api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
}))

import { createOrganization, listOrganizations } from './api'

const organizations: Organization[] = [
  {
    id: 'org-1',
    name: 'Ecoriv Holdings',
    facilityCount: 2,
    createdAt: '2026-08-29T00:00:00Z',
  },
  {
    id: 'org-2',
    name: 'Tema Manufacturing',
    facilityCount: 0,
    createdAt: '2026-08-29T00:00:00Z',
  },
]

beforeEach(() => {
  vi.mocked(listOrganizations).mockReset()
  vi.mocked(createOrganization).mockReset()
})

test('shows a loading skeleton while pending', () => {
  vi.mocked(listOrganizations).mockReturnValue(new Promise(() => {}))
  renderWithProviders(<OrganizationsPage />, { route: '/app/ghg' })
  expect(screen.getByLabelText(/loading organizations/i)).toBeInTheDocument()
})

test('renders organization cards', async () => {
  vi.mocked(listOrganizations).mockResolvedValue(organizations)
  renderWithProviders(<OrganizationsPage />, { route: '/app/ghg' })
  expect(await screen.findByText('Ecoriv Holdings')).toBeInTheDocument()
  expect(screen.getByText('Tema Manufacturing')).toBeInTheDocument()
  expect(screen.getByText(/2 facilities in the boundary/i)).toBeInTheDocument()
})

test('shows an empty state when there are no organizations', async () => {
  vi.mocked(listOrganizations).mockResolvedValue([])
  renderWithProviders(<OrganizationsPage />, { route: '/app/ghg' })
  expect(await screen.findByRole('heading', { name: /no organizations yet/i })).toBeInTheDocument()
})

test('creates an organization through the modal', async () => {
  const user = userEvent.setup()
  vi.mocked(listOrganizations).mockResolvedValue([])
  vi.mocked(createOrganization).mockResolvedValue(organizations[0])
  renderWithProviders(<OrganizationsPage />, { route: '/app/ghg' })

  await user.click(await screen.findByRole('button', { name: /new organization/i }))
  await user.type(screen.getByLabelText(/name/i), 'Ecoriv Holdings')
  await user.click(screen.getByRole('button', { name: /create organization/i }))

  await waitFor(() => expect(createOrganization).toHaveBeenCalledWith({ name: 'Ecoriv Holdings' }))
  expect(await screen.findByText(/ecoriv holdings created/i)).toBeInTheDocument()
})
