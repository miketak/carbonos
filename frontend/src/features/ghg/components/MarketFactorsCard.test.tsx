import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../../test/utils'
import { MarketFactorsCard } from './MarketFactorsCard'
import type { Facility, Inventory, MarketFactor } from '../api'

vi.mock('../api', () => import('../testApiMock'))

// typing into five fields through userEvent takes long under parallel jsdom workers on a loaded machine
// the criteria checklist is eight selects on top of the form: slow under parallel jsdom workers
vi.setConfig({ testTimeout: 60000 })

import { listFacilities, listMarketFactors, setMarketFactor } from '../api'

const inventory: Inventory = {
  id: 'inv-1',
  organizationId: 'org-1',
  name: 'FY2025',
  periodStart: '2025-01-01',
  periodEnd: '2025-12-31',
  purpose: null,
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
  finalRunId: null,
  status: 'DRAFT',
  supersededById: null,
  copiedFromId: null,
  correctionReason: null,
  publishedAt: null,
  currentBoundaryVersionId: null,
  currentBoundaryVersionNo: null,
  createdAt: '2026-09-01T10:00:00Z',
}

const facilities: Facility[] = [
  {
    id: 'fac-1',
    name: 'Obuom Processing Plant',
    location: 'Obuom',
    country: null,
    gridRegion: null,
    effectiveGridRegion: null,
    facilityType: null,
    leaseType: null,
    leaseFrom: null,
    leaseTo: null,
    entityId: 'ent-1',
    entityName: 'Asante Gold Resources',
    relationshipType: 'SUBSIDIARY',
    createdAt: '2026-09-01T10:00:00Z',
  },
]

const ppa: MarketFactor = {
  id: 'mf-1',
  facilityId: 'fac-1',
  facilityName: 'Obuom Processing Plant',
  instrumentType: 'CONTRACT',
  kgCo2ePerKwh: 0,
  source: 'Obuom solar PPA 2025',
  meetsQualityCriteria: true,
  qualityNotes: null,
  criteria: [
    'CONVEYS_ATTRIBUTE',
    'UNIQUE_CLAIM',
    'RETIRED_FOR_COMPANY',
    'VINTAGE_MATCHES',
    'SAME_MARKET',
    'SUPPLIER_FACTOR_NET',
    'RESIDUAL_MIX_FOR_BALANCE',
    'DOCUMENTED',
  ].map((code) => ({ code, title: code, answer: 'MET' as const })),
  unansweredCount: 0,
  notMetCount: 0,
  certificateId: 'IREC-GH-2025-0417',
  registry: 'I-TRACK',
  vintage: 2025,
  retirementDate: '2026-01-15',
  coveredKwh: 20000000,
  periodStart: null,
  periodEnd: '2025-12-31',
}

beforeEach(() => {
  vi.mocked(listFacilities).mockReset().mockResolvedValue(facilities)
  vi.mocked(listMarketFactors).mockReset().mockResolvedValue([])
  vi.mocked(setMarketFactor).mockReset().mockResolvedValue(ppa)
})

test('records the megawatt-hours an instrument covers, in kWh, and always offers the residual mix', async () => {
  const user = userEvent.setup()
  renderWithProviders(<MarketFactorsCard organizationId="org-1" inventory={inventory} />)

  // spec 07.3: every run reports market-based, so the disclosure is offered before any instrument exists
  expect(await screen.findByLabelText(/Residual mix available/)).toBeInTheDocument()
  expect(
    await screen.findByText(/No instruments recorded: the market-based figure/),
  ).toBeInTheDocument()

  await user.type(screen.getByLabelText(/^kg CO₂e per kWh/), '0')
  await user.type(screen.getByLabelText(/^Source/), 'Obuom solar PPA 2025')
  await user.type(screen.getByLabelText(/Covered quantity \(MWh\)/), '20000')
  await user.type(screen.getByLabelText(/Covers to/), '2025-12-31')
  await user.click(screen.getByRole('button', { name: 'Add instrument' }))

  await waitFor(() => expect(setMarketFactor).toHaveBeenCalled())
  expect(vi.mocked(setMarketFactor).mock.calls[0][2]).toMatchObject({
    coveredKwh: 20000000,
    periodStart: undefined,
    periodEnd: '2025-12-31',
  })
})

test('a negative factor gets an inline message and sends nothing (ticket T-24)', async () => {
  const user = userEvent.setup()
  renderWithProviders(<MarketFactorsCard organizationId="org-1" inventory={inventory} />)
  await screen.findByText(/No instruments recorded: the market-based figure/)

  const factor = screen.getByLabelText(/^kg CO₂e per kWh/)
  await user.type(factor, '-0.1')
  await user.type(screen.getByLabelText(/^Source/), 'Obuom solar PPA 2025')
  await user.type(screen.getByLabelText(/Covered quantity \(MWh\)/), '20000')
  await user.click(screen.getByRole('button', { name: 'Add instrument' }))

  expect(await screen.findByText('kg CO₂e per kWh must be 0 or more.')).toBeInTheDocument()
  expect(factor).toHaveAttribute('aria-invalid', 'true')
  expect(setMarketFactor).not.toHaveBeenCalled()
})

test('lists what each instrument covers and its period', async () => {
  vi.mocked(listMarketFactors).mockResolvedValue([ppa])
  renderWithProviders(<MarketFactorsCard organizationId="org-1" inventory={inventory} />)

  expect(await screen.findByText('20,000 MWh')).toBeInTheDocument()
  expect(screen.getByText('2025-01-01 → 2025-12-31')).toBeInTheDocument()
})

test('answers the eight criteria one at a time and records the certificate (spec 07.6)', async () => {
  const user = userEvent.setup()
  renderWithProviders(<MarketFactorsCard organizationId="org-1" inventory={inventory} />)

  await screen.findByLabelText(/Residual mix available/)
  await screen.findByText(/No instruments recorded: the market-based figure/)
  await user.type(screen.getByLabelText(/^kg CO₂e per kWh/), '0')
  await user.type(screen.getByLabelText(/^Source/), 'I-REC(E) Ghana 2025')
  await user.type(screen.getByLabelText(/Covered quantity \(MWh\)/), '10')
  await user.type(screen.getByLabelText('Certificate or contract reference'), 'IREC-GH-2025-0417')
  await user.type(screen.getByLabelText('Registry'), 'I-TRACK')
  await user.type(screen.getByLabelText('Vintage (year)'), '2025')
  for (let i = 1; i <= 8; i++) {
    await user.selectOptions(screen.getByLabelText(`Criterion ${i}`), i === 3 ? 'false' : 'true')
  }
  await user.click(screen.getByRole('button', { name: 'Add instrument' }))

  await waitFor(() => expect(setMarketFactor).toHaveBeenCalled())
  expect(vi.mocked(setMarketFactor).mock.calls[0][2]).toMatchObject({
    criteria: [true, true, false, true, true, true, true, true],
    certificateId: 'IREC-GH-2025-0417',
    registry: 'I-TRACK',
    vintage: 2025,
  })
})

test('editing a recorded instrument loads it into the form and saving replaces it', async () => {
  const user = userEvent.setup()
  vi.mocked(listMarketFactors).mockResolvedValue([ppa])
  renderWithProviders(<MarketFactorsCard organizationId="org-1" inventory={inventory} />)

  await user.click(
    await screen.findByRole('button', { name: 'Edit instrument for Obuom Processing Plant' }),
  )
  expect(screen.getByLabelText('Source')).toHaveValue('Obuom solar PPA 2025')
  expect(screen.getByLabelText('Covered quantity (MWh)')).toHaveValue(20000)
  expect(screen.getByLabelText('Certificate or contract reference')).toHaveValue(
    'IREC-GH-2025-0417',
  )
  expect(screen.getByLabelText('Criterion 3')).toHaveValue('true')

  await user.clear(screen.getByLabelText('Covered quantity (MWh)'))
  await user.type(screen.getByLabelText('Covered quantity (MWh)'), '60000')
  await user.click(screen.getByRole('button', { name: 'Add instrument' }))
  await waitFor(() => expect(setMarketFactor).toHaveBeenCalledTimes(1))
  expect(vi.mocked(setMarketFactor).mock.calls[0][1]).toBe('fac-1')
  expect(vi.mocked(setMarketFactor).mock.calls[0][2]).toMatchObject({
    source: 'Obuom solar PPA 2025',
    coveredKwh: 60000000,
    certificateId: 'IREC-GH-2025-0417',
    retirementDate: '2026-01-15',
  })
})
