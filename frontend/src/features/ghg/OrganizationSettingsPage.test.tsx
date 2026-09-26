import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { ApiError } from '../../lib/api'
import { renderWithProviders } from '../../test/utils'
import { OrganizationSettingsPage } from './OrganizationSettingsPage'
import type { Inventory, Organization } from './api'

vi.mock('./api', () => import('./testApiMock'))
vi.mock('../auth/api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
}))

import {
  addMember,
  deleteOrganization,
  getOrganization,
  listInventories,
  listMembers,
  listOrganizationEvents,
  updateOrganization,
} from './api'

const organization: Organization = {
  id: 'org-1',
  name: 'Ecoriv Holdings',
  accountNo: 1,
  myRole: 'OWNER',
  address: 'Accra, Ghana',
  contact: 'ama@ecoriv.test',
  facilityCount: 1,
  supportAccess: [],
  createdAt: '2026-08-01T00:00:00Z',
}

function inventoryStub(name: string, status: Inventory['status'], finalRunId: string | null) {
  return { id: `inv-${name}`, name, status, finalRunId } as Inventory
}

function renderSettingsPage() {
  return renderWithProviders(<OrganizationSettingsPage />, {
    route: '/app/ghg/org-1/settings',
    path: '/app/ghg/:organizationId/settings',
  })
}

beforeEach(() => {
  vi.mocked(getOrganization).mockReset().mockResolvedValue(organization)
  vi.mocked(listOrganizationEvents).mockReset().mockResolvedValue([])
  vi.mocked(listInventories).mockReset().mockResolvedValue([])
  vi.mocked(updateOrganization).mockReset().mockResolvedValue(organization)
  vi.mocked(addMember).mockReset()
  vi.mocked(deleteOrganization).mockReset()
  vi.mocked(listMembers)
    .mockReset()
    .mockResolvedValue([
      {
        id: 'm-1',
        userId: 'user-1',
        email: 'ama@ecoriv.test',
        displayName: 'Ama Mensah',
        role: 'OWNER',
        createdAt: '2026-09-01T10:00:00Z',
      },
    ])
})

test('an owner reads the details and saves a change', async () => {
  const user = userEvent.setup()
  renderSettingsPage()

  const name = await screen.findByLabelText('Name')
  expect(name).toHaveValue('Ecoriv Holdings')
  expect(screen.getByLabelText('Address')).toHaveValue('Accra, Ghana')

  await user.clear(name)
  await user.type(name, 'Ecoriv Group')
  await user.click(screen.getByRole('button', { name: /save details/i }))

  await waitFor(() =>
    expect(updateOrganization).toHaveBeenCalledWith('org-1', {
      name: 'Ecoriv Group',
      address: 'Accra, Ghana',
      contact: 'ama@ecoriv.test',
    }),
  )
})

test('the page names the organization with its account number (spec 01.8)', async () => {
  renderSettingsPage()

  expect(await screen.findByText(/Ecoriv Holdings \(ORG-0001\): its details/)).toBeInTheDocument()
  expect(screen.getByText(/the account number ORG-0001 identify/)).toBeInTheDocument()
})

test('renaming into a taken name is refused once, then saved on confirmation (spec 01.8)', async () => {
  const user = userEvent.setup()
  vi.mocked(updateOrganization)
    .mockRejectedValueOnce(
      new ApiError(409, {
        title: 'Duplicate organization name',
        detail:
          "An organization named 'Tema Manufacturing' already exists: Tema Manufacturing (ORG-0002). Confirm to use the name anyway.",
        duplicates: [{ id: 'org-2', name: 'Tema Manufacturing', accountNo: 2 }],
      }),
    )
    .mockResolvedValueOnce({ ...organization, name: 'Tema Manufacturing' })
  renderSettingsPage()

  const name = await screen.findByLabelText('Name')
  await user.clear(name)
  await user.type(name, 'Tema Manufacturing')
  await user.click(screen.getByRole('button', { name: /save details/i }))

  const notice = await screen.findByRole('alert')
  expect(notice).toHaveTextContent('Tema Manufacturing (ORG-0002)')
  expect(notice).toHaveTextContent(/Save anyway/)
  // the generic refusal line is not shown a second time
  expect(screen.getAllByRole('alert')).toHaveLength(1)

  await user.click(screen.getByRole('button', { name: /save anyway/i }))
  await waitFor(() =>
    expect(updateOrganization).toHaveBeenLastCalledWith('org-1', {
      name: 'Tema Manufacturing',
      address: 'Accra, Ghana',
      contact: 'ama@ecoriv.test',
      allowDuplicateName: true,
    }),
  )
  expect(await screen.findByText(/Tema Manufacturing \(ORG-0001\) saved/)).toBeInTheDocument()
})

test('an owner sees the members and adds one by email with a role (spec 01.2)', async () => {
  const user = userEvent.setup()
  vi.mocked(addMember).mockResolvedValue({
    id: 'm-2',
    userId: 'user-2',
    email: 'abena@client.test',
    displayName: 'Abena Owusu',
    role: 'PREPARER',
    createdAt: '2026-09-02T10:00:00Z',
  })
  renderSettingsPage()

  expect(await screen.findByText('Ama Mensah')).toBeInTheDocument()
  expect(screen.getByLabelText('Role of Ama Mensah')).toHaveValue('OWNER')
  await user.type(screen.getByLabelText(/email of an existing account/i), 'abena@client.test')
  await user.click(screen.getByRole('button', { name: /add member/i }))
  await waitFor(() =>
    expect(addMember).toHaveBeenCalledWith('org-1', {
      email: 'abena@client.test',
      role: 'PREPARER',
    }),
  )
})

test('an unknown email under Add member says what to do about it (spec 01.4)', async () => {
  const user = userEvent.setup()
  vi.mocked(addMember).mockRejectedValue(new ApiError(404, { detail: 'Account not found.' }))
  renderSettingsPage()

  expect(await screen.findByText('Ama Mensah')).toBeInTheDocument()
  const field = screen.getByLabelText(/email of an existing account/i)
  await user.type(field, 'nobody@example.com')
  await user.click(screen.getByRole('button', { name: /add member/i }))

  expect(
    await screen.findByText(/No account with that email\. Add the user under Manage users first\./),
  ).toBeInTheDocument()
  expect(field).toHaveValue('nobody@example.com')
})

test('the history names who did what to the organization and why (spec 01.3)', async () => {
  vi.mocked(listOrganizationEvents).mockResolvedValue([
    {
      id: 'ev-1',
      action: 'ADMIN_ACCESS_ASSUMED',
      runId: null,
      runNo: null,
      actor: 'support@ecoriv.com',
      reason: 'ticket 4512, preparer cannot open the run',
      at: '2026-09-12T09:14:00Z',
    },
  ])
  renderSettingsPage()

  expect(await screen.findByText(/support access assumed/i)).toBeInTheDocument()
  expect(screen.getByText('support@ecoriv.com')).toBeInTheDocument()
  expect(screen.getByText('ticket 4512, preparer cannot open the run')).toBeInTheDocument()
})

test('the history reads a factor pack adoption as a labelled act (spec 02.7)', async () => {
  vi.mocked(listOrganizationEvents).mockResolvedValue([
    {
      id: 'ev-2',
      action: 'FACTOR_PACK_ADOPTED',
      runId: null,
      runNo: null,
      actor: 'owner@client.test',
      reason:
        "adopted 'defra-2026' from 2026-01-01 as a vintage progression; no base-year candidate raised",
      at: '2026-09-17T10:00:00Z',
    },
  ])
  renderSettingsPage()

  expect(await screen.findByText('Factor pack adopted')).toBeInTheDocument()
  expect(screen.getByText(/adopted 'defra-2026' from 2026-01-01/)).toBeInTheDocument()
})

async function openDeleteDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: /delete organization/i }))
  return screen.findByRole('dialog', { name: /delete organization/i })
}

test('the deletion is behind a danger zone that asks for the name (spec 01.3)', async () => {
  const user = userEvent.setup()
  renderSettingsPage()

  const dialog = await openDeleteDialog(user)
  expect(within(dialog).getByText('Ecoriv Holdings')).toBeInTheDocument()
  // spec 01.8: two organizations may share a name, so the dialog says which one this is
  expect(within(dialog).getByText(/\(ORG-0001\) is removed/)).toBeInTheDocument()
})

test('the delete dialog lists the inventories that keep the organization on file (spec 01.3)', async () => {
  const user = userEvent.setup()
  vi.mocked(listInventories).mockResolvedValue([
    inventoryStub('FY2025 Corporate', 'PUBLISHED', 'run-1'),
    inventoryStub('FY2026 Corporate', 'DRAFT', null),
  ])
  renderSettingsPage()

  const dialog = await openDeleteDialog(user)
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
  vi.mocked(deleteOrganization).mockResolvedValue(undefined)
  renderSettingsPage()

  const dialog = await openDeleteDialog(user)
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
})

test('a refused deletion is shown in the dialog, which stays open (spec 01.4)', async () => {
  const user = userEvent.setup()
  vi.mocked(deleteOrganization).mockRejectedValue(
    new ApiError(409, { detail: "'Ecoriv Holdings' cannot be deleted while its records stand." }),
  )
  renderSettingsPage()

  const dialog = await openDeleteDialog(user)
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

test('a preparer is refused the page, and told which role it needs (spec 01.7)', async () => {
  vi.mocked(getOrganization).mockResolvedValue({ ...organization, myRole: 'PREPARER' })
  renderSettingsPage()

  expect(await screen.findByText(/settings are the owner's/i)).toBeInTheDocument()
  expect(screen.getByText(/needs the Owner role/i)).toBeInTheDocument()
  expect(screen.queryByLabelText('Name')).not.toBeInTheDocument()
  expect(screen.queryByLabelText(/email of an existing account/i)).not.toBeInTheDocument()
})

test('support access never opens the settings, whoever holds it (spec 01.3)', async () => {
  vi.mocked(getOrganization).mockResolvedValue({ ...organization, myRole: 'ADMIN' })
  renderSettingsPage()

  expect(await screen.findByText(/settings are the owner's/i)).toBeInTheDocument()
  expect(screen.getByText(/support access does not carry it/i)).toBeInTheDocument()
})
