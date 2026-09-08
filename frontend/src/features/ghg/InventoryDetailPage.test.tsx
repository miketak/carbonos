import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { InventoryDetailPage } from './InventoryDetailPage'
import type {
  Assignment,
  BoundaryEntity,
  BoundaryVersion,
  BoundaryVersionSummary,
  Inventory,
  Unit,
  ValidationReport,
} from './api'

vi.mock('./api', () => import('./testApiMock'))

// the workspace page imports every section component; its first render on a loaded
// machine (parallel jsdom workers) can exceed the 15s default
vi.setConfig({ testTimeout: 30000 })

import {
  classifyAssignment,
  freezeInventory,
  getBoundary,
  getBoundaryVersion,
  getInventory,
  getValidation,
  listAssignments,
  listBoundaryVersions,
  listEmissionFactors,
  listFacilities,
  listMarketFactors,
  listRuns,
  listUnits,
  publishInventory,
  reopenInventory,
  setBoundaryTreatment,
  setEntityTreatment,
  syncAssignments,
  withdrawFinal,
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
  gwpSet: 'AR5',
  scope3Categories: [],
  scope3ExclusionsRationale: null,
  finalRunId: null,
  status: 'DRAFT',
  supersededById: null,
  publishedAt: null,
  currentBoundaryVersionId: null,
  currentBoundaryVersionNo: null,
  createdAt: '2026-08-29T00:00:00Z',
}

const v1: BoundaryVersionSummary = {
  id: 'bv-1',
  versionNo: 1,
  consolidationApproach: 'EQUITY_SHARE',
  entityCount: 1,
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
      entityId: 'ent-1',
      entityName: 'Tema JV',
      relationshipType: 'JOINT_VENTURE',
      economicInterestPercent: 40,
      operatedByCompany: true,
      accountingShare: 0.4,
      table1Row: 'joint venture under joint financial control; equity share: 40% economic interest',
      effectiveFrom: null,
      effectiveTo: null,
      excluded: false,
      exclusionReason: null,
      facilities: [{ facilityId: 'fac-1', facilityName: 'Tema Plant', location: 'Tema' }],
    },
  ],
}

const boundary: BoundaryEntity[] = [
  {
    entityId: 'ent-1',
    entityName: 'Tema JV',
    reportingCompany: false,
    inBoundary: true,
    relationshipType: 'JOINT_VENTURE',
    economicInterestPercent: 40,
    operatedByCompany: true,
    accountingShare: 0.4,
    table1Row: 'joint venture under joint financial control; equity share: 40% economic interest',
    effectiveFrom: null,
    effectiveTo: null,
    facilities: [
      { facilityId: 'fac-1', facilityName: 'Tema Plant', location: 'Tema', inBoundary: true },
      { facilityId: 'fac-2', facilityName: 'Tema Depot', location: 'Tema', inBoundary: false },
    ],
  },
  {
    entityId: 'ent-2',
    entityName: 'Ecoriv Holdings',
    reportingCompany: true,
    inBoundary: false,
    relationshipType: null,
    economicInterestPercent: null,
    operatedByCompany: null,
    accountingShare: null,
    table1Row: null,
    effectiveFrom: null,
    effectiveTo: null,
    facilities: [
      { facilityId: 'fac-3', facilityName: 'Kumasi Plant', location: 'Kumasi', inBoundary: false },
    ],
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
  exclusionDetail: null,
  classified: false,
  scope: null,
  category: null,
  leaseType: null,
  emissionFactorId: null,
  factorName: null,
}

const classified: Assignment = {
  ...unclassified,
  classified: true,
  scope: 'SCOPE_1',
  category: 'MOBILE_COMBUSTION',
  emissionFactorId: 'ef-1',
  factorName: 'Diesel',
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
    { gate: 'BASE_YEAR', status: 'PASSED', findings: [] },
  ],
}

const passingReport: ValidationReport = {
  ready: true,
  gates: blockedReport.gates.map((gate) => ({ ...gate, status: 'PASSED', findings: [] })),
}

function renderPage() {
  return renderWithProviders(<InventoryDetailPage />, {
    route: '/app/ghg/org-1/inventories/inv-1',
    path: '/app/ghg/:organizationId/inventories/:inventoryId',
  })
}

beforeEach(() => {
  vi.mocked(getInventory).mockReset().mockResolvedValue(inventory)
  vi.mocked(getBoundary).mockReset().mockResolvedValue(boundary)
  vi.mocked(listAssignments).mockReset().mockResolvedValue([unclassified])
  vi.mocked(getValidation).mockReset().mockResolvedValue(blockedReport)
  vi.mocked(listRuns).mockReset().mockResolvedValue([])
  vi.mocked(listBoundaryVersions).mockReset().mockResolvedValue([])
  vi.mocked(getBoundaryVersion).mockReset().mockResolvedValue(v1Full)
  vi.mocked(listUnits).mockReset().mockResolvedValue(units)
  vi.mocked(listMarketFactors).mockReset().mockResolvedValue([])
  vi.mocked(listFacilities).mockReset().mockResolvedValue([])
  vi.mocked(syncAssignments).mockReset()
  vi.mocked(classifyAssignment).mockReset()
  vi.mocked(freezeInventory).mockReset()
  vi.mocked(reopenInventory).mockReset()
  vi.mocked(withdrawFinal).mockReset()
  vi.mocked(publishInventory).mockReset()
  vi.mocked(setBoundaryTreatment).mockReset()
  vi.mocked(setEntityTreatment).mockReset()
  vi.mocked(listEmissionFactors)
    .mockReset()
    .mockResolvedValue([
      {
        id: 'ef-1',
        name: 'Diesel',
        defaultScope: 'SCOPE_1',
        defaultCategory: 'MOBILE_COMBUSTION',
        scopeAgnostic: true,
        unit: 'litre',
        dimension: 'VOLUME',
        kgCo2ePerUnit: 2.66,
        gases: { co2: 2.6307, ch4: 0.0001, n2o: 0.0001, hfcs: 0, pfcs: 0, sf6: 0, nf3: 0 },
        biogenicCo2KgPerUnit: 0,
        gwpSet: 'AR5',
        source: 'DEFRA 2025',
      },
    ])
})

test('renders entities with their share and facilities, assignments, and holds the launch', async () => {
  renderPage()

  expect(
    await screen.findByRole('heading', { name: '2025 Corporate Inventory' }),
  ).toBeInTheDocument()
  expect(screen.getByText('GWP AR5')).toBeInTheDocument()

  // boundary: the JV is in with its Table 1 share; its depot and the parent are out
  expect(await screen.findByText('Tema JV')).toBeInTheDocument()
  expect(screen.getByText('40%')).toBeInTheDocument()
  expect(screen.getByText(/joint venture under joint financial control/)).toBeInTheDocument()
  expect(screen.getByLabelText('Tema Plant in boundary')).toBeChecked()
  expect(screen.getByLabelText('Tema Depot in boundary')).not.toBeChecked()
  expect(screen.getByLabelText('Ecoriv Holdings in boundary')).not.toBeChecked()

  // assignments: the fact is visible and unclassified (desktop table and mobile card both render)
  expect(screen.getAllByText('Diesel consumption')[0]).toBeInTheDocument()
  expect(screen.getAllByText('Unclassified')[0]).toBeInTheDocument()

  // pre-flight: launch is on hold with the blocking finding listed
  expect(await screen.findByText('LAUNCH ON HOLD')).toBeInTheDocument()
  expect(screen.getByText(/'Diesel consumption' is unclassified/)).toBeInTheDocument()
  expect(screen.getByText('Base year')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /launch calculation run/i })).toBeDisabled()
})

test('ticking an entity in sends an empty treatment so the server prefills from its facts', async () => {
  const user = userEvent.setup()
  vi.mocked(setEntityTreatment).mockResolvedValue({ ...boundary[1], inBoundary: true })
  renderPage()

  await user.click(await screen.findByLabelText('Ecoriv Holdings in boundary'))
  await waitFor(() => expect(setEntityTreatment).toHaveBeenCalledWith('inv-1', 'ent-2', {}))
})

test('ticking a facility in sends an empty treatment for its entity', async () => {
  const user = userEvent.setup()
  vi.mocked(setBoundaryTreatment).mockResolvedValue(boundary[0])
  renderPage()

  await user.click(await screen.findByLabelText('Tema Depot in boundary'))
  await waitFor(() => expect(setBoundaryTreatment).toHaveBeenCalledWith('inv-1', 'fac-2', {}))
})

test('setting a membership window sends the effective date to the entity treatment', async () => {
  const user = userEvent.setup()
  vi.mocked(setEntityTreatment).mockResolvedValue({ ...boundary[0], effectiveFrom: '2025-07-01' })
  renderPage()

  const from = await screen.findByLabelText('Tema JV member from')
  await user.click(from)
  await user.paste('2025-07-01')
  await user.tab()
  await waitFor(() =>
    expect(setEntityTreatment).toHaveBeenCalledWith('inv-1', 'ent-1', {
      effectiveFrom: '2025-07-01',
    }),
  )
})

test('classifying an assignment sends the factor with its default scope and category', async () => {
  const user = userEvent.setup()
  vi.mocked(classifyAssignment).mockResolvedValue(classified)
  renderPage()

  await user.selectOptions(
    (await screen.findAllByLabelText('Classify Diesel consumption'))[0],
    'ef-1',
  )
  await waitFor(() =>
    expect(classifyAssignment).toHaveBeenCalledWith('as-1', {
      emissionFactorId: 'ef-1',
      scope: 'SCOPE_1',
      category: 'MOBILE_COMBUSTION',
    }),
  )
})

test('moving a scope-agnostic factor to scope 3 sends a scope 3 category', async () => {
  const user = userEvent.setup()
  vi.mocked(listAssignments).mockResolvedValue([classified])
  vi.mocked(classifyAssignment).mockResolvedValue({
    ...classified,
    scope: 'SCOPE_3',
    category: 'PURCHASED_GOODS_SERVICES',
  })
  renderPage()

  await user.selectOptions(
    (await screen.findAllByLabelText('Diesel consumption scope'))[0],
    'SCOPE_3',
  )
  await waitFor(() =>
    expect(classifyAssignment).toHaveBeenCalledWith('as-1', {
      emissionFactorId: 'ef-1',
      scope: 'SCOPE_3',
      category: 'PURCHASED_GOODS_SERVICES',
    }),
  )
})

test('a scope that departs from the factor default is visible', async () => {
  vi.mocked(listAssignments).mockResolvedValue([
    { ...classified, scope: 'SCOPE_3', category: 'PURCHASED_GOODS_SERVICES' },
  ])
  renderPage()

  expect((await screen.findAllByText(/'Diesel' suggests Scope 1/))[0]).toBeInTheDocument()
})

test('shows the unit conversion inline when the fact and factor units differ', async () => {
  vi.mocked(listAssignments).mockResolvedValue([
    { ...classified, unit: 'US-gallon', quantity: 10000 },
  ])
  renderPage()

  // 10,000 US-gallon -> ~37,854 litre, previewed next to the per-litre factor
  // (loosely matched so locale number grouping doesn't make the test brittle)
  expect(
    (await screen.findAllByText(/US-gallon → .*litre × 2\.66 kg CO₂e\/litre/))[0],
  ).toBeInTheDocument()
})

test('an automatic exclusion says why in words', async () => {
  vi.mocked(listAssignments).mockResolvedValue([
    {
      ...unclassified,
      included: false,
      exclusionReason: 'OUTSIDE_BOUNDARY',
      exclusionDetail: 'Tema JV: member from 2025-07-01',
    },
  ])
  renderPage()

  expect((await screen.findAllByText(/Tema JV: member from 2025-07-01/))[0]).toBeInTheDocument()
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
  vi.mocked(getValidation).mockResolvedValue(passingReport)
  renderPage()

  expect(await screen.findByText('READY TO LAUNCH')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /launch calculation run/i })).toBeEnabled()
})

// --- inventory lifecycle (spec 05.1) ----------------------------------------

test('a draft inventory is flagged, blocks the run, and freezes after confirming', async () => {
  const user = userEvent.setup()
  vi.mocked(getValidation).mockResolvedValue({
    ready: false,
    gates: [
      {
        gate: 'BOUNDARY',
        status: 'BLOCKED',
        findings: [
          { severity: 'ERROR', message: 'The inventory is a draft. Freeze it to enable a run.' },
        ],
      },
      ...passingReport.gates.slice(1),
    ],
  })
  vi.mocked(freezeInventory).mockResolvedValue(v1Full)
  renderPage()

  expect(await screen.findByText('DRAFT')).toBeInTheDocument()
  expect(await screen.findByText(/inventory is a draft\. Freeze it/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /launch calculation run/i })).toBeDisabled()

  // the lifecycle bar's button opens a confirm dialog; the dialog's button does the freeze
  await user.click(await screen.findByRole('button', { name: /freeze inventory/i }))
  const dialog = await screen.findByRole('dialog', { name: /freeze the inventory/i })
  expect(within(dialog).getByText(/cuts boundary version 1/)).toBeInTheDocument()
  expect(within(dialog).getByText(/1 facility currently in the boundary/)).toBeInTheDocument()
  await user.click(within(dialog).getByRole('button', { name: /freeze inventory/i }))

  await waitFor(() => expect(freezeInventory).toHaveBeenCalledWith('inv-1'))
  expect(await screen.findByText(/inventory frozen as boundary v1/i)).toBeInTheDocument()
})

test('a frozen inventory is read-only, offers reopen, and lists its versions', async () => {
  vi.mocked(getInventory).mockResolvedValue({
    ...inventory,
    status: 'FROZEN',
    currentBoundaryVersionId: 'bv-2',
    currentBoundaryVersionNo: 2,
  })
  vi.mocked(listBoundaryVersions).mockResolvedValue([v2, v1])
  renderPage()

  expect(await screen.findByText('FROZEN · BOUNDARY v2')).toBeInTheDocument()
  expect(await screen.findByLabelText('Tema JV in boundary')).toBeDisabled()
  expect(screen.getByLabelText('Tema Plant in boundary')).toBeDisabled()
  expect(screen.getByLabelText('Tema JV economic interest percent')).toBeDisabled()
  expect(screen.getByLabelText('Tema JV operated by the company')).toBeDisabled()
  expect(screen.getByRole('button', { name: /reopen as draft/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /^publish$/i })).toBeDisabled()
  expect(screen.queryByRole('button', { name: /freeze inventory/i })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: /review activity data/i })).toBeDisabled()

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
})

test('reopening a frozen inventory calls the API and confirms', async () => {
  const user = userEvent.setup()
  vi.mocked(getInventory).mockResolvedValue({
    ...inventory,
    status: 'FROZEN',
    currentBoundaryVersionId: 'bv-1',
    currentBoundaryVersionNo: 1,
  })
  vi.mocked(reopenInventory).mockResolvedValue(inventory)
  renderPage()

  await user.click(await screen.findByRole('button', { name: /reopen as draft/i }))
  await waitFor(() => expect(reopenInventory).toHaveBeenCalledWith('inv-1'))
  expect(await screen.findByText(/inventory reopened as a draft/i)).toBeInTheDocument()
})

test('a final inventory offers to withdraw the designation or publish', async () => {
  const user = userEvent.setup()
  vi.mocked(getInventory).mockResolvedValue({
    ...inventory,
    status: 'FINAL',
    finalRunId: 'run-1',
    currentBoundaryVersionId: 'bv-1',
    currentBoundaryVersionNo: 1,
  })
  vi.mocked(publishInventory).mockResolvedValue({ ...inventory, status: 'PUBLISHED' })
  renderPage()

  expect(await screen.findByText('FINAL · BOUNDARY v1')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /withdraw final designation/i })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /reopen as draft/i })).not.toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /^publish$/i }))
  const dialog = await screen.findByRole('dialog', { name: /publish the inventory/i })
  expect(within(dialog).getByText(/nothing on this inventory can change/)).toBeInTheDocument()
  await user.click(within(dialog).getByRole('button', { name: /^publish$/i }))
  await waitFor(() => expect(publishInventory).toHaveBeenCalledWith('inv-1'))
})

test('a published inventory is a record that offers a correction', async () => {
  vi.mocked(getInventory).mockResolvedValue({
    ...inventory,
    status: 'PUBLISHED',
    finalRunId: 'run-1',
    publishedAt: '2026-09-05T09:00:00Z',
    currentBoundaryVersionId: 'bv-1',
    currentBoundaryVersionNo: 1,
  })
  renderPage()

  expect(await screen.findByText('PUBLISHED · BOUNDARY v1')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /create correction/i })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /^publish$/i })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: /launch calculation run/i })).toBeDisabled()
})
