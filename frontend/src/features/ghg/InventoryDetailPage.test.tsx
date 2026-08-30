import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { InventoryDetailPage } from './InventoryDetailPage'
import type { Assignment, BoundaryEntry, Inventory, ValidationReport } from './api'

vi.mock('./api', () => import('./testApiMock'))

import {
  classifyAssignment,
  getBoundary,
  getInventory,
  getValidation,
  listAssignments,
  listEmissionFactors,
  listRuns,
  syncAssignments,
} from './api'

const inventory: Inventory = {
  id: 'inv-1',
  organizationId: 'org-1',
  name: '2025 Corporate Inventory',
  periodStart: '2025-01-01',
  periodEnd: '2025-12-31',
  purpose: 'Corporate reporting',
  baseYear: null,
  consolidationApproach: 'EQUITY_SHARE',
  finalRunId: null,
  createdAt: '2026-08-29T00:00:00Z',
}

const boundary: BoundaryEntry[] = [
  {
    facilityId: 'fac-1',
    facilityName: 'Tema Plant',
    location: 'Tema',
    inBoundary: true,
    ownershipPercent: 40,
    financialControl: false,
    operationalControl: true,
    accountingShare: 0.4,
  },
  {
    facilityId: 'fac-2',
    facilityName: 'Kumasi Plant',
    location: 'Kumasi',
    inBoundary: false,
    ownershipPercent: null,
    financialControl: null,
    operationalControl: null,
    accountingShare: null,
  },
]

const unclassified: Assignment = {
  id: 'as-1',
  activityId: 'act-1',
  facilityId: 'fac-1',
  facilityName: 'Tema Plant',
  activityType: 'Diesel consumption',
  quantity: 12500,
  unit: 'litre',
  activityDate: '2025-03-15',
  dataQuality: 'MEASURED',
  evidenceRef: 'INV-2938',
  included: true,
  exclusionReason: null,
  classified: false,
  scope: null,
  category: null,
  emissionFactorId: null,
  factorName: null,
}

const blockedReport: ValidationReport = {
  ready: false,
  gates: [
    { gate: 'BOUNDARY', status: 'PASSED', findings: [] },
    {
      gate: 'COMPLETENESS',
      status: 'WARNINGS',
      findings: [{ severity: 'WARNING', message: '1 record not reviewed' }],
    },
    {
      gate: 'CLASSIFICATION',
      status: 'BLOCKED',
      findings: [{ severity: 'ERROR', message: "'Diesel consumption' is unclassified" }],
    },
    { gate: 'EMISSION_FACTOR', status: 'PASSED', findings: [] },
  ],
}

function renderPage() {
  return renderWithProviders(<InventoryDetailPage />, {
    route: '/app/ghg/org-1/inventories/inv-1',
    path: '/app/ghg/:organizationId/inventories/:inventoryId',
  })
}

beforeEach(() => {
  vi.mocked(getInventory).mockReset()
  vi.mocked(getBoundary).mockReset()
  vi.mocked(listAssignments).mockReset()
  vi.mocked(getValidation).mockReset()
  vi.mocked(listRuns).mockReset()
  vi.mocked(listEmissionFactors).mockReset()
  vi.mocked(syncAssignments).mockReset()
  vi.mocked(classifyAssignment).mockReset()
  vi.mocked(getInventory).mockResolvedValue(inventory)
  vi.mocked(getBoundary).mockResolvedValue(boundary)
  vi.mocked(listAssignments).mockResolvedValue([unclassified])
  vi.mocked(getValidation).mockResolvedValue(blockedReport)
  vi.mocked(listRuns).mockResolvedValue([])
  vi.mocked(listEmissionFactors).mockResolvedValue([
    {
      id: 'ef-1',
      name: 'Diesel',
      scope: 'SCOPE_1',
      category: 'MOBILE_COMBUSTION',
      unit: 'litre',
      kgCo2ePerUnit: 2.66,
      source: 'DEFRA 2025',
    },
  ])
})

test('renders boundary, assignments, and holds the launch while gates block', async () => {
  renderPage()

  expect(
    await screen.findByRole('heading', { name: '2025 Corporate Inventory' }),
  ).toBeInTheDocument()

  // boundary: in-boundary facility shows its derived share; the other is out.
  // both the desktop table and the mobile card render (jsdom ignores media queries),
  // so identical controls appear twice — assert on the first occurrence.
  expect((await screen.findAllByText('Tema Plant'))[0]).toBeInTheDocument()
  expect(screen.getAllByText('40%')[0]).toBeInTheDocument()
  expect(screen.getAllByLabelText('Kumasi Plant in boundary')[0]).not.toBeChecked()

  // assignments: the fact is visible and unclassified
  expect(screen.getAllByText('Diesel consumption')[0]).toBeInTheDocument()
  expect(screen.getAllByText('Unclassified')[0]).toBeInTheDocument()

  // pre-flight: launch is on hold with the blocking finding listed
  expect(await screen.findByText('LAUNCH ON HOLD')).toBeInTheDocument()
  expect(screen.getByText(/'Diesel consumption' is unclassified/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /launch calculation run/i })).toBeDisabled()
})

test('classifying an assignment calls the API with the chosen factor', async () => {
  const user = userEvent.setup()
  vi.mocked(classifyAssignment).mockResolvedValue({
    ...unclassified,
    classified: true,
    scope: 'SCOPE_1',
    category: 'MOBILE_COMBUSTION',
    emissionFactorId: 'ef-1',
    factorName: 'Diesel',
  })
  renderPage()

  await user.selectOptions(
    (await screen.findAllByLabelText('Classify Diesel consumption'))[0],
    'ef-1',
  )
  await waitFor(() => expect(classifyAssignment).toHaveBeenCalledWith('as-1', 'ef-1'))
})

test('review activity data reports how many records were pulled in', async () => {
  const user = userEvent.setup()
  vi.mocked(syncAssignments).mockResolvedValue({ created: 3, updated: 1 })
  renderPage()

  await user.click(await screen.findByRole('button', { name: /review activity data/i }))
  expect(
    await screen.findByText(/3 new records under review · 1 stale decision refreshed/i),
  ).toBeInTheDocument()
})

test('launch is enabled when every gate passes', async () => {
  vi.mocked(getValidation).mockResolvedValue({
    ready: true,
    gates: [
      { gate: 'BOUNDARY', status: 'PASSED', findings: [] },
      { gate: 'COMPLETENESS', status: 'PASSED', findings: [] },
      { gate: 'CLASSIFICATION', status: 'PASSED', findings: [] },
      { gate: 'EMISSION_FACTOR', status: 'PASSED', findings: [] },
    ],
  })
  renderPage()

  expect(await screen.findByText('READY TO LAUNCH')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /launch calculation run/i })).toBeEnabled()
})
