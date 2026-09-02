import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { InventoryDetailPage } from './InventoryDetailPage'
import type {
  Assignment,
  BoundaryEntry,
  BoundaryVersion,
  BoundaryVersionSummary,
  Inventory,
  Unit,
  ValidationReport,
} from './api'

vi.mock('./api', () => import('./testApiMock'))

import {
  classifyAssignment,
  freezeBoundary,
  getBoundary,
  getBoundaryVersion,
  getInventory,
  getValidation,
  listAssignments,
  listBoundaryVersions,
  listEmissionFactors,
  listRuns,
  listUnits,
  reopenBoundary,
  setBoundaryTreatment,
  syncAssignments,
} from './api'

const units: Unit[] = [
  { code: 'litre', label: 'Litre', dimension: 'VOLUME', toCanonical: 0.001 },
  { code: 'm3', label: 'Cubic metre', dimension: 'VOLUME', toCanonical: 1 },
  { code: 'US-gallon', label: 'US gallon', dimension: 'VOLUME', toCanonical: 0.003785411784 },
  { code: 'kWh', label: 'Kilowatt-hour', dimension: 'ENERGY', toCanonical: 1 },
]

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
  boundaryStatus: 'DRAFT',
  currentBoundaryVersionId: null,
  currentBoundaryVersionNo: null,
  createdAt: '2026-08-29T00:00:00Z',
}

const v1: BoundaryVersionSummary = {
  id: 'bv-1',
  versionNo: 1,
  consolidationApproach: 'EQUITY_SHARE',
  facilityCount: 1,
  frozenByUserId: 'user-1',
  frozenBy: 'ama@ecoriv.test',
  frozenAt: '2026-09-01T10:00:00Z',
}

const v2: BoundaryVersionSummary = { ...v1, id: 'bv-2', versionNo: 2, facilityCount: 2 }

const v1Full: BoundaryVersion = {
  version: v1,
  entries: [
    {
      facilityId: 'fac-1',
      facilityName: 'Tema Plant',
      location: 'Tema',
      ownershipPercent: 40,
      financialControl: false,
      operationalControl: true,
      accountingShare: 0.4,
    },
  ],
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
  vi.mocked(listUnits).mockReset()
  vi.mocked(syncAssignments).mockReset()
  vi.mocked(classifyAssignment).mockReset()
  vi.mocked(listBoundaryVersions).mockReset()
  vi.mocked(getBoundaryVersion).mockReset()
  vi.mocked(freezeBoundary).mockReset()
  vi.mocked(reopenBoundary).mockReset()
  vi.mocked(setBoundaryTreatment).mockReset()
  vi.mocked(getInventory).mockResolvedValue(inventory)
  vi.mocked(getBoundary).mockResolvedValue(boundary)
  vi.mocked(listAssignments).mockResolvedValue([unclassified])
  vi.mocked(getValidation).mockResolvedValue(blockedReport)
  vi.mocked(listRuns).mockResolvedValue([])
  vi.mocked(listBoundaryVersions).mockResolvedValue([])
  vi.mocked(getBoundaryVersion).mockResolvedValue(v1Full)
  vi.mocked(listUnits).mockResolvedValue(units)
  vi.mocked(listEmissionFactors).mockResolvedValue([
    {
      id: 'ef-1',
      name: 'Diesel',
      scope: 'SCOPE_1',
      category: 'MOBILE_COMBUSTION',
      unit: 'litre',
      dimension: 'VOLUME',
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

test('shows the unit conversion inline when the fact and factor units differ', async () => {
  vi.mocked(listAssignments).mockResolvedValue([
    {
      ...unclassified,
      unit: 'US-gallon',
      quantity: 10000,
      classified: true,
      scope: 'SCOPE_1',
      category: 'MOBILE_COMBUSTION',
      emissionFactorId: 'ef-1',
      factorName: 'Diesel',
    },
  ])
  renderPage()

  // 10,000 US-gallon -> ~37,854 litre, previewed next to the per-litre factor
  // (loosely matched so locale number grouping doesn't make the test brittle)
  expect(
    (await screen.findAllByText(/US-gallon → .*litre × 2\.66 kg CO₂e\/litre/))[0],
  ).toBeInTheDocument()
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

// --- boundary lifecycle (spec 007) ------------------------------------------

test('a draft boundary is flagged, blocks the run, and freezes after confirming', async () => {
  const user = userEvent.setup()
  vi.mocked(getValidation).mockResolvedValue({
    ready: false,
    gates: [
      {
        gate: 'BOUNDARY',
        status: 'BLOCKED',
        findings: [
          {
            severity: 'ERROR',
            message: 'The organizational boundary is a draft. Freeze it to enable a run.',
          },
        ],
      },
      { gate: 'COMPLETENESS', status: 'PASSED', findings: [] },
      { gate: 'CLASSIFICATION', status: 'PASSED', findings: [] },
      { gate: 'EMISSION_FACTOR', status: 'PASSED', findings: [] },
    ],
  })
  vi.mocked(freezeBoundary).mockResolvedValue(v1Full)
  renderPage()

  expect(await screen.findByText('BOUNDARY DRAFT')).toBeInTheDocument()
  expect(await screen.findByText(/boundary is a draft\. Freeze it/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /launch calculation run/i })).toBeDisabled()

  // the section's button opens a confirm dialog; the dialog's button does the freeze
  await user.click(await screen.findByRole('button', { name: /freeze boundary/i }))
  const dialog = await screen.findByRole('dialog', { name: /freeze the boundary/i })
  expect(within(dialog).getByText(/1 facility currently in the boundary/)).toBeInTheDocument()
  await user.click(within(dialog).getByRole('button', { name: /freeze boundary/i }))

  await waitFor(() => expect(freezeBoundary).toHaveBeenCalledWith('inv-1'))
  expect(await screen.findByText(/boundary frozen as v1/i)).toBeInTheDocument()
})

test('a frozen boundary is read-only, offers reopen, and lists its versions', async () => {
  vi.mocked(getInventory).mockResolvedValue({
    ...inventory,
    boundaryStatus: 'FROZEN',
    currentBoundaryVersionId: 'bv-2',
    currentBoundaryVersionNo: 2,
  })
  vi.mocked(listBoundaryVersions).mockResolvedValue([v2, v1])
  renderPage()

  expect(await screen.findByText('BOUNDARY FROZEN v2')).toBeInTheDocument()
  expect((await screen.findAllByLabelText('Tema Plant in boundary'))[0]).toBeDisabled()
  expect(screen.getAllByLabelText('Tema Plant ownership percent')[0]).toBeDisabled()
  expect(screen.getAllByLabelText('Tema Plant financial control')[0]).toBeDisabled()
  expect(screen.getByRole('button', { name: /reopen as draft/i })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /freeze boundary/i })).not.toBeInTheDocument()

  // history: newest first, each naming who froze it and how many facilities it held
  const history = await screen.findAllByRole('button', { name: /^v\d · frozen/ })
  expect(history[0]).toHaveTextContent(/^v2 · frozen .* by ama@ecoriv\.test · 2 facilities$/)
  expect(history[1]).toHaveTextContent(/^v1 · frozen .* by ama@ecoriv\.test · 1 facility$/)
})

test('expanding a version loads the boundary it recorded', async () => {
  const user = userEvent.setup()
  vi.mocked(listBoundaryVersions).mockResolvedValue([v1])
  renderPage()

  await user.click(await screen.findByRole('button', { name: /^v1 · frozen/ }))
  await waitFor(() => expect(getBoundaryVersion).toHaveBeenCalledWith('bv-1'))
  // the entry table adds a third "Tema Plant" (desktop row, mobile card, version entry)
  expect((await screen.findAllByText('Tema Plant')).length).toBeGreaterThanOrEqual(3)
  expect(screen.getByText(/Version 1 · Equity share · frozen/)).toBeInTheDocument()
})

test('reopening a frozen boundary calls the API and confirms', async () => {
  const user = userEvent.setup()
  vi.mocked(getInventory).mockResolvedValue({
    ...inventory,
    boundaryStatus: 'FROZEN',
    currentBoundaryVersionId: 'bv-1',
    currentBoundaryVersionNo: 1,
  })
  vi.mocked(reopenBoundary).mockResolvedValue(inventory)
  renderPage()

  await user.click(await screen.findByRole('button', { name: /reopen as draft/i }))
  await waitFor(() => expect(reopenBoundary).toHaveBeenCalledWith('inv-1'))
  expect(await screen.findByText(/boundary reopened as a draft/i)).toBeInTheDocument()
})

test('ticking a facility in sends an empty treatment so the server prefills from its facts', async () => {
  const user = userEvent.setup()
  vi.mocked(setBoundaryTreatment).mockResolvedValue({
    ...boundary[1],
    inBoundary: true,
    ownershipPercent: 40,
    financialControl: false,
    operationalControl: true,
    accountingShare: 0.4,
  })
  renderPage()

  await user.click((await screen.findAllByLabelText('Kumasi Plant in boundary'))[0])
  await waitFor(() => expect(setBoundaryTreatment).toHaveBeenCalledWith('inv-1', 'fac-2', {}))
})
