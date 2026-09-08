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
      relationshipType: 'WHOLLY_OWNED',
      economicInterestPercent: 100,
      operatedByCompany: true,
      accountingShare: 1,
      table1Row: 'wholly owned operation or subsidiary; equity share: 100% economic interest',
      effectiveFrom: '2025-07-01',
      effectiveTo: null,
      excluded: false,
      exclusionReason: null,
      facilities: [{ facilityId: 'fac-2', facilityName: 'Nkran Camp', location: 'Ashanti' }],
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
    marketInstruments: [
      {
        id: 'mf-1',
        facilityId: 'fac-1',
        facilityName: 'Tema Plant',
        instrumentType: 'CERTIFICATE',
        kgCo2ePerKwh: 0.05,
        source: 'Supplier REC 2025',
      },
    ],
  },
  byGas: [
    { gas: 'CO2', kg: 1934.3, kgCo2e: 1934.3 },
    { gas: 'CH4', kg: 0.1, kgCo2e: 2.8 },
    { gas: 'N2O', kg: 0.04, kgCo2e: 10.6 },
    { gas: 'HFCs', kg: null, kgCo2e: 0 },
    { gas: 'PFCs', kg: null, kgCo2e: 0 },
    { gas: 'SF6', kg: 0, kgCo2e: 0 },
    { gas: 'NF3', kg: 0, kgCo2e: 0 },
  ],
  biogenicCo2Kg: 18000,
  baseYear: null,
  methodology: {
    gwpSet: 'AR5',
    consolidationApproach: 'EQUITY_SHARE',
    factorSources: ['Diesel', 'Grid electricity (Ghana)'],
    statement: 'Emissions were calculated as activity data multiplied by an emission factor.',
  },
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
        n2oKg: 0.04,
        hfcsKgCo2e: 0,
        pfcsKgCo2e: 0,
        sf6Kg: 0,
        nf3Kg: 0,
      },
      biogenicCo2Kg: 0,
      marketBasedKgCo2e: null,
      marketFactorKgCo2ePerKwh: null,
      marketInstrument: null,
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
      n2oKg: 0.04,
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
  expect(own).toHaveTextContent(/Wholly owned · member from 2025-07-01/)
  expect(own).toHaveTextContent(/Nkran Camp/)
  expect(own).toHaveTextContent(/100%.*Yes.*100%/)
  expect(vi.mocked(getBoundaryVersion)).toHaveBeenCalledWith('bv-1')
})

test('reports scope 2 market-based beside location-based, each gas, and biogenic CO2', async () => {
  renderRunDetailPage()

  const scopes = (await screen.findByRole('heading', { name: /emissions by scope/i })).closest(
    'div',
  )!
  expect(within(scopes).getByText('Scope 2, location-based').closest('tr')).toHaveTextContent(
    '882 kg CO₂e',
  )
  expect(within(scopes).getByText('Scope 2, market-based').closest('tr')).toHaveTextContent(
    '491 kg CO₂e',
  )
  expect(within(scopes).getByText(/Energy attribute certificate/)).toBeInTheDocument()

  const gases = screen.getByRole('heading', { name: /emissions by gas/i }).closest('div')!
  expect(within(gases).getByText('CO2')).toBeInTheDocument()
  expect(within(gases).getByText('CH4').closest('tr')).toHaveTextContent(/0\.1 kg.*2\.8 kg CO₂e/)
  expect(within(gases).getByText('N2O')).toBeInTheDocument()
  // zero gases are hidden; the HFC and PFC blends are explained
  expect(within(gases).queryByText('SF6')).not.toBeInTheDocument()
  expect(within(gases).getByText(/HFCs and PFCs are blends/)).toBeInTheDocument()

  expect(screen.getByText(/of biogenic CO₂, reported separately/)).toBeInTheDocument()
  expect(screen.getByText('18 t')).toBeInTheDocument()
})

test('prints the operational boundary declaration and the exclusions grouped by reason', async () => {
  renderRunDetailPage()

  expect(await screen.findByText('6. Business travel')).toBeInTheDocument()
  expect(screen.getByText(/Other scope 3 categories are immaterial/)).toBeInTheDocument()

  const exclusions = screen.getByRole('heading', { name: /^09exclusions$/i }).closest('div')!
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
