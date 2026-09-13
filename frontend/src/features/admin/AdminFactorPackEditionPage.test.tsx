import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { AdminFactorPackEditionPage } from './AdminFactorPackEditionPage'
import type { FactorPackEdition, FactorPackRow, FactorPackRowPage } from './api'

vi.mock('./api', () => ({
  listFactorPacks: vi.fn(),
  createFactorPackFamily: vi.fn(),
  createFactorPackEdition: vi.fn(),
  getFactorPackEdition: vi.fn(),
  updateFactorPackEdition: vi.fn(),
  deleteFactorPackEdition: vi.fn(),
  listFactorPackRows: vi.fn(),
  createFactorPackRow: vi.fn(),
  updateFactorPackRow: vi.fn(),
  deleteFactorPackRow: vi.fn(),
  getFactorPackValidation: vi.fn(),
}))
vi.mock('../auth/api', () => ({ login: vi.fn(), logout: vi.fn(), me: vi.fn() }))

import {
  deleteFactorPackEdition,
  deleteFactorPackRow,
  getFactorPackEdition,
  getFactorPackValidation,
  listFactorPackRows,
} from './api'

const draft: FactorPackEdition = {
  editionId: 'defra-2027',
  packKey: 'defra',
  name: 'UK Government (DESNZ) GHG conversion factors 2027',
  status: 'DRAFT',
  source: 'UK Government (DESNZ) GHG Conversion Factors for Company Reporting, flat file',
  sourceUrl: 'https://example.test/defra-2027.xlsx',
  publicationYear: 2027,
  gwpBasis: 'AR5',
  license: 'Open Government Licence v3.0',
  retrieved: '2027-01-04',
  notes: null,
  appliesFrom: '2027-01-01',
  publishedAt: null,
  sourceDocument: null,
  evidenceChecksum: null,
  curator: 'Ama Mensah',
  approver: null,
  provenanceReview: 'REVIEWED',
  provenanceNote: null,
  mutable: true,
  rowCount: 2,
  holderCount: 0,
}

const row: FactorPackRow = {
  id: 'row-1',
  editionId: 'defra-2027',
  ordinal: 1,
  code: 'DEFRA:Fuels:Gaseous_fuels_Butane:tonnes',
  name: 'Gaseous fuels: Butane',
  defaultScope: 'SCOPE_1',
  defaultCategory: 'STATIONARY_COMBUSTION',
  scopeAgnostic: true,
  unit: 'tonne',
  kgCo2ePerUnit: 3033.38067,
  co2KgPerUnit: 3029.26,
  ch4KgPerUnit: 0.09,
  ch4Fossil: true,
  n2oKgPerUnit: 0.00604026,
  hfcsKgPerUnit: null,
  pfcsKgPerUnit: null,
  sf6KgPerUnit: null,
  nf3KgPerUnit: null,
  biogenicCo2KgPerUnit: null,
  blendComposition: null,
  blendGwpSource: null,
  dataYear: 2027,
  sourcePublication: 'UK Government (DESNZ) GHG Conversion Factors for Company Reporting',
  sourceUrl: 'https://example.test/defra-2027.xlsx',
  publicationYear: 2027,
  sourceCategory: 'Fuels',
  sourceActivity: 'Gaseous fuels / Butane',
  sourceDetail: null,
  co2eOnly: false,
  approved: true,
  notes: null,
  reportingBasis: 'SCOPES',
}

const rowPage: FactorPackRowPage = {
  items: [row],
  page: 0,
  size: 50,
  total: 1,
  categories: ['Fuels', 'Waste disposal'],
  activities: ['Gaseous fuels / Butane'],
  units: ['tonne'],
}

beforeEach(() => {
  vi.mocked(getFactorPackEdition).mockReset().mockResolvedValue(draft)
  vi.mocked(listFactorPackRows).mockReset().mockResolvedValue(rowPage)
  vi.mocked(getFactorPackValidation).mockReset().mockResolvedValue([])
  vi.mocked(deleteFactorPackRow).mockReset()
  vi.mocked(deleteFactorPackEdition).mockReset()
})

function renderPage(editionId = 'defra-2027') {
  return renderWithProviders(<AdminFactorPackEditionPage />, {
    route: `/admin/factor-packs/${editionId}`,
    path: '/admin/factor-packs/:editionId',
    extraRoutes: [{ path: '/admin/factor-packs', element: <p>The catalogue</p> }],
  })
}

test('the workbench opens on the rows, with the tabs the edition has', async () => {
  renderPage()

  expect(await screen.findByRole('heading', { name: 'defra-2027' })).toBeInTheDocument()
  expect(screen.getByText('DRAFT')).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /rows 2/i })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tab', { name: /metadata/i })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /validation/i })).toBeInTheDocument()
  expect(await screen.findByText('DEFRA:Fuels:Gaseous_fuels_Butane:tonnes')).toBeInTheDocument()
})

test('the rows are filtered by a search term and by the publisher category', async () => {
  const user = userEvent.setup()
  renderPage()

  await screen.findByText('DEFRA:Fuels:Gaseous_fuels_Butane:tonnes')
  await user.selectOptions(screen.getByLabelText(/publisher's category/i), 'Fuels')
  await waitFor(() =>
    expect(listFactorPackRows).toHaveBeenCalledWith(
      'defra-2027',
      expect.objectContaining({ sourceCategory: 'Fuels' }),
    ),
  )

  await user.type(screen.getByLabelText(/^search$/i), 'butane')
  await waitFor(() =>
    expect(listFactorPackRows).toHaveBeenCalledWith(
      'defra-2027',
      expect.objectContaining({ search: 'butane' }),
    ),
  )
})

test('the validation tab names every broken rule with the rows that break it', async () => {
  const user = userEvent.setup()
  vi.mocked(getFactorPackValidation).mockResolvedValue([
    { rule: 'code', code: 'tdlosses', message: 'The code needs two or more segments.' },
    { rule: 'unit', code: 'TEST:widgets', message: "'widgets' is not a registered unit." },
    { rule: 'unit', code: 'TEST:crates', message: "'crates' is not a registered unit." },
  ])
  renderPage()

  await user.click(await screen.findByRole('tab', { name: /validation 3/i }))
  expect(
    await screen.findByRole('heading', { name: /the code names the publication and the row/i }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('heading', { name: /the unit is one the registry knows/i }),
  ).toBeInTheDocument()
  expect(screen.getByText('tdlosses')).toBeInTheDocument()
  expect(screen.getByText('TEST:crates')).toBeInTheDocument()
  expect(screen.getByText(/3 rows break a publication rule/i)).toBeInTheDocument()
})

test('an edition with no broken rule says so', async () => {
  const user = userEvent.setup()
  renderPage()

  await user.click(await screen.findByRole('tab', { name: /validation/i }))
  expect(await screen.findByRole('heading', { name: /every rule passes/i })).toBeInTheDocument()
})

test('a row of a draft is deleted after a confirmation', async () => {
  const user = userEvent.setup()
  vi.mocked(deleteFactorPackRow).mockResolvedValue(undefined)
  renderPage()

  await user.click(
    await screen.findByRole('button', { name: /delete DEFRA:Fuels:Gaseous_fuels_Butane:tonnes/i }),
  )
  const dialog = await screen.findByRole('dialog', { name: /delete DEFRA:Fuels/i })
  await user.click(within(dialog).getByRole('button', { name: /delete row/i }))

  await waitFor(() => expect(deleteFactorPackRow).toHaveBeenCalledWith('defra-2027', 'row-1'))
})

test('a draft is deleted and the browser returns to the catalogue', async () => {
  const user = userEvent.setup()
  vi.mocked(deleteFactorPackEdition).mockResolvedValue(undefined)
  renderPage()

  await user.click(await screen.findByRole('button', { name: /delete draft/i }))
  const dialog = await screen.findByRole('dialog', { name: /delete defra-2027/i })
  expect(within(dialog).getByText(/clause 8.2/i)).toBeInTheDocument()
  await user.click(within(dialog).getByRole('button', { name: /delete draft/i }))

  await waitFor(() => expect(deleteFactorPackEdition).toHaveBeenCalledWith('defra-2027'))
  expect(await screen.findByText('The catalogue')).toBeInTheDocument()
})

test('a published edition offers no authoring, and says why', async () => {
  vi.mocked(getFactorPackEdition).mockResolvedValue({
    ...draft,
    editionId: 'defra-2026',
    status: 'PUBLISHED',
    mutable: false,
    holderCount: 3,
  })
  renderPage('defra-2026')

  expect(await screen.findByText('PUBLISHED')).toBeInTheDocument()
  expect(screen.getByText(/never change again/i)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /add row/i })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /delete draft/i })).not.toBeInTheDocument()
  expect(await screen.findByRole('button', { name: /edit DEFRA:Fuels/i })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /delete DEFRA:Fuels/i })).not.toBeInTheDocument()
})
