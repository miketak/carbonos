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
  excludeAssignment,
  freezeInventory,
  getBoundary,
  getBoundaryVersion,
  getInventory,
  getValidation,
  listAssignments,
  listCoverage,
  listAuditEvents,
  listBoundaryVersions,
  listEmissionFactors,
  listFacilities,
  listMarketFactors,
  listRuns,
  listUnits,
  publishInventory,
  reopenInventory,
  excludeFacility,
  setBoundaryTreatment,
  setEntityTreatment,
  syncAssignments,
  voidRun,
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
  residualMixAvailable: null,
  residualMixKgCo2ePerKwh: null,
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
      controlledByCompany: true,
      effectiveEconomicInterestPercent: 40,
      chain: [],
      accountingShare: 0.4,
      table1Row: 'joint venture under joint financial control; equity share: 40% economic interest',
      effectiveFrom: null,
      effectiveTo: null,
      excluded: false,
      exclusionReason: null,
      facilities: [{ facilityId: 'fac-1', facilityName: 'Tema Plant', location: 'Tema' }],
    },
  ],
  exclusions: [],
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
    controlledByCompany: true,
    effectiveEconomicInterestPercent: 40,
    chain: [],
    accountingShare: 0.4,
    table1Row: 'joint venture under joint financial control; equity share: 40% economic interest',
    effectiveFrom: null,
    effectiveTo: null,
    exclusion: null,
    facilities: [
      {
        facilityId: 'fac-1',
        facilityName: 'Tema Plant',
        location: 'Tema',
        inBoundary: true,
        exclusion: null,
      },
      {
        facilityId: 'fac-2',
        facilityName: 'Tema Depot',
        location: 'Tema',
        inBoundary: false,
        exclusion: null,
      },
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
    controlledByCompany: null,
    effectiveEconomicInterestPercent: 100,
    chain: [],
    accountingShare: null,
    table1Row: null,
    effectiveFrom: null,
    effectiveTo: null,
    exclusion: null,
    facilities: [
      {
        facilityId: 'fac-3',
        facilityName: 'Kumasi Plant',
        location: 'Kumasi',
        inBoundary: false,
        exclusion: null,
      },
    ],
  },
]

const unclassified: Assignment = {
  id: 'as-1',
  activityId: 'act-1',
  facilityId: 'fac-1',
  facilityName: 'Tema Plant',
  streamId: null,
  streamName: null,
  activityType: 'Diesel consumption',
  quantity: 12500,
  unit: 'litre',
  periodStart: '2025-03-15',
  periodEnd: '2025-03-15',
  dataQuality: 'MEASURED',
  dataQualityTier: 1,
  uncertaintyPercent: null,
  evidenceRef: 'INV-2938',
  streamKind: null,
  contractorOperated: null,
  defaultScope: null,
  defaultCategory: null,
  allowedCategories: null,
  included: true,
  exclusionReason: null,
  exclusionDetail: null,
  exclusionJustification: null,
  estimatedKgCo2e: null,
  classified: false,
  scope: null,
  category: null,
  leaseType: null,
  emissionFactorId: null,
  factorName: null,
  scopeJustification: null,
  proxy: false,
  proxyJustification: null,
}

const classified: Assignment = {
  ...unclassified,
  classified: true,
  scope: 'SCOPE_1',
  category: 'MOBILE_COMBUSTION',
  emissionFactorId: 'ef-1',
  factorName: 'Diesel',
  scopeJustification: null,
  proxy: false,
  proxyJustification: null,
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
  vi.mocked(listCoverage).mockReset().mockResolvedValue([])
  vi.mocked(getValidation).mockReset().mockResolvedValue(blockedReport)
  vi.mocked(listRuns).mockReset().mockResolvedValue([])
  vi.mocked(listAuditEvents).mockReset().mockResolvedValue([])
  vi.mocked(voidRun).mockReset()
  vi.mocked(listBoundaryVersions).mockReset().mockResolvedValue([])
  vi.mocked(getBoundaryVersion).mockReset().mockResolvedValue(v1Full)
  vi.mocked(listUnits).mockReset().mockResolvedValue(units)
  vi.mocked(listMarketFactors).mockReset().mockResolvedValue([])
  vi.mocked(listFacilities).mockReset().mockResolvedValue([])
  vi.mocked(syncAssignments).mockReset()
  vi.mocked(classifyAssignment).mockReset()
  vi.mocked(excludeAssignment).mockReset()
  vi.mocked(freezeInventory).mockReset()
  vi.mocked(reopenInventory).mockReset()
  vi.mocked(withdrawFinal).mockReset()
  vi.mocked(publishInventory).mockReset()
  vi.mocked(setBoundaryTreatment).mockReset()
  vi.mocked(setEntityTreatment).mockReset()
  vi.mocked(excludeFacility).mockReset()
  vi.mocked(listEmissionFactors)
    .mockReset()
    .mockResolvedValue([
      {
        id: 'ef-1',
        organizationId: null,
        name: 'Diesel',
        defaultScope: 'SCOPE_1',
        defaultCategory: 'MOBILE_COMBUSTION',
        scopeAgnostic: true,
        unit: 'litre',
        dimension: 'VOLUME',
        kgCo2ePerUnit: 2.66,
        gases: {
          co2: 2.6307,
          ch4: 0.0001,
          n2o: 0.0001,
          hfcs: 0,
          pfcs: 0,
          sf6: 0,
          nf3: 0,
          hfcsKg: 0,
          pfcsKg: 0,
        },
        biogenicCo2KgPerUnit: 0,
        gwpSet: 'AR5',
        blendGwpSource: null,
        blendComposition: null,
        ch4Fossil: true,
        co2eOnly: false,
        source: 'DEFRA 2025',
        sourceUrl: null,
        publicationYear: 2025,
        dataYear: 2025,
        validFrom: null,
        validTo: null,
        note: null,
        approved: true,
        pack: null,
        packCode: null,
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

test('a facility left out of the boundary records why (Chapter 9, spec 07.2)', async () => {
  const user = userEvent.setup()
  vi.mocked(excludeFacility).mockResolvedValue(boundary[0])
  renderPage()

  await user.selectOptions(
    await screen.findByLabelText('Tema Depot left out because'),
    'NOT_APPLICABLE',
  )
  await waitFor(() =>
    expect(excludeFacility).toHaveBeenCalledWith('inv-1', 'fac-2', { reason: 'NOT_APPLICABLE' }),
  )
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
      streamKind: null,
      contractorOperated: null,
      defaultScope: null,
      defaultCategory: null,
      allowedCategories: null,
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
  expect(history[0]).toHaveTextContent(
    /^v2 · frozen .* by ama@ecoriv\.test · 1 entity, 2 facilities$/,
  )
  expect(history[1]).toHaveTextContent(
    /^v1 · frozen .* by ama@ecoriv\.test · 1 entity, 1 facility$/,
  )
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

  // spec 05.2: withdrawing the designation needs a reason
  await user.click(screen.getByRole('button', { name: /withdraw final designation/i }))
  const withdrawDialog = await screen.findByRole('dialog', {
    name: /withdraw the final designation/i,
  })
  expect(
    within(withdrawDialog).getByRole('button', { name: /withdraw designation/i }),
  ).toBeDisabled()
  await user.type(within(withdrawDialog).getByLabelText(/reason/i), 'Boundary v1 omitted a camp')
  await user.click(within(withdrawDialog).getByRole('button', { name: /withdraw designation/i }))
  await waitFor(() =>
    expect(withdrawFinal).toHaveBeenCalledWith('inv-1', 'Boundary v1 omitted a camp'),
  )

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

test('a run is voided with a reason, never deleted, and keeps its number', async () => {
  const user = userEvent.setup()
  const run = {
    id: 'run-1',
    inventoryId: 'inv-1',
    runNo: 1,
    label: 'Run 001',
    periodStart: '2025-01-01',
    periodEnd: '2025-12-31',
    consolidationApproach: 'EQUITY_SHARE' as const,
    gwpSet: 'AR5' as const,
    activityCount: 1,
    totalKgCo2e: 2660,
    scope1KgCo2e: 2660,
    scope2KgCo2e: 0,
    scope3KgCo2e: 0,
    scope2MarketBasedKgCo2e: 0,
    scope2MarketBasis: 'GRID_AVERAGE' as const,
    byGas: {
      co2Kg: 2630.7,
      ch4Kg: 0.1,
      ch4FossilKg: 0.1,
      n2oKg: 0.1,
      hfcsKg: 0,
      pfcsKg: 0,
      hfcsKgCo2e: 0,
      pfcsKgCo2e: 0,
      sf6Kg: 0,
      nf3Kg: 0,
    },
    biogenicCo2Kg: 0,
    isFinal: false,
    voided: false,
    voidedAt: null,
    voidedBy: null,
    voidReason: null,
    boundaryVersionId: 'bv-1',
    boundaryVersionNo: 1,
    createdBy: null,
    createdAt: '2026-09-02T10:00:00Z',
  }
  vi.mocked(getInventory).mockResolvedValue({
    ...inventory,
    status: 'FROZEN',
    currentBoundaryVersionId: 'bv-1',
    currentBoundaryVersionNo: 1,
  })
  vi.mocked(listRuns).mockResolvedValue([
    { ...run, id: 'run-2', runNo: 2, label: 'Run 002' },
    {
      ...run,
      voided: true,
      voidedAt: '2026-09-03T10:00:00Z',
      voidedBy: 'kojo@ecoriv.test',
      voidReason: 'Boundary v1 omitted the Nkran camp',
    },
  ])
  vi.mocked(listAuditEvents).mockResolvedValue([
    {
      id: 'ev-1',
      action: 'RUN_VOIDED',
      runId: 'run-1',
      runNo: 1,
      actor: 'kojo@ecoriv.test',
      reason: 'Boundary v1 omitted the Nkran camp',
      at: '2026-09-03T10:00:00Z',
    },
  ])
  vi.mocked(voidRun).mockResolvedValue({ ...run, id: 'run-2', runNo: 2, voided: true })
  renderPage()

  // the next label counts on from the highest number, voided runs included; no delete button anywhere
  expect(await screen.findByLabelText('Run label')).toHaveValue('Run 003')
  expect(screen.getByText('VOIDED')).toBeInTheDocument()
  expect(screen.getByText(/Voided by kojo@ecoriv.test/)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /^delete$/i })).not.toBeInTheDocument()
  expect(screen.getByText('Run voided')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /void…/i }))
  const dialog = await screen.findByRole('dialog', { name: /void run 002/i })
  expect(within(dialog).getByRole('button', { name: /void run/i })).toBeDisabled()
  await user.type(within(dialog).getByLabelText(/reason/i), 'Duplicate of run 003')
  await user.click(within(dialog).getByRole('button', { name: /void run/i }))
  await waitFor(() => expect(voidRun).toHaveBeenCalledWith('run-2', 'Duplicate of run 003'))
})

test('shows which months of the period have data per facility and activity', async () => {
  vi.mocked(getInventory).mockResolvedValue(inventory)
  vi.mocked(listAssignments).mockResolvedValue([unclassified])
  vi.mocked(listCoverage).mockResolvedValue([
    {
      facilityId: 'fac-1',
      facilityName: 'Tema Plant',
      activityType: 'Diesel consumption',
      months: ['2025-01', '2025-02', '2025-03'],
      coveredMonths: ['2025-03'],
    },
  ])
  renderPage()

  const matrix = await screen.findByRole('table', { name: 'Period coverage' })
  expect(within(matrix).getByTitle('Diesel consumption, 2025-03: data')).toHaveTextContent('●')
  expect(within(matrix).getByTitle('Diesel consumption, 2025-01: no data')).toHaveTextContent('○')
})

test('a methodology exclusion asks for a justification and an estimated magnitude (spec 04.4)', async () => {
  const user = userEvent.setup()
  vi.mocked(excludeAssignment).mockResolvedValue({
    ...unclassified,
    included: false,
    exclusionReason: 'METHODOLOGY',
    exclusionJustification: 'no published factor for sodium cyanide',
    estimatedKgCo2e: 8400,
  })
  renderPage()

  await user.click((await screen.findAllByRole('button', { name: /exclude…/i }))[0])
  await user.click(screen.getAllByRole('menuitem', { name: 'Methodology exclusion' })[0])
  const form = screen.getByRole('form', { name: /justification/i })
  await user.type(
    within(form).getByLabelText('Justification'),
    'no published factor for sodium cyanide',
  )
  await user.type(within(form).getByLabelText(/Estimated emissions left out/), '8400')
  await user.click(within(form).getByRole('button', { name: 'Exclude' }))

  await waitFor(() =>
    expect(excludeAssignment).toHaveBeenCalledWith('as-1', {
      reason: 'METHODOLOGY',
      justification: 'no published factor for sodium cyanide',
      estimatedKgCo2e: 8400,
    }),
  )
})
