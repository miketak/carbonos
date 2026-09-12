import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { EmissionFactorsPage } from './EmissionFactorsPage'
import type { EmissionFactor, FactorPack, Organization } from './api'

vi.mock('./api', () => import('./testApiMock'))

import {
  getOrganization,
  importFactorPack,
  listEmissionFactors,
  listFactorPacks,
  setFactorApproval,
} from './api'

const organization: Organization = {
  id: 'org-1',
  name: 'Sankofa Gold plc',
  myRole: 'OWNER',
  address: null,
  contact: null,
  facilityCount: 2,
  supportAccess: [],
  createdAt: '2026-08-01T00:00:00Z',
}

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
  packs: [],
  packCode: null,
  gridRegion: null,
  reportingBasis: 'SCOPES',
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
  packs: ['refrigerants-ar5', 'sector-mining'],
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
  vi.mocked(getOrganization).mockReset()
  vi.mocked(importFactorPack)
    .mockReset()
    .mockResolvedValue({ pack: 'sector-mining', created: 53, updated: 0, tagged: 3 })
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
  // spec 02.3: the packs that delivered the row stand in a column of their own, apart from the source
  const packTags = within(ownRow).getAllByTitle('Delivered by a factor pack')
  expect(packTags.map((tag) => tag.textContent)).toEqual(['refrigerants-ar5', 'sector-mining'])
  expect(within(ownRow).queryByText(/GOIL.*sector-mining/)).not.toBeInTheDocument()
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
  expect(
    await screen.findByText(
      /53 factors added, 0 updated, 3 already held from another pack and tagged/,
    ),
  ).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Approve' }))
  await waitFor(() => expect(setFactorApproval).toHaveBeenCalledWith('f-2', true))
})

test('a gas outside the scopes is marked on the page and can be chosen on the add form (spec 02.4)', async () => {
  const user = userEvent.setup()
  vi.mocked(listEmissionFactors).mockResolvedValue([
    diesel,
    { ...hfo, id: 'f-3', name: 'HCFC-22 (R-22)', reportingBasis: 'OUTSIDE_SCOPES_NON_KYOTO' },
  ])
  renderPage()

  const row = (await screen.findByText('HCFC-22 (R-22)')).closest('tr')!
  expect(
    within(row).getByText('Outside the scopes (Montreal Protocol, not a Kyoto gas)'),
  ).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /^add factor$/i }))
  const basis = await screen.findByLabelText('Reporting basis')
  expect(basis).toHaveValue('SCOPES')
  await user.selectOptions(basis, 'OUTSIDE_SCOPES_NON_KYOTO')
  expect(basis).toHaveValue('OUTSIDE_SCOPES_NON_KYOTO')
})

test('a verifier sees Add factor, Import pack, Approve and Delete disabled with the role they need (spec 01.4)', async () => {
  vi.mocked(getOrganization).mockResolvedValue({ ...organization, myRole: 'VERIFIER' })
  renderPage()

  const addFactor = await screen.findByRole('button', { name: /^add factor$/i })
  await waitFor(() => expect(addFactor).toBeDisabled())
  expect(addFactor).toHaveAttribute('title', 'Needs the Preparer, Reviewer or Owner role.')
  expect(addFactor).toHaveAccessibleDescription('Needs the Preparer, Reviewer or Owner role.')

  const importButton = await screen.findByRole('button', { name: /^Import pack/ })
  expect(importButton).toBeDisabled()

  const ownRow = (await screen.findByText('Heavy fuel oil (GOIL analysis 2025)')).closest('tr')!
  expect(within(ownRow).getByRole('button', { name: /approve/i })).toBeDisabled()
  expect(within(ownRow).getByRole('button', { name: /delete factor/i })).toBeDisabled()
})

test('a preparer can add, import, approve and delete factors (spec 01.4)', async () => {
  vi.mocked(getOrganization).mockResolvedValue({ ...organization, myRole: 'PREPARER' })
  renderPage()

  const addFactor = await screen.findByRole('button', { name: /^add factor$/i })
  await waitFor(() => expect(addFactor).toBeEnabled())

  const importButton = await screen.findByRole('button', { name: /^Import pack/ })
  expect(importButton).toBeEnabled()

  const ownRow = (await screen.findByText('Heavy fuel oil (GOIL analysis 2025)')).closest('tr')!
  expect(within(ownRow).getByRole('button', { name: /approve/i })).toBeEnabled()
  expect(within(ownRow).getByRole('button', { name: /delete factor/i })).toBeEnabled()
})
