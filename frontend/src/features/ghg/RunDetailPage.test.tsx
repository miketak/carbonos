import { screen, within } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { RunDetailPage } from './RunDetailPage'
import type { BoundaryVersion, Report } from './api'

vi.mock('./api', () => import('./testApiMock'))

import { getBoundaryVersion, getReport } from './api'

const version: BoundaryVersion = {
  version: {
    id: 'bv-1',
    versionNo: 1,
    consolidationApproach: 'EQUITY_SHARE',
    entityCount: 2,
    facilityCount: 2,
    frozenByUserId: 'user-1',
    frozenBy: 'ama@ecoriv.test',
    frozenAt: '2026-09-01T10:00:00Z',
  },
  entries: [
    {
      entityId: 'ent-1',
      entityName: 'Tema JV Ltd',
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
    {
      // in the boundary but emitted nothing: absent from the lines, present in the version
      entityId: 'ent-2',
      entityName: 'Sankofa Gold plc',
      relationshipType: 'SUBSIDIARY',
      economicInterestPercent: 100,
      operatedByCompany: true,
      controlledByCompany: true,
      effectiveEconomicInterestPercent: 100,
      chain: [],
      accountingShare: 1,
      table1Row:
        'group company or subsidiary under financial control; equity share: 100% economic interest',
      effectiveFrom: '2025-07-01',
      effectiveTo: null,
      excluded: false,
      exclusionReason: null,
      facilities: [{ facilityId: 'fac-2', facilityName: 'Nkran Camp', location: 'Ashanti' }],
    },
  ],
  exclusions: [
    {
      entityId: 'ent-3',
      entityName: 'Takoradi Port Co',
      facilityId: 'fac-9',
      facilityName: 'Takoradi Port Loadout',
      reason: 'NOT_APPLICABLE',
      detail: 'Associate: no operational control',
    },
  ],
}

const report: Report = {
  company: {
    organizationName: 'Sankofa Gold plc',
    consolidationApproach: 'EQUITY_SHARE',
    boundaryVersion: version,
  },
  operationalBoundary: {
    scopesCovered: ['SCOPE_1', 'SCOPE_2'],
    scope3Categories: ['BUSINESS_TRAVEL'],
    scope3CategoriesReported: [],
    exclusionsRationale: 'Other scope 3 categories are immaterial.',
  },
  period: {
    periodStart: '2025-01-01',
    periodEnd: '2025-12-31',
    inventoryName: '2025 Corporate Inventory',
    status: 'FROZEN',
    publishedAt: null,
    supersededById: null,
  },
  emissions: {
    scope1KgCo2e: 1064,
    scope2LocationBasedKgCo2e: 882,
    scope2MarketBasedKgCo2e: 491,
    scope3KgCo2e: 0,
    totalKgCo2e: 1946,
    scope1TCo2e: 1.064,
    scope2LocationBasedTCo2e: 0.882,
    scope2MarketBasedTCo2e: 0.491,
    scope3TCo2e: 0,
    totalTCo2e: 1.946,
    totalMethod: 'LOCATION_BASED',
    baseYearScope2Method: null,
    baseYearMarketBasedIsProxy: null,
    residualMixAvailable: false,
    residualMixKgCo2ePerKwh: null,
    residualMixDisclosure:
      'An adjusted emission factor (residual mix) is not available or has not been estimated to account for voluntary purchases in the markets the instruments sit in. This may result in double counting between electricity consumers.',
    marketInstruments: [
      {
        id: 'mf-1',
        facilityId: 'fac-1',
        facilityName: 'Tema Plant',
        instrumentType: 'CERTIFICATE',
        kgCo2ePerKwh: 0.05,
        source: 'Supplier REC 2025',
        meetsQualityCriteria: true,
        qualityNotes: null,
      },
    ],
  },
  byGas: [
    { gas: 'CO2', kg: 1934.3, kgCo2e: 1934.3, tonnes: 1.934, tCo2e: 1.934 },
    { gas: 'CH4', kg: 0.1, kgCo2e: 2.8, tonnes: 0, tCo2e: 0.003 },
    { gas: 'N2O', kg: 0.04, kgCo2e: 10.6, tonnes: 0, tCo2e: 0.011 },
    { gas: 'HFCs', kg: 0, kgCo2e: 0, tonnes: 0, tCo2e: 0 },
    { gas: 'PFCs', kg: 0, kgCo2e: 0, tonnes: 0, tCo2e: 0 },
    { gas: 'SF6', kg: 0, kgCo2e: 0, tonnes: 0, tCo2e: 0 },
    { gas: 'NF3', kg: 0, kgCo2e: 0, tonnes: 0, tCo2e: 0 },
  ],
  biogenicCo2Kg: 18000,
  biogenicCo2T: 18,
  baseYear: null,
  methodology: {
    gwpSet: 'AR5',
    consolidationApproach: 'EQUITY_SHARE',
    factorSources: ['Diesel', 'Grid electricity (Ghana)'],
    assessmentReports: ['AR5'],
    multipleAssessmentReports: false,
    statement: 'Emissions were calculated as activity data multiplied by an emission factor.',
  },
  boundaryExclusions: [
    {
      entityId: 'ent-3',
      entityName: 'Takoradi Port Co',
      facilityId: 'fac-9',
      facilityName: 'Takoradi Port Loadout',
      reason: 'NOT_APPLICABLE',
      detail: 'Associate: no operational control',
    },
  ],
  exclusions: [
    {
      id: 'ex-1',
      activityId: 'act-9',
      facilityName: 'Tema Plant',
      activityType: 'ANFO explosives consumed',
      quantity: 8400,
      unit: 'tonne ANFO',
      activityDate: '2025-08-31',
      exclusionReason: 'METHODOLOGY',
      exclusionDetail: null,
    },
    {
      id: 'ex-2',
      activityId: 'act-10',
      facilityName: 'Nkran Camp',
      activityType: 'Camp LPG',
      quantity: 500,
      unit: 'litre',
      activityDate: '2025-01-15',
      exclusionReason: 'OUTSIDE_BOUNDARY',
      exclusionDetail: 'Sankofa Gold plc: member from 2025-07-01',
    },
  ],
  lines: [
    {
      id: 'line-1',
      activityId: 'act-1',
      facilityId: 'fac-1',
      facilityName: 'Tema Plant',
      factorName: 'Diesel',
      scope: 'SCOPE_1',
      category: 'MOBILE_COMBUSTION',
      leaseType: null,
      quantity: 1000,
      unit: 'litre',
      factorUnit: 'litre',
      convertedQuantity: 1000,
      conversionFactor: 1,
      kgCo2ePerUnit: 2.66,
      weight: 0.4,
      kgCo2e: 1064,
      byGas: {
        co2Kg: 1052.3,
        ch4Kg: 0.04,
        ch4FossilKg: 0.04,
        n2oKg: 0.04,
        hfcsKg: 0,
        pfcsKg: 0,
        hfcsKgCo2e: 0,
        pfcsKgCo2e: 0,
        sf6Kg: 0,
        nf3Kg: 0,
      },
      biogenicCo2Kg: 0,
      blendGwpSource: null,
      marketBasedKgCo2e: null,
      marketFactorKgCo2ePerKwh: null,
      marketInstrument: null,
      marketNote: null,
    },
  ],
  run: {
    id: 'run-1',
    inventoryId: 'inv-1',
    label: 'Run 001',
    periodStart: '2025-01-01',
    periodEnd: '2025-12-31',
    consolidationApproach: 'EQUITY_SHARE',
    gwpSet: 'AR5',
    activityCount: 1,
    totalKgCo2e: 1946,
    scope1KgCo2e: 1064,
    scope2KgCo2e: 882,
    scope3KgCo2e: 0,
    scope2MarketBasedKgCo2e: 491,
    byGas: {
      co2Kg: 1934.3,
      ch4Kg: 0.1,
      ch4FossilKg: 0.1,
      n2oKg: 0.04,
      hfcsKg: 0,
      pfcsKg: 0,
      hfcsKgCo2e: 0,
      pfcsKgCo2e: 0,
      sf6Kg: 0,
      nf3Kg: 0,
    },
    biogenicCo2Kg: 18000,
    isFinal: false,
    boundaryVersionId: 'bv-1',
    boundaryVersionNo: 1,
    createdAt: '2026-08-29T00:00:00Z',
  },
}

function renderRunDetailPage() {
  return renderWithProviders(<RunDetailPage />, {
    route: '/app/ghg/org-1/inventories/inv-1/runs/run-1',
    path: '/app/ghg/:organizationId/inventories/:inventoryId/runs/:runId',
  })
}

beforeEach(() => {
  vi.mocked(getReport).mockReset()
  vi.mocked(getBoundaryVersion).mockReset()
  vi.mocked(getReport).mockResolvedValue(report)
  vi.mocked(getBoundaryVersion).mockResolvedValue(version)
})

test('renders the run as a report with the accounting share applied', async () => {
  renderRunDetailPage()

  expect(await screen.findByRole('heading', { name: 'Run 001' })).toBeInTheDocument()
  expect(screen.getAllByText('1.95 t CO₂e').length).toBeGreaterThan(0)
  expect(screen.getAllByText('Tema Plant')[0]).toBeInTheDocument()
  expect(screen.getAllByText('40%')[0]).toBeInTheDocument()
  expect(vi.mocked(getReport)).toHaveBeenCalledWith('run-1')
})

test('shows a not-found state when the run fails to load', async () => {
  vi.mocked(getReport).mockRejectedValue(new Error('gone'))
  renderRunDetailPage()

  expect(await screen.findByRole('heading', { name: /report not found/i })).toBeInTheDocument()
})

test('cites the boundary version the run computed from, including silent entities', async () => {
  renderRunDetailPage()

  expect(
    await screen.findByRole('heading', { name: /company and organizational boundary/i }),
  ).toBeInTheDocument()
  await screen.findByText(/Version 1 · Equity share · frozen .* by ama@ecoriv\.test/)
  // Sankofa's own entity has no run line, yet the version shows it was in scope at 100% from July
  const own = screen.getByText('Sankofa Gold plc', { selector: 'span.font-medium' }).closest('tr')
  expect(own).toHaveTextContent(/Subsidiary · member from 2025-07-01/)
  expect(own).toHaveTextContent(/Nkran Camp/)
  expect(own).toHaveTextContent(/100%.*Yes.*100%/)
  expect(vi.mocked(getBoundaryVersion)).toHaveBeenCalledWith('bv-1')
})

test('reports scope 2 market-based beside location-based, each gas, and biogenic CO2', async () => {
  renderRunDetailPage()

  const scopes = (await screen.findByRole('heading', { name: /emissions by scope/i })).closest(
    'div',
  )!
  // Chapter 9 asks for metric tonnes (spec 07.2)
  expect(within(scopes).getByText('Scope 2, location-based').closest('tr')).toHaveTextContent(
    '0.882 t CO₂e',
  )
  expect(within(scopes).getByText('Scope 2, market-based').closest('tr')).toHaveTextContent(
    '0.491 t CO₂e',
  )
  expect(within(scopes).getByText(/Energy attribute certificate/)).toBeInTheDocument()
  expect(within(scopes).getByText(/meets the Scope 2 Quality Criteria/)).toBeInTheDocument()
  expect(within(scopes).getByText(/The total uses the location-based scope 2/)).toBeInTheDocument()
  // the Scope 2 Guidance's residual-mix disclosure
  expect(within(scopes).getByText(/may result in double counting/)).toBeInTheDocument()

  const gases = screen.getByRole('heading', { name: /emissions by gas/i }).closest('div')!
  expect(within(gases).getByText('CO2')).toBeInTheDocument()
  expect(within(gases).getByText('CH4').closest('tr')).toHaveTextContent(/0\.1 kg.*0\.003 t CO₂e/)
  expect(within(gases).getByText('N2O')).toBeInTheDocument()
  // zero gases are hidden; the assessment report behind the blends is stated
  expect(within(gases).queryByText('SF6')).not.toBeInTheDocument()
  expect(
    within(gases).getByText(/blends are converted from their component gases/),
  ).toBeInTheDocument()

  expect(screen.getByText(/of biogenic CO₂, reported separately/)).toBeInTheDocument()
  expect(screen.getByText('18.000 t')).toBeInTheDocument()
})

test('names every assessment report when a blend kept another one', async () => {
  vi.mocked(getReport).mockResolvedValue({
    ...report,
    methodology: {
      ...report.methodology,
      gwpSet: 'AR6',
      assessmentReports: ['AR6', 'AR5'],
      multipleAssessmentReports: true,
    },
  })
  renderRunDetailPage()

  expect(await screen.findByText(/More than one assessment report was used/)).toBeInTheDocument()
  expect(screen.getByText(/Assessment reports used: AR6, AR5/)).toBeInTheDocument()
})

test('prints the operational boundary declaration and the exclusions grouped by reason', async () => {
  renderRunDetailPage()

  expect(await screen.findByText('6. Business travel')).toBeInTheDocument()
  expect(screen.getByText(/Other scope 3 categories are immaterial/)).toBeInTheDocument()

  const exclusions = screen.getByRole('heading', { name: /^09exclusions$/i }).closest('div')!
  // operations left out of the boundary come first, with the reason Chapter 9 asks for (spec 07.2)
  expect(within(exclusions).getByText(/Operations excluded from the boundary/)).toBeInTheDocument()
  expect(within(exclusions).getByText('Takoradi Port Loadout')).toBeInTheDocument()
  expect(within(exclusions).getByText('Associate: no operational control')).toBeInTheDocument()
  expect(within(exclusions).getByText(/Methodology exclusion/)).toBeInTheDocument()
  expect(within(exclusions).getByText('ANFO explosives consumed')).toBeInTheDocument()
  expect(within(exclusions).getByText(/Outside boundary/)).toBeInTheDocument()
  expect(
    within(exclusions).getByText('Sankofa Gold plc: member from 2025-07-01'),
  ).toBeInTheDocument()
  // base year not designated: the report says so and links to the page
  expect(screen.getByText(/No base year designated/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Base year' })).toHaveAttribute(
    'href',
    '/app/ghg/org-1/base-year',
  )
})

test('prints the base year with its reason, convention and the profile over time', async () => {
  vi.mocked(getReport).mockResolvedValue({
    ...report,
    baseYear: {
      year: 2024,
      inventoryName: '2024 Base Year',
      inventoryId: 'inv-2024',
      thresholdPercent: 5,
      reason: 'First year with metered data for every site',
      structuralChangeConvention: 'TRANSACTION_DATE',
      gwpSetMatches: false,
      originalBase: {
        runId: 'run-base',
        label: 'Base 2024',
        totalKgCo2e: 27930,
        scope1KgCo2e: 27930,
        scope2KgCo2e: 0,
        scope3KgCo2e: 0,
      },
      recalculations: [],
      profile: [
        {
          inventoryId: 'inv-2024',
          name: '2024 Base Year',
          year: 2024,
          periodStart: '2024-01-01',
          periodEnd: '2024-12-31',
          status: 'FINAL',
          finalRunId: 'run-base',
          totalKgCo2e: 27930,
          recalculatedRunId: 'run-restated',
          recalculatedTotalKgCo2e: 27000,
        },
        {
          inventoryId: 'inv-1',
          name: '2025 Corporate Inventory',
          year: 2025,
          periodStart: '2025-01-01',
          periodEnd: '2025-12-31',
          status: 'FROZEN',
          finalRunId: null,
          totalKgCo2e: null,
          recalculatedRunId: null,
          recalculatedTotalKgCo2e: null,
        },
      ],
    },
  })
  renderRunDetailPage()

  expect(await screen.findByText(/First year with metered data for every site/)).toBeInTheDocument()
  expect(screen.getByText(/From the transaction date/)).toBeInTheDocument()
  expect(screen.getByText(/different GWP sets/)).toBeInTheDocument()
  const profile = screen.getByText(/Emissions profile over time/).closest('div')!
  expect(within(profile).getByText('2024 Base Year').closest('tr')).toHaveTextContent(
    /27\.93 t CO₂e.*27 t CO₂e/,
  )
  expect(within(profile).getByText('2025 Corporate Inventory').closest('tr')).toHaveTextContent(
    /not yet final/,
  )
})

test('a run older than boundary versioning says so instead of citing one', async () => {
  vi.mocked(getReport).mockResolvedValue({
    ...report,
    company: { ...report.company, boundaryVersion: null },
    run: { ...report.run, boundaryVersionId: null, boundaryVersionNo: null },
  })
  renderRunDetailPage()

  expect(await screen.findByRole('heading', { name: 'Run 001' })).toBeInTheDocument()
  expect(screen.getByText(/predates boundary versioning/)).toBeInTheDocument()
  expect(vi.mocked(getBoundaryVersion)).not.toHaveBeenCalled()
})
