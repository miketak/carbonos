import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { AdminFactorPackEditionPage } from './AdminFactorPackEditionPage'
import type {
  BlastRadius,
  FactorPackChange,
  FactorPackEdition,
  FactorPackRow,
  FactorPackRowPage,
} from './api'

vi.mock('./api', () => ({
  getAccountsSummary: vi.fn().mockResolvedValue({
    usersTotal: 0,
    usersActive: 0,
    usersPending: 0,
    administrators: 1,
    accessRequestsPending: 0,
  }),
  getPlatformSummary: vi.fn().mockResolvedValue({
    organizations: 0,
    packFamilies: 0,
    publishedEditions: 0,
    draftEditionCount: 0,
    withdrawnEditions: 0,
    openNotices: 0,
    draftEditions: [],
    grants: [],
    recentActivity: [],
  }),
  getPlatformSettings: vi.fn().mockResolvedValue({
    supportAccessWindowHours: 24,
    organizationCreation: 'EVERYONE',
    updatedAt: '2026-09-14T00:00:00Z',
    updatedBy: null,
  }),
  updatePlatformSettings: vi.fn(),
  listPlatformSettingChanges: vi.fn().mockResolvedValue([]),
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
  listFactorPackChanges: vi.fn(),
  listFactorPackEvents: vi.fn(),
  getFactorPackBlastRadius: vi.fn(),
  uploadFactorPackEvidence: vi.fn(),
  publishFactorPackEdition: vi.fn(),
  withdrawFactorPackEdition: vi.fn(),
}))
vi.mock('../auth/api', () => ({ login: vi.fn(), logout: vi.fn(), me: vi.fn() }))

import {
  deleteFactorPackEdition,
  deleteFactorPackRow,
  getFactorPackBlastRadius,
  getFactorPackEdition,
  getFactorPackValidation,
  listFactorPackChanges,
  listFactorPackRows,
  withdrawFactorPackEdition,
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
  evidenceName: null,
  evidenceSize: null,
  curator: 'Ama Mensah',
  approver: null,
  provenanceReview: 'REVIEWED',
  provenanceNote: null,
  supersedesId: null,
  erratum: false,
  erratumNote: null,
  errorNote: null,
  withdrawnAt: null,
  withdrawnBy: null,
  withdrawalReason: null,
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

const changes: FactorPackChange[] = [
  {
    code: 'DEFRA:Fuels:Gaseous_fuels_Butane:tonnes',
    kind: 'CHANGED',
    oldKgCo2e: 3033.38067,
    newKgCo2e: 3100,
    percentChange: 2.1961,
    fields: 'kg CO2e per unit, gas split',
  },
  {
    code: 'DEFRA:Fuels:Retired:tonnes',
    kind: 'DISCONTINUED',
    oldKgCo2e: 1,
    newKgCo2e: null,
    percentChange: null,
    fields: null,
  },
  {
    code: 'DEFRA:Fuels:Steady:tonnes',
    kind: 'UNCHANGED',
    oldKgCo2e: 1,
    newKgCo2e: 1,
    percentChange: 0,
    fields: null,
  },
]

const emptyBlastRadius: BlastRadius = {
  editionId: 'defra-2027',
  packKey: 'defra',
  act: 'PUBLISH',
  predecessorEditionId: 'defra-2026',
  rowsAdded: 0,
  rowsChanged: 1,
  rowsDiscontinued: 1,
  rowsUnchanged: 1,
  rowsOverThreshold: 0,
  rows: [],
  discontinuedLineages: ['DEFRA:Fuels:Retired:tonnes'],
  unapprovedRows: [],
  organizations: [],
  holderCount: 0,
  openNoticeCount: 0,
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
  vi.mocked(listFactorPackChanges).mockReset().mockResolvedValue([])
  vi.mocked(getFactorPackBlastRadius).mockReset().mockResolvedValue(emptyBlastRadius)
  vi.mocked(withdrawFactorPackEdition).mockReset()
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

test('the Changes tab prints the change log frozen against the predecessor', async () => {
  const user = userEvent.setup()
  vi.mocked(listFactorPackChanges).mockResolvedValue(changes)
  vi.mocked(getFactorPackEdition).mockResolvedValue({
    ...draft,
    editionId: 'defra-2027',
    status: 'PUBLISHED',
    mutable: false,
    supersedesId: 'defra-2026',
  })
  renderPage()

  await user.click(await screen.findByRole('tab', { name: /changes/i }))
  expect(await screen.findByText(/frozen at publication against/i)).toBeInTheDocument()
  expect(screen.getByText('defra-2026')).toBeInTheDocument()
  expect(screen.getByText('CHANGED')).toBeInTheDocument()
  expect(screen.getByText('2.20%')).toBeInTheDocument()
  expect(screen.getByText('kg CO2e per unit, gas split')).toBeInTheDocument()
  // an unchanged row is counted, not listed
  expect(screen.queryByText('DEFRA:Fuels:Steady:tonnes')).not.toBeInTheDocument()
  expect(
    screen.getByText(/1 row is unchanged and are not listed|1 row is unchanged/i),
  ).toBeInTheDocument()
})

test('a draft says the change log is computed at publication', async () => {
  const user = userEvent.setup()
  renderPage()

  await user.click(await screen.findByRole('tab', { name: /changes/i }))
  expect(await screen.findByText(/computed and frozen at publication/i)).toBeInTheDocument()
})

test('the blast radius opens in a drawer, beside the rows', async () => {
  const user = userEvent.setup()
  renderPage()

  await user.click(await screen.findByRole('button', { name: /blast radius/i }))
  const drawer = await screen.findByRole('dialog', { name: 'defra-2027' })
  expect(within(drawer).getByText(/changes no organization/i)).toBeInTheDocument()
  expect(within(drawer).getByText(/Nobody holds one of these lineages/i)).toBeInTheDocument()
  await waitFor(() => expect(getFactorPackBlastRadius).toHaveBeenCalledWith('defra-2027'))
})

test('a published edition can be withdrawn with a reason, and a draft cannot', async () => {
  const user = userEvent.setup()
  vi.mocked(getFactorPackEdition).mockResolvedValue({
    ...draft,
    editionId: 'defra-2026',
    status: 'PUBLISHED',
    mutable: false,
  })
  vi.mocked(withdrawFactorPackEdition).mockResolvedValue({ ...draft, status: 'WITHDRAWN' })
  renderPage('defra-2026')

  await user.click(await screen.findByRole('button', { name: /^withdraw$/i }))
  const dialog = await screen.findByRole('dialog', { name: /withdraw defra-2026/i })
  expect(within(dialog).getByText(/stay exactly as they are/i)).toBeInTheDocument()
  await user.type(
    within(dialog).getByLabelText(/why it is withdrawn/i),
    'The publisher retracted the tables.',
  )
  await user.click(within(dialog).getByRole('button', { name: /withdraw edition/i }))

  await waitFor(() =>
    expect(withdrawFactorPackEdition).toHaveBeenCalledWith(
      'defra-2026',
      'The publisher retracted the tables.',
    ),
  )
})
