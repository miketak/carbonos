import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { ApiError } from '../../lib/api'
import { renderWithProviders } from '../../test/utils'
import { InventoryFormPage } from './InventoryFormPage'
import type { Inventory } from './api'

vi.mock('./api', () => import('./testApiMock'))

// forms with many fields take longer than the 15s default on a loaded machine
vi.setConfig({ testTimeout: 30000 })

import {
  createInventory,
  getInventory,
  getOrganization,
  listInventories,
  updateInventory,
} from './api'

const draft: Inventory = {
  id: 'inv-1',
  organizationId: 'org-1',
  name: '2025 Corporate Inventory',
  periodStart: '2025-01-01',
  periodEnd: '2025-12-31',
  purpose: 'Corporate reporting',
  baseYear: null,
  consolidationApproach: 'OPERATIONAL_CONTROL',
  gwpSet: 'AR5',
  straddleTreatment: 'PRO_RATE',
  periodLabel: '2025',
  approvedBy: null,
  publishedBy: null,
  assuranceLevel: 'UNVERIFIED',
  assuranceProvider: null,
  assuranceStatement: null,
  uncertaintyStatement: null,
  scope3Categories: [],
  scope3ExclusionsRationale: null,
  scope3NotQuantified: [],
  residualMixAvailable: null,
  residualMixKgCo2ePerKwh: null,
  intensityMetrics: [],
  finalRunId: null,
  status: 'DRAFT',
  supersededById: null,
  copiedFromId: null,
  correctionReason: null,
  publishedAt: null,
  finalDesignatedBy: null,
  finalDesignatedAt: null,
  finalNote: null,
  finalDesignatedByName: null,
  finalSelfApproved: false,
  signOff: {
    preparer: null,
    approver: null,
    submittedRunId: null,
    submittedBy: null,
    submittedAt: null,
    submitNote: null,
    submitterMaySign: false,
  },
  currentBoundaryVersionId: null,
  currentBoundaryVersionNo: null,
  createdAt: '2026-08-29T00:00:00Z',
}

/** The list and the workbench, as the places a save or a cancel lands. */
const neighbours = [
  { path: '/app/ghg/:organizationId/inventories', element: <h1>GHG inventories</h1> },
  { path: '/app/ghg/:organizationId/inventories/:inventoryId', element: <h1>Workbench</h1> },
]

function renderNew() {
  return renderWithProviders(<InventoryFormPage />, {
    route: '/app/ghg/org-1/inventories/new',
    path: '/app/ghg/:organizationId/inventories/new',
    extraRoutes: neighbours,
  })
}

function renderEdit(id = 'inv-1') {
  return renderWithProviders(<InventoryFormPage />, {
    route: `/app/ghg/org-1/inventories/${id}/edit`,
    path: '/app/ghg/:organizationId/inventories/:inventoryId/edit',
    extraRoutes: neighbours,
  })
}

beforeEach(() => {
  vi.mocked(listInventories).mockReset().mockResolvedValue([draft])
  vi.mocked(getInventory).mockReset().mockResolvedValue(draft)
  vi.mocked(createInventory).mockReset()
  vi.mocked(updateInventory).mockReset()
  vi.mocked(getOrganization).mockReset().mockResolvedValue({
    id: 'org-1',
    name: 'Ecoriv Holdings',
    accountNo: 1,
    myRole: 'OWNER',
    address: null,
    contact: null,
    facilityCount: 3,
    supportAccess: [],
    createdAt: '2026-08-01T00:00:00Z',
  })
})

test('New inventory is a page of its own under the list, with a breadcrumb back (spec 08)', async () => {
  renderNew()

  expect(
    await screen.findByRole('heading', { level: 1, name: 'New inventory' }),
  ).toBeInTheDocument()
  const trail = screen.getByRole('navigation', { name: 'Breadcrumb' })
  expect(within(trail).getByRole('link', { name: 'Inventories' })).toHaveAttribute(
    'href',
    '/app/ghg/org-1/inventories',
  )
  expect(within(trail).getByText('New inventory')).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('form', { name: 'New inventory' })).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('Cancel returns to the list without creating anything', async () => {
  const user = userEvent.setup()
  renderNew()

  await user.click(await screen.findByRole('button', { name: 'Cancel' }))
  expect(await screen.findByRole('heading', { name: 'GHG inventories' })).toBeInTheDocument()
  expect(createInventory).not.toHaveBeenCalled()
})

test('the form warns when the period is not twelve months and names a fiscal year', async () => {
  const user = userEvent.setup()
  renderNew()
  await screen.findByRole('form', { name: 'New inventory' })

  // the default is the calendar year: no warning
  expect(screen.queryByRole('status')).not.toBeInTheDocument()

  const start = screen.getByLabelText(/period start/i)
  const end = screen.getByLabelText(/period end/i)
  await user.clear(start)
  await user.type(start, '2025-01-01')
  await user.clear(end)
  await user.type(end, '2026-06-30')
  expect(await screen.findByRole('status')).toHaveTextContent(/18 months/)

  await user.clear(start)
  await user.type(start, '2025-07-01')
  expect(await screen.findByRole('status')).toHaveTextContent(/FY2025\/26/)
})

test('a new inventory starts with every operation the approach includes, then opens on its workbench (spec 03.4)', async () => {
  const user = userEvent.setup()
  vi.mocked(createInventory).mockResolvedValue({ ...draft, id: 'inv-9', name: 'FY2026' })
  renderNew()

  const form = await screen.findByRole('form', { name: 'New inventory' })
  const prefill = within(form).getByLabelText(/Start with every operation the approach includes/)
  expect(prefill).toBeChecked()
  await user.click(within(form).getByRole('button', { name: /^create inventory$/i }))

  await waitFor(() =>
    expect(createInventory).toHaveBeenCalledWith(
      'org-1',
      expect.objectContaining({
        consolidationApproach: 'OPERATIONAL_CONTROL',
        prefillBoundary: true,
      }),
    ),
  )
  // the save lands where the boundary is drawn next, and the toast travels with it
  expect(await screen.findByRole('heading', { name: 'Workbench' })).toBeInTheDocument()
  expect(await screen.findByText(/FY2026 created/)).toBeInTheDocument()
})

test('a new inventory can copy its view from another, which switches off pre-population (spec 03.4, 05.3)', async () => {
  const user = userEvent.setup()
  vi.mocked(createInventory).mockResolvedValue(draft)
  renderNew()

  const form = await screen.findByRole('form', { name: 'New inventory' })
  await user.selectOptions(await within(form).findByLabelText(/Copy the view from/), draft.id)
  await user.click(within(form).getByRole('button', { name: /^create inventory$/i }))

  await waitFor(() =>
    expect(createInventory).toHaveBeenCalledWith(
      'org-1',
      expect.objectContaining({ copyFromInventoryId: draft.id, prefillBoundary: false }),
    ),
  )
})

test('the form says the boundary is rebuilt when the chosen approach differs from the source (spec 05.4)', async () => {
  const user = userEvent.setup()
  renderNew()

  const form = await screen.findByRole('form', { name: 'New inventory' })
  // the draft is an operational-control view and the form defaults to operational control: nothing to say
  await user.selectOptions(await within(form).findByLabelText(/Copy the view from/), draft.id)
  expect(within(form).queryByText(/boundary is rebuilt from Table 1/)).not.toBeInTheDocument()
  await user.selectOptions(within(form).getByLabelText(/Consolidation approach/), 'EQUITY_SHARE')
  expect(
    within(form).getByText(
      /2025 Corporate Inventory is under operational control\. Under equity share the boundary is rebuilt from Table 1/,
    ),
  ).toBeInTheDocument()
})

test('a refusal prints under the form instead of leaving the page', async () => {
  const user = userEvent.setup()
  vi.mocked(createInventory).mockRejectedValue(
    new ApiError(409, { detail: 'An inventory named 2025 Corporate Inventory already exists.' }),
  )
  renderNew()

  const form = await screen.findByRole('form', { name: 'New inventory' })
  await user.click(within(form).getByRole('button', { name: /^create inventory$/i }))
  expect(await screen.findByRole('alert')).toHaveTextContent(/already exists/)
  expect(screen.getByRole('heading', { level: 1, name: 'New inventory' })).toBeInTheDocument()
})

test('Edit inventory loads the draft, saves the straddle treatment and returns to the workbench (spec 04.2)', async () => {
  const user = userEvent.setup()
  vi.mocked(updateInventory).mockResolvedValue({ ...draft, straddleTreatment: 'BLOCK' })
  renderEdit()

  expect(
    await screen.findByRole('heading', { level: 1, name: 'Edit inventory' }),
  ).toBeInTheDocument()
  const trail = screen.getByRole('navigation', { name: 'Breadcrumb' })
  expect(within(trail).getByRole('link', { name: '2025 Corporate Inventory' })).toHaveAttribute(
    'href',
    '/app/ghg/org-1/inventories/inv-1',
  )
  const form = screen.getByRole('form', { name: 'Edit inventory' })
  expect(within(form).getByLabelText('Name')).toHaveValue('2025 Corporate Inventory')
  expect(within(form).queryByLabelText(/copy the view from/i)).not.toBeInTheDocument()
  await user.selectOptions(within(form).getByLabelText(/records that straddle/i), 'BLOCK')
  await user.click(within(form).getByRole('button', { name: 'Save changes' }))

  await waitFor(() => expect(updateInventory).toHaveBeenCalledTimes(1))
  expect(vi.mocked(updateInventory).mock.calls[0][0]).toBe('inv-1')
  expect(vi.mocked(updateInventory).mock.calls[0][1]).toMatchObject({
    name: '2025 Corporate Inventory',
    periodStart: '2025-01-01',
    periodEnd: '2025-12-31',
    consolidationApproach: 'OPERATIONAL_CONTROL',
    gwpSet: 'AR5',
    straddleTreatment: 'BLOCK',
  })
  expect(await screen.findByRole('heading', { name: 'Workbench' })).toBeInTheDocument()
  expect(await screen.findByText(/2025 Corporate Inventory updated/)).toBeInTheDocument()
})

test('editing an inventory that is gone offers the way back', async () => {
  vi.mocked(getInventory).mockRejectedValue(new Error('404'))
  renderEdit('inv-404')

  expect(await screen.findByRole('heading', { name: 'Inventory not found' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Back to inventories' })).toHaveAttribute(
    'href',
    '/app/ghg/org-1/inventories',
  )
})
