import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { ApiError } from '../../lib/api'
import { renderWithProviders } from '../../test/utils'
import { OrganizationsPage } from './OrganizationsPage'
import type { Inventory, Organization } from './api'

vi.mock('./api', () => import('./testApiMock'))
vi.mock('../auth/api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
}))

import { createOrganization, deleteOrganization, listInventories, listOrganizations } from './api'

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
})

/** Enough of an inventory for the delete dialog to judge whether it blocks (spec 01.3). */
function inventoryStub(name: string, status: Inventory['status'], finalRunId: string | null) {
  return { id: `inv-${name}`, name, status, finalRunId } as Inventory
}

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

test('a verifier sees the card without Edit and Delete to use (spec 01.4)', async () => {
  vi.mocked(listOrganizations).mockResolvedValue([{ ...organizations[0], myRole: 'VERIFIER' }])
  renderWithProviders(<OrganizationsPage />, { route: '/app/ghg' })

  const edit = await screen.findByRole('button', { name: /edit/i })
  expect(edit).toBeDisabled()
  expect(edit).toHaveAttribute('title', 'Needs the Owner role.')
  expect(edit).toHaveAccessibleDescription('Needs the Owner role.')
  expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled()
  // anyone may create their own organization and become its owner
  expect(screen.getByRole('button', { name: /new organization/i })).toBeEnabled()
})

test('an administrator under support access sees the badge and no Delete (specs 01.3, 01.4)', async () => {
  vi.mocked(listOrganizations).mockResolvedValue([{ ...organizations[0], myRole: 'ADMIN' }])
  renderWithProviders(<OrganizationsPage />, { route: '/app/ghg' })

  expect(await screen.findByText('Support access')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /edit/i })).toBeEnabled()
  expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled()
})

test('the delete dialog lists the inventories that keep the organization on file (spec 01.3)', async () => {
  const user = userEvent.setup()
  vi.mocked(listOrganizations).mockResolvedValue([organizations[0]])
  vi.mocked(listInventories).mockResolvedValue([
    inventoryStub('FY2025 Corporate', 'PUBLISHED', 'run-1'),
    inventoryStub('FY2026 Corporate', 'DRAFT', null),
  ])
  renderWithProviders(<OrganizationsPage />, { route: '/app/ghg' })

  await user.click(await screen.findByRole('button', { name: /delete/i }))
  const dialog = await screen.findByRole('dialog', { name: /delete organization/i })
  expect(await within(dialog).findByText('FY2025 Corporate: Published')).toBeInTheDocument()
  expect(within(dialog).queryByText('FY2026 Corporate: Published')).not.toBeInTheDocument()
  expect(
    within(dialog).getByText(
      /Publish records are kept: withdraw the final designation or supersede the published inventory first\./,
    ),
  ).toBeInTheDocument()
  expect(within(dialog).getByRole('button', { name: /^delete$/i })).toBeDisabled()
  expect(within(dialog).queryByLabelText(/to confirm/i)).not.toBeInTheDocument()
})

test('deleting takes the name typed exactly and a reason (spec 01.3)', async () => {
  const user = userEvent.setup()
  vi.mocked(listOrganizations).mockResolvedValue([organizations[0]])
  vi.mocked(deleteOrganization).mockResolvedValue(undefined)
  renderWithProviders(<OrganizationsPage />, { route: '/app/ghg' })

  await user.click(await screen.findByRole('button', { name: /delete/i }))
  const dialog = await screen.findByRole('dialog', { name: /delete organization/i })
  const confirm = within(dialog).getByRole('button', { name: /^delete$/i })
  expect(confirm).toBeDisabled()

  await user.type(within(dialog).getByLabelText(/type ecoriv holdings to confirm/i), 'ecoriv')
  await user.type(within(dialog).getByLabelText(/reason/i), 'test tenant, no client data')
  expect(confirm).toBeDisabled()

  await user.clear(within(dialog).getByLabelText(/type ecoriv holdings to confirm/i))
  await user.type(
    within(dialog).getByLabelText(/type ecoriv holdings to confirm/i),
    'Ecoriv Holdings',
  )
  expect(confirm).toBeEnabled()
  await user.click(confirm)

  await waitFor(() =>
    expect(deleteOrganization).toHaveBeenCalledWith('org-1', {
      name: 'Ecoriv Holdings',
      reason: 'test tenant, no client data',
    }),
  )
  expect(await screen.findByText(/ecoriv holdings deleted/i)).toBeInTheDocument()
})

test('a refused deletion is shown in the dialog, which stays open (spec 01.4)', async () => {
  const user = userEvent.setup()
  vi.mocked(listOrganizations).mockResolvedValue([organizations[0]])
  vi.mocked(deleteOrganization).mockRejectedValue(
    new ApiError(409, { detail: "'Ecoriv Holdings' cannot be deleted while its records stand." }),
  )
  renderWithProviders(<OrganizationsPage />, { route: '/app/ghg' })

  await user.click(await screen.findByRole('button', { name: /delete/i }))
  const dialog = await screen.findByRole('dialog', { name: /delete organization/i })
  await user.type(
    within(dialog).getByLabelText(/type ecoriv holdings to confirm/i),
    'Ecoriv Holdings',
  )
  await user.type(within(dialog).getByLabelText(/reason/i), 'test tenant, no client data')
  await user.click(within(dialog).getByRole('button', { name: /^delete$/i }))

  expect(
    await within(dialog).findByText(
      /'Ecoriv Holdings' cannot be deleted while its records stand\./,
    ),
  ).toBeInTheDocument()
  expect(screen.getByRole('dialog', { name: /delete organization/i })).toBeInTheDocument()
})
