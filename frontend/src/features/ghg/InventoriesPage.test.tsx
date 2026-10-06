import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { InventoriesPage } from './InventoriesPage'
import type { Inventory } from './api'

vi.mock('./api', () => import('./testApiMock'))

// forms with many fields take longer than the 15s default on a loaded machine
vi.setConfig({ testTimeout: 30000 })

import { getOrganization, listInventories } from './api'

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

const final: Inventory = {
  ...draft,
  id: 'inv-2',
  name: '2025 Equity Share Inventory',
  consolidationApproach: 'EQUITY_SHARE',
  finalRunId: 'run-1',
  status: 'FINAL',
  currentBoundaryVersionId: 'bv-3',
  currentBoundaryVersionNo: 3,
}

const published: Inventory = {
  ...draft,
  id: 'inv-3',
  name: '2024 Corporate Inventory',
  finalRunId: 'run-0',
  status: 'PUBLISHED',
  publishedAt: '2026-09-01T00:00:00Z',
  finalDesignatedBy: null,
  finalDesignatedAt: null,
  finalNote: null,
  supersededById: 'inv-4',
  currentBoundaryVersionId: 'bv-1',
  currentBoundaryVersionNo: 1,
}

beforeEach(() => {
  vi.mocked(listInventories).mockReset()
  vi.mocked(listInventories).mockResolvedValue([final, draft, published])
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

test('every card shows its lifecycle state, so the list shows what can run or change', async () => {
  renderWithProviders(<InventoriesPage />, {
    route: '/app/ghg/org-1/inventories',
    path: '/app/ghg/:organizationId/inventories',
  })

  expect(await screen.findByText('2025 Equity Share Inventory')).toBeInTheDocument()
  expect(screen.getByText('FINAL · BOUNDARY v3')).toBeInTheDocument()
  expect(screen.getByText('DRAFT')).toBeInTheDocument()
  expect(screen.getByText('PUBLISHED · SUPERSEDED')).toBeInTheDocument()
  expect(screen.getByText('Superseded by a correction')).toBeInTheDocument()
  // a published inventory is a record: no delete button on its card
  expect(screen.getAllByRole('button', { name: /^delete$/i })).toHaveLength(2)
})

test('New inventory leads to its own page under the list (spec 08)', async () => {
  const user = userEvent.setup()
  renderWithProviders(<InventoriesPage />, {
    route: '/app/ghg/org-1/inventories',
    path: '/app/ghg/:organizationId/inventories',
    extraRoutes: [
      { path: '/app/ghg/:organizationId/inventories/new', element: <h1>New inventory</h1> },
    ],
  })

  await user.click(await screen.findByRole('button', { name: /new inventory/i }))
  expect(await screen.findByRole('heading', { name: 'New inventory' })).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('a verifier has no usable New inventory (spec 01.4)', async () => {
  vi.mocked(getOrganization).mockResolvedValue({
    id: 'org-1',
    name: 'Ecoriv Holdings',
    accountNo: 2,
    myRole: 'VERIFIER',
    address: null,
    contact: null,
    facilityCount: 3,
    supportAccess: [],
    createdAt: '2026-08-01T00:00:00Z',
  })
  renderWithProviders(<InventoriesPage />, {
    route: '/app/ghg/org-1/inventories',
    path: '/app/ghg/:organizationId/inventories',
  })

  const button = await screen.findByRole('button', { name: /new inventory/i })
  await waitFor(() => expect(button).toBeDisabled())
  expect(button).toHaveAttribute('title', 'Needs the Preparer, Reviewer or Owner role.')
  expect(button).toHaveAccessibleDescription('Needs the Preparer, Reviewer or Owner role.')
})
