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

import {
  createOrganization,
  deleteOrganization,
  getOrganizationCapabilities,
  listInventories,
  listOrganizations,
} from './api'

const organizations: Organization[] = [
  {
    id: 'org-1',
    name: 'Ecoriv Holdings',
    myRole: 'OWNER',
    address: null,
    contact: null,
    facilityCount: 2,
    supportAccess: [],
    createdAt: '2026-08-29T00:00:00Z',
  },
  {
    id: 'org-2',
    name: 'Tema Manufacturing',
    myRole: 'OWNER',
    address: null,
    contact: null,
    facilityCount: 0,
    supportAccess: [],
    createdAt: '2026-08-29T00:00:00Z',
  },
]

beforeEach(() => {
  vi.mocked(listOrganizations).mockReset()
  vi.mocked(createOrganization).mockReset()
  vi.mocked(deleteOrganization).mockReset()
  vi.mocked(listInventories).mockReset().mockResolvedValue([])
  vi.mocked(getOrganizationCapabilities)
    .mockReset()
    .mockResolvedValue({ mayCreateOrganization: true })
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
  expect(screen.getByText(/create your first reporting organization/i)).toBeInTheDocument()
})

/**
 * This is a landing screen now (spec 01.6), so the copy has to follow the
 * capability: telling a reader to create an organization while the button is
 * hidden from them is the invisible refusal spec 01.4 exists to stop.
 */
test('the empty state does not invite a reader who may not create one', async () => {
  vi.mocked(listOrganizations).mockResolvedValue([])
  vi.mocked(getOrganizationCapabilities).mockResolvedValue({ mayCreateOrganization: false })
  renderWithProviders(<OrganizationsPage />, { route: '/app/ghg' })

  await screen.findByRole('heading', { name: /no organizations yet/i })
  expect(await screen.findByText(/not a member of any organization yet/i)).toBeInTheDocument()
  expect(screen.queryByText(/create your first reporting organization/i)).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /new organization/i })).not.toBeInTheDocument()
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

test('an owner is offered the way into Settings, a verifier is not (spec 01.7)', async () => {
  vi.mocked(listOrganizations).mockResolvedValue([
    organizations[0],
    { ...organizations[1], myRole: 'VERIFIER' },
  ])
  renderWithProviders(<OrganizationsPage />, { route: '/app/ghg' })

  // the list opens organizations; administering one is its own page now
  const settings = await screen.findAllByRole('link', { name: /settings/i })
  expect(settings).toHaveLength(1)
  expect(settings[0]).toHaveAttribute('href', '/app/ghg/org-1/settings')
  expect(screen.queryByRole('button', { name: /^edit$/i })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /^delete$/i })).not.toBeInTheDocument()
  // anyone may create their own organization and become its owner
  expect(screen.getByRole('button', { name: /new organization/i })).toBeEnabled()
})

test('an administrator under support access sees the badge and no Settings (specs 01.3, 01.7)', async () => {
  vi.mocked(listOrganizations).mockResolvedValue([{ ...organizations[0], myRole: 'ADMIN' }])
  renderWithProviders(<OrganizationsPage />, { route: '/app/ghg' })

  expect(await screen.findByText('Support access')).toBeInTheDocument()
  // support access never grants membership changes or deletion (spec 01.3)
  expect(screen.queryByRole('link', { name: /settings/i })).not.toBeInTheDocument()
})

test('New organization is absent when the deployment reserves it to administrators', async () => {
  // spec 01.5 with spec 01.4: a control nobody here may use is not offered,
  // and the server refuses the write whether or not the screen does
  vi.mocked(listOrganizations).mockResolvedValue(organizations)
  vi.mocked(getOrganizationCapabilities).mockResolvedValue({ mayCreateOrganization: false })
  renderWithProviders(<OrganizationsPage />, { route: '/app/ghg' })

  await screen.findByText('Ecoriv Holdings')
  await waitFor(() =>
    expect(screen.queryByRole('button', { name: /new organization/i })).not.toBeInTheDocument(),
  )
})

test('New organization is offered while creation is open to everyone', async () => {
  vi.mocked(listOrganizations).mockResolvedValue(organizations)
  vi.mocked(getOrganizationCapabilities).mockResolvedValue({ mayCreateOrganization: true })
  renderWithProviders(<OrganizationsPage />, { route: '/app/ghg' })

  expect(await screen.findByRole('button', { name: /new organization/i })).toBeInTheDocument()
})
