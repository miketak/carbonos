import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../../test/utils'
import { MarketFactorsCard } from './MarketFactorsCard'
import type { Facility, Inventory, MarketFactor } from '../api'

vi.mock('../api', () => import('../testApiMock'))

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
  createdAt: '2026-09-01T10:00:00Z',
}

const facilities: Facility[] = [
  {
    id: 'fac-1',
    name: 'Obuom Processing Plant',
    location: 'Obuom',
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

test('lists what each instrument covers and its period', async () => {
  vi.mocked(listMarketFactors).mockResolvedValue([ppa])
  renderWithProviders(<MarketFactorsCard organizationId="org-1" inventory={inventory} />)

  expect(await screen.findByText('20,000 MWh')).toBeInTheDocument()
  expect(screen.getByText('2025-01-01 → 2025-12-31')).toBeInTheDocument()
})
