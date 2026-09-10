import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { EmissionFactorsPage } from './EmissionFactorsPage'
import type { EmissionFactor, FactorPack } from './api'

vi.mock('./api', () => import('./testApiMock'))

import { importFactorPack, listEmissionFactors, listFactorPacks, setFactorApproval } from './api'

const diesel: EmissionFactor = {
  id: 'f-1',
  organizationId: null,
  name: 'Diesel (100% mineral diesel)',
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
  source: 'UK Government GHG Conversion Factors for Company Reporting 2025, Fuels, Diesel',
  sourceUrl: 'https://www.gov.uk/example',
  publicationYear: 2025,
  dataYear: 2025,
  validFrom: null,
  validTo: null,
  note: null,
  approved: true,
  pack: null,
  packCode: null,
  gridRegion: null,
}

const hfo: EmissionFactor = {
  ...diesel,
  id: 'f-2',
  organizationId: 'org-1',
  name: 'Heavy fuel oil (GOIL analysis 2025)',
  unit: 'tonne',
  kgCo2ePerUnit: 3230,
  source: 'GOIL fuel analysis certificate 2025-03',
  sourceUrl: null,
  validFrom: '2025-01-01',
  validTo: '2025-12-31',
  approved: false,
  pack: 'sector-mining',
  packCode: 'X',
  gridRegion: null,
}

const pack: FactorPack = {
  id: 'sector-mining',
  name: 'Sector pack: mining (Ghana and West Africa)',
  source: 'Selection from the DEFRA 2026, EPA Hub 2025, IPCC 2006 and NGA 2024 packs',
  sourceUrl: '',
  publicationYear: 2026,
  gwpBasis: 'AR5',
  license: 'See each factor',
  retrieved: '2026-09-09',
  factorCount: 53,
  notes: 'Fuels, explosives, lime, refrigerants, grid power.',
}

beforeEach(() => {
  vi.mocked(listEmissionFactors).mockReset().mockResolvedValue([diesel, hfo])
  vi.mocked(listFactorPacks).mockReset().mockResolvedValue([pack])
  vi.mocked(importFactorPack)
    .mockReset()
    .mockResolvedValue({ pack: 'sector-mining', created: 53, updated: 0 })
  vi.mocked(setFactorApproval)
    .mockReset()
    .mockResolvedValue({ ...hfo, approved: true })
})

function renderPage() {
  return renderWithProviders(<EmissionFactorsPage />, {
    route: '/app/ghg/org-1/factors',
    path: '/app/ghg/:organizationId/factors',
  })
}

test('lists the shared library and the organization factors with their provenance and approval', async () => {
  renderPage()

  expect(await screen.findByText('Heavy fuel oil (GOIL analysis 2025)')).toBeInTheDocument()
  const ownRow = screen.getByText('Heavy fuel oil (GOIL analysis 2025)').closest('tr')!
  expect(
    within(ownRow).getByText(
      /GOIL fuel analysis certificate 2025-03, published 2025, valid 2025-01-01 to 2025-12-31/,
    ),
  ).toBeInTheDocument()
  expect(within(ownRow).getByText('Not approved')).toBeInTheDocument()
  expect(within(ownRow).getByText('pack sector-mining')).toBeInTheDocument()
  const libraryRow = screen.getByText('Diesel (100% mineral diesel)').closest('tr')!
  expect(within(libraryRow).getByText('Approved')).toBeInTheDocument()
  expect(within(libraryRow).queryByRole('button')).not.toBeInTheDocument()
  expect(within(libraryRow).getByText(/CH₄ 0\.0001 \(fossil\)/)).toBeInTheDocument()
})

test('imports a pack and approves a factor', async () => {
  const user = userEvent.setup()
  renderPage()

  await user.click(await screen.findByRole('button', { name: /^Import pack/ }))
  await waitFor(() => expect(importFactorPack).toHaveBeenCalledWith('org-1', 'sector-mining'))
  expect(await screen.findByText(/53 factors added, 0 updated/)).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Approve' }))
  await waitFor(() => expect(setFactorApproval).toHaveBeenCalledWith('f-2', true))
})
