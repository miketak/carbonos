import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { InventoryDetailPage } from './InventoryDetailPage'
import type {
  Assignment,
  AssignmentPage,
  BoundaryEntity,
  BoundaryVersion,
  BoundaryVersionSummary,
  Inventory,
  Run,
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
  finalizeRun,
  freezeInventory,
  getInheritance,
  getBoundary,
  getOrganization,
  listStreams,
  getBoundaryVersion,
  getInventory,
  getValidation,
  listCoverage,
  searchAssignments,
  listAuditEvents,
  listBoundaryVersions,
  listDensities,
  listEmissionFactors,
  listFacilities,
  listMarketFactors,
  listRuns,
  listOrganizationUnits,
  publishInventory,
  reopenInventory,
  supersedeInventory,
  updateInventory,
  excludeFacility,
  setBoundaryTreatment,
  setEntityTreatment,
  setOperationalBoundary,
  syncAssignments,
  voidRun,
  withdrawFinal,
} from './api'

const units: Unit[] = [
  {
    code: 'litre',
    label: 'Litre',
    dimension: 'VOLUME',
    toCanonical: 0.001,
    custom: false,
    definition: null,
  },
  {
    code: 'm3',
    label: 'Cubic metre',
    dimension: 'VOLUME',
    toCanonical: 1,
    custom: false,
    definition: null,
  },
  {
    code: 'US-gallon',
    label: 'US gallon',
    dimension: 'VOLUME',
    toCanonical: 0.003785411784,
    custom: false,
    definition: null,
  },
  {
    code: 'kWh',
    label: 'Kilowatt-hour',
    dimension: 'ENERGY',
    toCanonical: 1,
    custom: false,
    definition: null,
  },
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
  scope3NotQuantified: [],
  residualMixAvailable: null,
  residualMixKgCo2ePerKwh: null,
  finalRunId: null,
  status: 'DRAFT',
  supersededById: null,
  copiedFromId: null,
  correctionReason: null,
  publishedAt: null,
  finalDesignatedBy: null,
  finalDesignatedAt: null,
  finalNote: null,
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
  reopenedBy: null,
  reopenedAt: null,
  reopenReason: null,
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
    financialControlOverride: null,
    shareUnderApproach: 1,
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
    financialControlOverride: null,
    shareUnderApproach: 1,
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
  densityId: null,
  densityMaterial: null,
  densityKgPerLitre: null,
  inheritedLeaseType: null,
  suggestedFactorId: null,
  suggestedFactorName: null,
  inherited: false,
  changedSincePublication: null,
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

/** One page holding every given assignment, with the counts the view shows (spec 04.5). */
function pageOf(items: Assignment[]): AssignmentPage {
  return {
    items,
    page: 0,
    size: 50,
    total: items.length,
    included: items.filter((a) => a.included && a.classified).length,
    excluded: items.filter((a) => !a.included).length,
    unclassified: items.filter((a) => a.included && !a.classified).length,
  }
}

const blockedReport: ValidationReport = {
  ready: false,
  freezeBlockers: [],
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
  freezeBlockers: [],
  gates: blockedReport.gates.map((gate) => ({ ...gate, status: 'PASSED', findings: [] })),
}

const run: Run = {
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
    co2eUnsplitKg: 0,
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

function renderPage() {
  return renderWithProviders(<InventoryDetailPage />, {
    route: '/app/ghg/org-1/inventories/inv-1',
    path: '/app/ghg/:organizationId/inventories/:inventoryId',
  })
}

beforeEach(() => {
  vi.mocked(getInventory).mockReset().mockResolvedValue(inventory)
  vi.mocked(getBoundary).mockReset().mockResolvedValue(boundary)
  vi.mocked(searchAssignments)
    .mockReset()
    .mockResolvedValue(pageOf([unclassified]))
  vi.mocked(listCoverage).mockReset().mockResolvedValue([])
  vi.mocked(getValidation).mockReset().mockResolvedValue(blockedReport)
  vi.mocked(listRuns).mockReset().mockResolvedValue([])
  vi.mocked(listAuditEvents).mockReset().mockResolvedValue([])
  vi.mocked(voidRun).mockReset()
  vi.mocked(listBoundaryVersions).mockReset().mockResolvedValue([])
  vi.mocked(getBoundaryVersion).mockReset().mockResolvedValue(v1Full)
  vi.mocked(listOrganizationUnits).mockReset().mockResolvedValue(units)
  vi.mocked(listDensities).mockReset().mockResolvedValue([])
  vi.mocked(listMarketFactors).mockReset().mockResolvedValue([])
  vi.mocked(listFacilities).mockReset().mockResolvedValue([])
  vi.mocked(syncAssignments).mockReset()
  vi.mocked(classifyAssignment).mockReset()
  vi.mocked(excludeAssignment).mockReset()
  vi.mocked(getInheritance).mockReset().mockResolvedValue(null)
  vi.mocked(getOrganization).mockReset().mockResolvedValue({
    id: 'org-1',
    name: 'Ecoriv Holdings',
    myRole: 'OWNER',
    address: null,
    contact: null,
    facilityCount: 3,
    createdAt: '2026-08-01T00:00:00Z',
  })
  vi.mocked(listStreams).mockReset().mockResolvedValue([])
  vi.mocked(finalizeRun).mockReset()
  vi.mocked(freezeInventory).mockReset()
  vi.mocked(reopenInventory).mockReset()
  vi.mocked(withdrawFinal).mockReset()
  vi.mocked(publishInventory).mockReset()
  vi.mocked(supersedeInventory).mockReset()
  vi.mocked(updateInventory).mockReset()
  vi.mocked(setBoundaryTreatment).mockReset()
  vi.mocked(setEntityTreatment).mockReset()
  vi.mocked(setOperationalBoundary).mockReset()
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
        gridRegion: null,
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

  // spec 05.5: no factor select renders until asked for; the picker opens on demand
  expect(screen.queryByLabelText('Classify Diesel consumption')).not.toBeInTheDocument()
  await user.click((await screen.findAllByRole('button', { name: /choose factor/i }))[0])
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
  vi.mocked(searchAssignments).mockResolvedValue(pageOf([classified]))
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
  vi.mocked(searchAssignments).mockResolvedValue(
    pageOf([{ ...classified, scope: 'SCOPE_3', category: 'PURCHASED_GOODS_SERVICES' }]),
  )
  renderPage()

  expect((await screen.findAllByText(/'Diesel' suggests Scope 1/))[0]).toBeInTheDocument()
})

test('shows the unit conversion inline when the fact and factor units differ', async () => {
  vi.mocked(searchAssignments).mockResolvedValue(
    pageOf([{ ...classified, unit: 'US-gallon', quantity: 10000 }]),
  )
  renderPage()

  // 10,000 US-gallon -> ~37,854 litre, previewed next to the per-litre factor
  // (loosely matched so locale number grouping doesn't make the test brittle)
  expect(
    (await screen.findAllByText(/US-gallon → .*litre × 2\.66 kg CO₂e\/litre/))[0],
  ).toBeInTheDocument()
})

test('an automatic exclusion says why in words', async () => {
  vi.mocked(searchAssignments).mockResolvedValue(
    pageOf([
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
    ]),
  )
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
    freezeBlockers: [],
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
  expect(await screen.findByText(/inventory frozen as boundary version 1/i)).toBeInTheDocument()
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

  // history: newest first, each naming who froze it and how many facilities it held; the lifecycle bar
  // names the numbering (spec 05.5)
  expect(
    screen.getByText('Boundary version 2', { selector: 'span.tracking-wider' }),
  ).toBeInTheDocument()
  const history = await screen.findAllByRole('button', { name: /^Boundary version \d · frozen/ })
  expect(history[0]).toHaveTextContent(
    /^Boundary version 2 · frozen .* by ama@ecoriv\.test · 1 entity, 2 facilities$/,
  )
  expect(history[1]).toHaveTextContent(
    /^Boundary version 1 · frozen .* by ama@ecoriv\.test · 1 entity, 1 facility$/,
  )
})

test('expanding a version loads the boundary it recorded', async () => {
  const user = userEvent.setup()
  vi.mocked(listBoundaryVersions).mockResolvedValue([v1])
  renderPage()

  await user.click(await screen.findByRole('button', { name: /^Boundary version 1 · frozen/ }))
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

  // spec 05.5: reopening needs a reason of at least 10 characters
  await user.click(await screen.findByRole('button', { name: /reopen as draft/i }))
  const dialog = await screen.findByRole('dialog', { name: /reopen as a draft/i })
  expect(within(dialog).getByText(/next freeze cuts a new boundary version/)).toBeInTheDocument()
  const confirm = within(dialog).getByRole('button', { name: /reopen as draft/i })
  expect(confirm).toBeDisabled()
  await user.type(within(dialog).getByLabelText(/reason/i), 'instruments added for Nkran')
  await user.click(confirm)
  await waitFor(() =>
    expect(reopenInventory).toHaveBeenCalledWith('inv-1', 'instruments added for Nkran'),
  )
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
  vi.mocked(searchAssignments).mockResolvedValue(pageOf([unclassified]))
  vi.mocked(listCoverage).mockResolvedValue([
    {
      facilityId: 'fac-1',
      facilityName: 'Tema Plant',
      streamId: null,
      streamName: null,
      activityType: 'Diesel consumption',
      months: ['2025-01', '2025-02', '2025-03'],
      coveredMonths: ['2025-03'],
      pendingMonths: [],
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

test('a record in mass against a factor per litre converts through the chosen density (spec 02.2)', async () => {
  const user = userEvent.setup()
  vi.mocked(listOrganizationUnits).mockResolvedValue([
    ...units,
    {
      code: 'tonne',
      label: 'Tonne',
      dimension: 'MASS',
      toCanonical: 1000,
      custom: false,
      definition: null,
    },
    {
      code: 'kg',
      label: 'Kilogram',
      dimension: 'MASS',
      toCanonical: 1,
      custom: false,
      definition: null,
    },
  ])
  vi.mocked(listDensities).mockResolvedValue([
    {
      id: 'den-1',
      organizationId: null,
      typical: true,
      material: 'Diesel',
      kgPerLitre: 0.84,
      source: 'Typical mid-range density',
      note: null,
    },
    {
      id: 'den-2',
      organizationId: 'org-1',
      typical: false,
      material: 'Diesel (GOIL)',
      kgPerLitre: 0.8325,
      source: 'GOIL CoA',
      note: null,
    },
  ])
  const inTonnes = {
    ...classified,
    unit: 'tonne',
    quantity: 12,
    densityId: 'den-1',
    densityMaterial: 'Diesel',
    densityKgPerLitre: 0.84,
    inheritedLeaseType: null,
    suggestedFactorId: null,
    suggestedFactorName: null,
    inherited: false,
    changedSincePublication: null,
  }
  vi.mocked(searchAssignments).mockResolvedValue(pageOf([inTonnes]))
  vi.mocked(classifyAssignment).mockResolvedValue({ ...inTonnes, densityId: 'den-2' })
  renderPage()

  // 12 t = 12,000 kg / 0.84 = 14,285.71 litre, previewed with the density named
  expect(
    (
      await screen.findAllByText(
        /12 tonne → 14,285\.7143 litre \(density of Diesel, 0\.84 kg\/litre\)/,
      )
    )[0],
  ).toBeInTheDocument()
  const densityPicker = screen.getAllByLabelText('Diesel consumption density')[0]
  await user.selectOptions(densityPicker, 'den-2')
  await waitFor(() =>
    expect(classifyAssignment).toHaveBeenCalledWith('as-1', {
      emissionFactorId: 'ef-1',
      scope: 'SCOPE_1',
      category: 'MOBILE_COMBUSTION',
      densityId: 'den-2',
    }),
  )
})

test('the activity view filters by status and shows the counts (spec 04.5)', async () => {
  const user = userEvent.setup()
  vi.mocked(searchAssignments).mockResolvedValue({
    ...pageOf([unclassified, classified]),
    total: 2,
    included: 1,
    unclassified: 1,
    excluded: 0,
  })
  renderPage()

  const status = await screen.findByLabelText('Status')
  expect(within(status).getByRole('option', { name: 'Unclassified (1)' })).toBeInTheDocument()
  await user.selectOptions(status, 'UNCLASSIFIED')
  await waitFor(() =>
    expect(searchAssignments).toHaveBeenLastCalledWith(
      'inv-1',
      expect.objectContaining({ status: 'UNCLASSIFIED', page: 0 }),
    ),
  )
})

test('the coverage matrix names streams and flags one with no data (spec 04.5)', async () => {
  vi.mocked(listCoverage).mockResolvedValue([
    {
      facilityId: 'fac-1',
      facilityName: 'Tema Plant',
      streamId: 'st-1',
      streamName: 'Standby gensets',
      activityType: null,
      months: ['2025-01', '2025-02'],
      coveredMonths: ['2025-01'],
      pendingMonths: [],
    },
    {
      facilityId: 'fac-1',
      facilityName: 'Tema Plant',
      streamId: 'st-2',
      streamName: 'Camp LPG',
      activityType: null,
      months: ['2025-01', '2025-02'],
      coveredMonths: [],
      pendingMonths: [],
    },
  ])
  renderPage()

  const matrix = await screen.findByRole('table', { name: 'Period coverage' })
  expect(within(matrix).getByTitle('Standby gensets, 2025-01: data')).toHaveTextContent('●')
  expect(within(matrix).getByTitle('Camp LPG, 2025-01: no data')).toHaveTextContent('○')
  expect(within(matrix).getByText('no data')).toBeInTheDocument()
})

test('an entity at 0% under the approach cannot be ticked in and says why (spec 03.4)', async () => {
  vi.mocked(getBoundary).mockResolvedValue([
    {
      ...boundary[1],
      entityName: 'Takoradi Port Co',
      reportingCompany: false,
      shareUnderApproach: 0,
    },
  ])
  renderPage()

  expect(await screen.findByText(/Outside the boundary under equity share/)).toBeInTheDocument()
  expect(screen.getByLabelText('Takoradi Port Co in boundary')).toBeDisabled()
})

test('the activity view suggests the grid factor of the facility and names an inherited lease (spec 03.4)', async () => {
  const user = userEvent.setup()
  vi.mocked(listEmissionFactors).mockResolvedValue([
    {
      id: 'ef-grid',
      organizationId: null,
      name: 'Grid electricity, Ghana (2024)',
      defaultScope: 'SCOPE_2',
      defaultCategory: 'PURCHASED_ELECTRICITY',
      scopeAgnostic: false,
      unit: 'kWh',
      dimension: 'ENERGY',
      kgCo2ePerUnit: 0.469,
      gases: { co2: 0, ch4: 0, n2o: 0, hfcs: 0, pfcs: 0, sf6: 0, nf3: 0, hfcsKg: 0, pfcsKg: 0 },
      biogenicCo2KgPerUnit: 0,
      gwpSet: 'AR5',
      blendGwpSource: null,
      blendComposition: null,
      ch4Fossil: true,
      co2eOnly: true,
      source: 'Ember 2025',
      sourceUrl: null,
      publicationYear: 2025,
      dataYear: 2024,
      validFrom: null,
      validTo: null,
      note: null,
      approved: true,
      pack: 'ember-grid-2025',
      packCode: 'EMBER:grid:GHA:2024',
      gridRegion: 'GHA',
    },
  ])
  vi.mocked(searchAssignments).mockResolvedValue(
    pageOf([
      {
        ...unclassified,
        activityType: 'Grid electricity',
        unit: 'kWh',
        quantity: 5000,
        suggestedFactorId: 'ef-grid',
        suggestedFactorName: 'Grid electricity, Ghana (2024)',
        inheritedLeaseType: 'OPERATING_LEASE_IN',
      },
    ]),
  )
  vi.mocked(classifyAssignment).mockResolvedValue({ ...classified, emissionFactorId: 'ef-grid' })
  renderPage()

  expect(
    (await screen.findAllByText(/operating lease \(leased in\) inherited/))[0],
  ).toBeInTheDocument()
  await user.click(
    (await screen.findAllByRole('button', { name: /Suggested for this facility's grid/ }))[0],
  )
  await waitFor(() =>
    expect(classifyAssignment).toHaveBeenCalledWith('as-1', {
      emissionFactorId: 'ef-grid',
      scope: 'SCOPE_2',
      category: 'PURCHASED_ELECTRICITY',
    }),
  )
})

test('a correction asks for its reason and the page names what an inventory inherited (spec 05.3)', async () => {
  const user = userEvent.setup()
  vi.mocked(getInventory).mockResolvedValue({
    ...inventory,
    status: 'PUBLISHED',
    finalRunId: 'run-1',
    publishedAt: '2026-09-01T10:00:00Z',
    copiedFromId: 'inv-0',
  })
  vi.mocked(getInheritance).mockResolvedValue({
    sourceInventoryId: 'inv-0',
    sourceName: '2024 Corporate',
    inherited: 12,
    undecided: 3,
    correctionReason: null,
    boundaryRebuilt: false,
    leaseRederived: 0,
    droppedExclusions: [],
  })
  vi.mocked(supersedeInventory).mockResolvedValue({ ...inventory, id: 'inv-9', name: 'Fix' })
  renderPage()

  expect(
    await screen.findByText(/12 decisions inherited, 3 records of this period/),
  ).toBeInTheDocument()
  expect(
    screen.getByText(/shows each record as the published run snapshotted it/),
  ).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /create correction/i }))
  const dialog = await screen.findByRole('dialog', { name: /create a correction/i })
  const create = within(dialog).getByRole('button', { name: /^create correction$/i })
  expect(create).toBeDisabled()
  await user.type(
    within(dialog).getByLabelText('Reason for the correction'),
    'camp LPG was material after all',
  )
  await waitFor(() => expect(create).toBeEnabled())
  await user.click(create)
  await waitFor(() =>
    expect(supersedeInventory).toHaveBeenCalledWith('inv-1', {
      name: '2025 Corporate Inventory (correction)',
      reason: 'camp LPG was material after all',
    }),
  )
})

test('a declared category can say why it is not quantified this year (spec 07.6)', async () => {
  const user = userEvent.setup()
  vi.mocked(setOperationalBoundary).mockResolvedValue(inventory)
  renderPage()

  await user.click(await screen.findByLabelText('15. Investments'))
  await user.type(
    screen.getByLabelText('15. Investments: why not quantified this year'),
    'the associate reports its own inventory',
  )
  await user.click(screen.getByRole('button', { name: /save declaration/i }))

  await waitFor(() =>
    expect(setOperationalBoundary).toHaveBeenCalledWith('inv-1', {
      scope3Categories: ['INVESTMENTS'],
      exclusionsRationale: undefined,
      notQuantified: [
        { category: 'INVESTMENTS', reason: 'the associate reports its own inventory' },
      ],
    }),
  )
})

test('a draft can be edited: the straddle treatment is saved through the API (spec 04.2)', async () => {
  const user = userEvent.setup()
  vi.mocked(updateInventory).mockResolvedValue({ ...inventory, straddleTreatment: 'BLOCK' })
  renderPage()

  await user.click(await screen.findByRole('button', { name: 'Edit inventory' }))
  const dialog = await screen.findByRole('dialog', { name: 'Edit inventory' })
  expect(within(dialog).getByLabelText('Name')).toHaveValue('2025 Corporate Inventory')
  expect(within(dialog).queryByLabelText(/copy the view from/i)).not.toBeInTheDocument()
  await user.selectOptions(within(dialog).getByLabelText(/records that straddle/i), 'BLOCK')
  await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))
  await waitFor(() => expect(updateInventory).toHaveBeenCalledTimes(1))
  expect(vi.mocked(updateInventory).mock.calls[0][0]).toBe('inv-1')
  expect(vi.mocked(updateInventory).mock.calls[0][1]).toMatchObject({
    name: '2025 Corporate Inventory',
    periodStart: '2025-01-01',
    periodEnd: '2025-12-31',
    consolidationApproach: 'EQUITY_SHARE',
    gwpSet: 'AR5',
    straddleTreatment: 'BLOCK',
  })
  expect(await screen.findByText(/2025 Corporate Inventory updated/)).toBeInTheDocument()
})

test('a frozen inventory offers no edit button', async () => {
  vi.mocked(getInventory).mockResolvedValue({
    ...inventory,
    status: 'FROZEN',
    currentBoundaryVersionId: 'bv-1',
    currentBoundaryVersionNo: 1,
  })
  renderPage()
  await screen.findByRole('button', { name: /reopen as draft/i })
  expect(screen.queryByRole('button', { name: 'Edit inventory' })).not.toBeInTheDocument()
})

test('the freeze dialog shows the gate summary and is disabled while records block the freeze (spec 05.5)', async () => {
  const user = userEvent.setup()
  vi.mocked(getValidation).mockResolvedValue({
    ...blockedReport,
    freezeBlockers: [
      {
        activityId: 'act-1',
        recordRef: 'ACT-0012',
        activityType: 'Genset diesel',
        facilityName: 'Nkran',
        problem: 'is not classified',
      },
      {
        activityId: 'act-2',
        recordRef: 'ACT-0019',
        activityType: 'Camp LPG',
        facilityName: 'Nkran',
        problem: 'is not classified',
      },
      {
        activityId: 'act-3',
        recordRef: 'ACT-0033',
        activityType: 'Shiploader diesel',
        facilityName: 'Takoradi',
        problem: 'is not classified',
      },
    ],
  })
  renderPage()

  await user.click(await screen.findByRole('button', { name: /freeze inventory/i }))
  const dialog = await screen.findByRole('dialog', { name: /freeze the inventory/i })
  const summary = within(dialog).getByRole('list', { name: /gate summary/i })
  expect(within(summary).getByText('Classification').closest('li')).toHaveTextContent('1 error')
  expect(within(summary).getByText('Reporting boundary').closest('li')).toHaveTextContent('passes')
  expect(
    within(dialog).getByText('3 records are not classified; classify or exclude them first.'),
  ).toBeInTheDocument()
  expect(
    within(dialog).getByText(/ACT-0012 'Genset diesel' at Nkran is not classified/),
  ).toBeInTheDocument()
  expect(within(dialog).getByRole('button', { name: /freeze inventory/i })).toBeDisabled()
  expect(freezeInventory).not.toHaveBeenCalled()
})

test('a draft with versions cut says how many, and a frozen inventory prints who designated the final run', async () => {
  vi.mocked(listBoundaryVersions).mockResolvedValue([v2, v1])
  renderPage()
  expect(await screen.findByText('2 boundary versions cut')).toBeInTheDocument()
})

test('marking a run final is confirmed with a note by a reviewer (spec 05.5)', async () => {
  const user = userEvent.setup()
  vi.mocked(getInventory).mockResolvedValue({
    ...inventory,
    status: 'FROZEN',
    currentBoundaryVersionId: 'bv-1',
    currentBoundaryVersionNo: 1,
  })
  vi.mocked(getOrganization).mockResolvedValue({
    id: 'org-1',
    name: 'Ecoriv Holdings',
    myRole: 'REVIEWER',
    address: null,
    contact: null,
    facilityCount: 3,
    createdAt: '2026-08-01T00:00:00Z',
  })
  vi.mocked(listRuns).mockResolvedValue([run])
  vi.mocked(finalizeRun).mockResolvedValue({
    ...inventory,
    status: 'FINAL',
    finalRunId: 'run-1',
    finalDesignatedBy: 'abena@asantegold.com',
    finalDesignatedAt: '2026-09-12T10:00:00Z',
    finalNote: 'reconciled against the fuel ledger',
  })
  renderPage()

  await user.click(await screen.findByRole('button', { name: /mark as final/i }))
  const dialog = await screen.findByRole('dialog', { name: /mark run 001 as final/i })
  expect(
    within(dialog).getByText(/Run #001 \(2\.66 t CO₂e\) becomes this inventory's final run/),
  ).toBeInTheDocument()
  expect(within(dialog).getByText(/the report and the base year attach to it/)).toBeInTheDocument()
  await user.type(
    within(dialog).getByLabelText(/review note/i),
    'reconciled against the fuel ledger',
  )
  await user.click(within(dialog).getByRole('button', { name: /mark as final/i }))
  await waitFor(() =>
    expect(finalizeRun).toHaveBeenCalledWith('run-1', 'reconciled against the fuel ledger'),
  )
  expect(await screen.findByText(/Run 001 designated final/)).toBeInTheDocument()
})

test('a preparer sees Mark as final disabled with the role it needs (spec 01.4, 05.5)', async () => {
  vi.mocked(getInventory).mockResolvedValue({
    ...inventory,
    status: 'FROZEN',
    currentBoundaryVersionId: 'bv-1',
    currentBoundaryVersionNo: 1,
  })
  vi.mocked(getOrganization).mockResolvedValue({
    id: 'org-1',
    name: 'Ecoriv Holdings',
    myRole: 'PREPARER',
    address: null,
    contact: null,
    facilityCount: 3,
    createdAt: '2026-08-01T00:00:00Z',
  })
  vi.mocked(listRuns).mockResolvedValue([run])
  renderPage()

  const button = await screen.findByRole('button', { name: /mark as final/i })
  await waitFor(() => expect(button).toBeDisabled())
  expect(button).toHaveAttribute('title', 'Needs the Reviewer or Owner role.')
  expect(button).toHaveAccessibleDescription('Needs the Reviewer or Owner role.')
})

test('the final inventory prints who designated the run and the note', async () => {
  vi.mocked(getInventory).mockResolvedValue({
    ...inventory,
    status: 'FINAL',
    finalRunId: 'run-1',
    finalDesignatedBy: 'abena@asantegold.com',
    finalDesignatedAt: '2026-09-12T10:00:00Z',
    finalNote: 'reconciled against the fuel ledger',
    currentBoundaryVersionId: 'bv-1',
    currentBoundaryVersionNo: 1,
  })
  renderPage()
  expect(
    await screen.findByText(
      /Final designated by abena@asantegold\.com on .*: reconciled against the fuel ledger/,
    ),
  ).toBeInTheDocument()
  expect(
    screen.getByText('Boundary version 1', { selector: 'span.tracking-wider' }),
  ).toBeInTheDocument()
})

test('the activity view filters by scope, category, stream and lease, and shows the factor as text (spec 05.5)', async () => {
  const user = userEvent.setup()
  vi.mocked(searchAssignments).mockResolvedValue(pageOf([classified]))
  vi.mocked(listStreams).mockResolvedValue([
    {
      id: 'st-1',
      facilityId: 'fac-1',
      facilityName: 'Tema Plant',
      name: 'Mill grid supply',
      kind: 'PURCHASED_ELECTRICITY',
      fuel: null,
      meterOrSupplier: null,
      contractorOperated: false,
      note: null,
      defaultScope: 'SCOPE_2',
      defaultCategory: 'PURCHASED_ELECTRICITY',
      allowedCategories: ['PURCHASED_ELECTRICITY'],
      createdAt: '2026-08-01T00:00:00Z',
    },
  ])
  renderPage()

  // the factor reads as text with its pack and approval marks; the select renders only on demand
  const factor = (await screen.findAllByText('Diesel', { selector: 'span.font-medium' }))[0]
  expect(factor.parentElement).toHaveTextContent(/Diesel \(\/litre\)/)
  expect(screen.queryByLabelText('Classify Diesel consumption')).not.toBeInTheDocument()
  await user.click(screen.getAllByRole('button', { name: /change factor/i })[0])
  expect(screen.getAllByLabelText('Classify Diesel consumption')[0]).toBeInTheDocument()
  await user.type(screen.getAllByLabelText('Search factors for Diesel consumption')[0], 'grid')
  expect(
    within(screen.getAllByLabelText('Classify Diesel consumption')[0]).queryByText(/^Diesel/),
  ).not.toBeInTheDocument()

  await user.selectOptions(screen.getByLabelText('Scope'), 'SCOPE_2')
  await user.selectOptions(screen.getByLabelText('Stream'), 'st-1')
  await user.selectOptions(screen.getByLabelText('Lease'), 'OPERATING_LEASE_IN')
  await waitFor(() =>
    expect(searchAssignments).toHaveBeenLastCalledWith(
      'inv-1',
      expect.objectContaining({
        scope: 'SCOPE_2',
        streamId: 'st-1',
        leaseType: 'OPERATING_LEASE_IN',
        page: 0,
        size: 50,
      }),
    ),
  )
  await user.selectOptions(screen.getByLabelText('Category'), 'PURCHASED_ELECTRICITY')
  await waitFor(() =>
    expect(searchAssignments).toHaveBeenLastCalledWith(
      'inv-1',
      expect.objectContaining({ category: 'PURCHASED_ELECTRICITY' }),
    ),
  )
})

test('the inheritance notice says the boundary was rebuilt and lists the dropped exclusions (spec 05.4)', async () => {
  vi.mocked(getInheritance).mockResolvedValue({
    sourceInventoryId: 'inv-0',
    sourceName: 'FY2025 Operational control',
    inherited: 40,
    undecided: 0,
    correctionReason: null,
    boundaryRebuilt: true,
    leaseRederived: 6,
    droppedExclusions: [
      {
        entityId: 'ent-9',
        entityName: 'Wassa Gold Associates',
        facilityId: null,
        facilityName: null,
        reason: 'METHODOLOGY',
        detail: '0% under operational control',
        sharePercent: 30,
      },
    ],
  })
  renderPage()

  expect(
    await screen.findByText(
      /Boundary rebuilt from Table 1 under equity share; 6 leased assignments moved scope under Appendix F/,
    ),
  ).toBeInTheDocument()
  const dropped = screen.getByRole('list', { name: /dropped exclusions/i })
  expect(
    within(dropped).getByText(
      'Wassa Gold Associates: Methodology exclusion dropped, 30% equity share under this approach',
    ),
  ).toBeInTheDocument()
})
