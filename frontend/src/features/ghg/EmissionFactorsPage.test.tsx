import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { EmissionFactorsPage } from './EmissionFactorsPage'
import type { EmissionFactor, FactorPack, Organization } from './api'

vi.mock('./api', () => import('./testApiMock'))

import { listEmissionFactors, mockEmissionFactors } from './testApiMock'

import {
  getOrganization,
  importFactorPack,
  listFactorPacks,
  listPackRows,
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
  organizationId: 'org-1',
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
  sourceCategory: null,
  sourceActivity: null,
  sourceDetail: null,
  sourceEdition: null,
  locallyEdited: false,
  supersededById: null,
  versions: [],
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
  pack: 'defra-2026',
  packs: ['defra-2026', 'ghana'],
  packCode: 'X',
  gridRegion: null,
  sourceEdition: 'defra-2026',
}

/** A factor entered by hand: the only kind that can be deleted (spec 02.6). */
const supplier: EmissionFactor = {
  ...diesel,
  id: 'f-9',
  organizationId: 'org-1',
  name: 'Quicklime (supplier declaration 2026)',
  unit: 'tonne',
  kgCo2ePerUnit: 1200,
  source: 'Supplier environmental product declaration 2026',
  sourceUrl: null,
}

const pack: FactorPack = {
  id: 'defra-2026',
  name: 'UK Government (DESNZ) GHG conversion factors 2026',
  source: 'UK Government (DESNZ) GHG Conversion Factors for Company Reporting, flat file',
  sourceUrl: 'https://example.test/ghg-conversion-factors-2026.xlsx',
  publicationYear: 2026,
  gwpBasis: 'AR5',
  license: 'Open Government Licence v3.0',
  retrieved: '2026-09-08',
  factorCount: 53,
  notes: 'Fuels, explosives, lime, refrigerants, grid power.',
}

beforeEach(() => {
  mockEmissionFactors([diesel, hfo])
  vi.mocked(listFactorPacks).mockReset().mockResolvedValue([pack])
  vi.mocked(listPackRows)
    .mockReset()
    .mockResolvedValue({
      rows: [
        {
          code: 'DEFRA:Fuels:Gaseous_fuels_Butane:tonnes',
          name: 'Gaseous fuels: Butane',
          sourceCategory: 'Fuels',
          sourceActivity: 'Gaseous fuels / Butane',
          sourceDetail: null,
          unit: 'tonne',
          kgCo2ePerUnit: 3033.38067,
          defaultScope: 'SCOPE_1',
          defaultCategory: 'STATIONARY_COMBUSTION',
          reportingBasis: 'SCOPES',
          co2eOnly: false,
          approved: true,
        },
        {
          code: 'DEFRA:Fuels:Gaseous_fuels_Butane:litres',
          name: 'Gaseous fuels: Butane',
          sourceCategory: 'Fuels',
          sourceActivity: 'Gaseous fuels / Butane',
          sourceDetail: null,
          unit: 'litre',
          kgCo2ePerUnit: 1.74533,
          defaultScope: 'SCOPE_1',
          defaultCategory: 'STATIONARY_COMBUSTION',
          reportingBasis: 'SCOPES',
          co2eOnly: false,
          approved: true,
        },
      ],
      page: 0,
      size: 50,
      total: 2,
      categories: ['Fuels'],
    })
  vi.mocked(getOrganization).mockReset()
  vi.mocked(importFactorPack).mockReset().mockResolvedValue({
    edition: 'defra-2026',
    appliesFrom: '2026-01-01',
    created: 53,
    versioned: 0,
    tagged: 3,
    unchanged: 0,
    skippedUnits: [],
    conflicts: [],
    discontinued: [],
    splitPeriods: [],
  })
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

test('lists the organization factors with their provenance and approval', async () => {
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
  expect(packTags.map((tag) => tag.textContent)).toEqual(['defra-2026', 'ghana'])
  expect(within(ownRow).queryByText(/GOIL.*defra-2026/)).not.toBeInTheDocument()
  // spec 02.10: every row is the organization's, so a hand-entered one offers its actions
  const dieselRow = screen.getByText('Diesel (100% mineral diesel)').closest('tr')!
  expect(within(dieselRow).getByText('Approved')).toBeInTheDocument()
  expect(within(dieselRow).getByText(/CH₄ 0\.0001 \(fossil\)/)).toBeInTheDocument()
})

test('imports a pack and approves a factor', async () => {
  const user = userEvent.setup()
  renderPage()

  await user.click(await screen.findByRole('button', { name: /^Import pack/ }))
  await waitFor(() => expect(importFactorPack).toHaveBeenCalledWith('org-1', 'defra-2026'))
  expect(
    await screen.findByText(
      /defra-2026, applying from 2026-01-01: 53 added, 0 versioned, 3 tagged, 0 unchanged/,
    ),
  ).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Approve' }))
  await waitFor(() => expect(setFactorApproval).toHaveBeenCalledWith('f-2', true))
})

test('the import toast names the rows the registry could not convert (spec 02.6)', async () => {
  const user = userEvent.setup()
  vi.mocked(importFactorPack).mockResolvedValue({
    edition: 'defra-2026',
    appliesFrom: '2026-01-01',
    created: 51,
    versioned: 0,
    tagged: 3,
    unchanged: 0,
    skippedUnits: [
      { code: 'DEFRA:Fuels:Ore_hauled', unit: 'drum' },
      { code: 'DEFRA:Fuels:Lime_bagged', unit: 'bag' },
    ],
    conflicts: [],
    discontinued: [],
    splitPeriods: [],
  })
  renderPage()

  await user.click(await screen.findByRole('button', { name: /^Import pack/ }))
  expect(
    await screen.findByText(
      /2 rows skipped, in units the registry cannot convert: DEFRA:Fuels:Ore_hauled \(drum\), DEFRA:Fuels:Lime_bagged \(bag\)/,
    ),
  ).toBeInTheDocument()
})

test('a gas outside the scopes is marked on the page and can be chosen on the add form (spec 02.4)', async () => {
  const user = userEvent.setup()
  mockEmissionFactors([
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
  mockEmissionFactors([diesel, hfo, supplier])
  renderPage()

  const addFactor = await screen.findByRole('button', { name: /^add factor$/i })
  await waitFor(() => expect(addFactor).toBeDisabled())
  expect(addFactor).toHaveAttribute('title', 'Needs the Preparer, Reviewer or Owner role.')
  expect(addFactor).toHaveAccessibleDescription('Needs the Preparer, Reviewer or Owner role.')

  const importButton = await screen.findByRole('button', { name: /^Import pack/ })
  expect(importButton).toBeDisabled()

  const ownRow = (await screen.findByText('Heavy fuel oil (GOIL analysis 2025)')).closest('tr')!
  expect(within(ownRow).getByRole('button', { name: /approve/i })).toBeDisabled()
  // spec 02.6: a pack-derived factor is never deleted, so the row offers retirement instead
  expect(within(ownRow).getByText('Retire, not delete')).toBeInTheDocument()
  const handRow = screen.getByText('Quicklime (supplier declaration 2026)').closest('tr')!
  expect(within(handRow).getByRole('button', { name: /delete factor/i })).toBeDisabled()
})

test('a preparer can add, import, approve and delete factors (spec 01.4)', async () => {
  vi.mocked(getOrganization).mockResolvedValue({ ...organization, myRole: 'PREPARER' })
  mockEmissionFactors([diesel, hfo, supplier])
  renderPage()

  const addFactor = await screen.findByRole('button', { name: /^add factor$/i })
  await waitFor(() => expect(addFactor).toBeEnabled())

  const importButton = await screen.findByRole('button', { name: /^Import pack/ })
  expect(importButton).toBeEnabled()

  const ownRow = (await screen.findByText('Heavy fuel oil (GOIL analysis 2025)')).closest('tr')!
  expect(within(ownRow).getByRole('button', { name: /approve/i })).toBeEnabled()
  const handRow = screen.getByText('Quicklime (supplier declaration 2026)').closest('tr')!
  expect(within(handRow).getByRole('button', { name: /delete factor/i })).toBeEnabled()
})

test('the search, the taxonomy filters and the pager run on the server (FU-03)', async () => {
  const user = userEvent.setup()
  // an imported edition is thousands of rows; the page must never hold them all
  const rows = Array.from({ length: 120 }, (_, index) => ({
    ...hfo,
    id: `f-row-${index}`,
    name: `Gaseous fuels: Butane ${index}`,
    sourceCategory: index % 2 === 0 ? 'Fuels' : 'WTT- fuels',
    sourceActivity: 'Gaseous fuels / Butane',
    sourceDetail: null,
  }))
  // spec 02.10: one tier, so the page holds exactly what the organization owns
  mockEmissionFactors(rows)
  renderPage()

  // the organization's table shows one page of the total, and says what the total is
  expect(await screen.findByText('120 factors')).toBeInTheDocument()
  await waitFor(() =>
    expect(listEmissionFactors).toHaveBeenCalledWith(
      'org-1',
      expect.objectContaining({ page: 0, size: 50 }),
    ),
  )
  expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()

  // the publisher's taxonomy is shown beside the name, because 1,157 DEFRA rows share one
  expect(screen.getAllByText('Fuels / Gaseous fuels / Butane').length).toBeGreaterThan(0)

  // and choosing a published category narrows on the server, back at the first page
  await user.selectOptions(await screen.findByLabelText('Published category'), 'WTT- fuels')
  await waitFor(() =>
    expect(listEmissionFactors).toHaveBeenCalledWith(
      'org-1',
      expect.objectContaining({ sourceCategory: 'WTT- fuels', page: 0 }),
    ),
  )
  expect(await screen.findByText('60 factors match')).toBeInTheDocument()

  // the search goes to the server too, never to a list the browser already holds
  await user.type(screen.getByLabelText('Search factors'), 'butane 7')
  await waitFor(() =>
    expect(listEmissionFactors).toHaveBeenCalledWith(
      'org-1',
      expect.objectContaining({ q: 'butane 7' }),
    ),
  )
})

test('a lineage with two vintages shows its version chain and the live one (spec 02.6)', async () => {
  const user = userEvent.setup()
  mockEmissionFactors([
    diesel,
    {
      ...hfo,
      id: 'f-4',
      name: 'Diesel (100% mineral diesel)',
      packCode: 'DEFRA:Fuels:Diesel',
      sourceEdition: 'defra-2027',
      validFrom: '2027-01-01',
      validTo: null,
      versions: [
        {
          id: 'v-1',
          sourceEdition: 'defra-2026',
          validFrom: '2026-01-01',
          validTo: '2026-12-31',
          kgCo2ePerUnit: 2.66,
          live: false,
          locallyEdited: false,
        },
        {
          id: 'f-4',
          sourceEdition: 'defra-2027',
          validFrom: '2027-01-01',
          validTo: null,
          kgCo2ePerUnit: 2.8,
          live: true,
          locallyEdited: false,
        },
      ],
    },
  ])
  renderPage()

  await user.click(await screen.findByText('2 versions of this factor'))
  expect(screen.getByText(/defra-2026, 2026-01-01 to 2026-12-31, 2.66/)).toBeInTheDocument()
  expect(screen.getByText(/defra-2027, 2027-01-01 to open, 2.8 \(live\)/)).toBeInTheDocument()
})

test('a locally edited row is marked, so a preparer knows an import will leave it alone (spec 02.6)', async () => {
  mockEmissionFactors([diesel, { ...hfo, locallyEdited: true }])
  renderPage()

  const ownRow = (await screen.findByText('Heavy fuel oil (GOIL analysis 2025)')).closest('tr')!
  expect(within(ownRow).getByText('Locally edited')).toBeInTheDocument()
})

test('the import toast names conflicts, discontinued lineages and a split period (spec 02.6)', async () => {
  const user = userEvent.setup()
  vi.mocked(importFactorPack).mockResolvedValue({
    edition: 'defra-2027',
    appliesFrom: '2027-01-01',
    created: 12,
    versioned: 340,
    tagged: 4,
    unchanged: 1512,
    skippedUnits: [],
    conflicts: ['DEFRA:Fuels:Diesel'],
    discontinued: ['DEFRA:Retired_row:tonnes'],
    splitPeriods: [{ inventoryId: 'inv-1', name: 'FY2027' }],
  })
  renderPage()

  await user.click(await screen.findByRole('button', { name: /^Import pack/ }))
  const toast = await screen.findByText(/340 versioned/)
  expect(toast).toHaveTextContent('1 locally edited row left untouched: DEFRA:Fuels:Diesel.')
  expect(toast).toHaveTextContent(
    '1 lineage this edition drops, retired by nobody: DEFRA:Retired_row:tonnes.',
  )
  expect(toast).toHaveTextContent(
    'It applies inside FY2027, so that period would be calculated on two editions.',
  )
})

test("a pack's factors are read without importing it, and rows sharing a name are told apart (spec 02.8)", async () => {
  const user = userEvent.setup()
  renderPage()

  await user.click(
    await screen.findByRole('button', {
      name: /view the factors in uk government \(desnz\)/i,
    }),
  )

  const drawer = await screen.findByRole('dialog', { name: /uk government \(desnz\)/i })
  await waitFor(() => expect(listPackRows).toHaveBeenCalled())
  // the two Butane rows share a name and differ only by unit, so the unit and the value are shown
  expect(within(drawer).getAllByText('Gaseous fuels: Butane')).toHaveLength(2)
  // the unit and the value sit beside the name, so the disambiguator is never scrolled off
  expect(within(drawer).getByText('per tonne')).toBeInTheDocument()
  expect(within(drawer).getByText('per litre')).toBeInTheDocument()
  expect(within(drawer).getByText(/3033\.38067/)).toBeInTheDocument()
  expect(within(drawer).getByText(/1\.74533/)).toBeInTheDocument()
  // reading is not importing
  expect(importFactorPack).not.toHaveBeenCalled()
})
