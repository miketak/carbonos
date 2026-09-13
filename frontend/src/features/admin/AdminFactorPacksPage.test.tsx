import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { AdminFactorPacksPage } from './AdminFactorPacksPage'
import type { FactorPackEdition, FactorPackFamily } from './api'

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

import { createFactorPackEdition, createFactorPackFamily, listFactorPacks } from './api'

const published: FactorPackEdition = {
  editionId: 'defra-2026',
  packKey: 'defra',
  name: 'UK Government (DESNZ) GHG conversion factors 2026',
  status: 'PUBLISHED',
  source: 'UK Government (DESNZ) GHG Conversion Factors for Company Reporting, flat file',
  sourceUrl: 'https://example.test/defra-2026.xlsx',
  publicationYear: 2026,
  gwpBasis: 'AR5',
  license: 'Open Government Licence v3.0',
  retrieved: '2026-09-08',
  notes: null,
  appliesFrom: '2026-01-01',
  publishedAt: '2026-09-13T00:00:00Z',
  sourceDocument: 'factor-packs/defra-2026.json, shipped with the server',
  evidenceChecksum: '6f1e5dfe081d320acc582597b1bb848a7edf6b02b670c26f158daa74679ad66b',
  curator: 'seed',
  approver: null,
  provenanceReview: 'SEED_UNCHECKED',
  provenanceNote: null,
  mutable: false,
  rowCount: 1868,
  holderCount: 3,
}

const draft: FactorPackEdition = {
  ...published,
  editionId: 'defra-2026.r2',
  name: 'UK Government (DESNZ) GHG conversion factors 2026, erratum',
  status: 'DRAFT',
  publishedAt: null,
  evidenceChecksum: null,
  curator: 'Ama Mensah',
  provenanceReview: 'REVIEWED',
  mutable: true,
  rowCount: 1868,
  holderCount: 0,
}

const family: FactorPackFamily = {
  packKey: 'defra',
  name: 'UK Government (DESNZ) GHG conversion factors',
  kind: 'SOURCE',
  summary: 'Fuels, bioenergy, refrigerants, UK electricity and T&D.',
  editions: [published, draft],
}

beforeEach(() => {
  vi.mocked(listFactorPacks).mockReset().mockResolvedValue([family])
  vi.mocked(createFactorPackFamily).mockReset()
  vi.mocked(createFactorPackEdition).mockReset()
})

function renderPage() {
  return renderWithProviders(<AdminFactorPacksPage />, { route: '/admin/factor-packs' })
}

test('the catalogue lists every edition with its status, row count and holders', async () => {
  renderPage()

  expect(
    await screen.findByText('UK Government (DESNZ) GHG conversion factors'),
  ).toBeInTheDocument()
  const publishedRow = screen.getByText('defra-2026').closest('tr') as HTMLElement
  expect(within(publishedRow).getByText('PUBLISHED')).toBeInTheDocument()
  expect(within(publishedRow).getByText('1,868')).toBeInTheDocument()
  expect(within(publishedRow).getByText('3 organizations')).toBeInTheDocument()
  expect(within(publishedRow).getByText('2026-01-01')).toBeInTheDocument()

  const draftRow = screen.getByText('defra-2026.r2').closest('tr') as HTMLElement
  expect(within(draftRow).getByText('DRAFT')).toBeInTheDocument()
  expect(within(draftRow).getByText('No organization')).toBeInTheDocument()
})

test('an edition links to its workbench', async () => {
  renderPage()

  const link = await screen.findByRole('link', { name: 'defra-2026.r2' })
  expect(link).toHaveAttribute('href', '/admin/factor-packs/defra-2026.r2')
})

test('a published edition is cloned into a new draft, rows and all', async () => {
  const user = userEvent.setup()
  vi.mocked(createFactorPackEdition).mockResolvedValue({ ...draft, editionId: 'defra-2027' })
  renderPage()

  await user.click(
    await screen.findByRole('button', { name: /clone defra-2026 into a new draft/i }),
  )
  const dialog = await screen.findByRole('dialog', { name: /clone defra-2026/i })
  expect(within(dialog).getByText(/starts with the 1,868 rows of defra-2026/i)).toBeInTheDocument()

  await user.type(within(dialog).getByLabelText(/edition identifier/i), 'defra-2027')
  await user.click(within(dialog).getByRole('button', { name: /create draft/i }))

  await waitFor(() =>
    expect(createFactorPackEdition).toHaveBeenCalledWith(
      'defra',
      expect.objectContaining({ editionId: 'defra-2027', cloneFrom: 'defra-2026' }),
    ),
  )
  expect(await screen.findByText(/defra-2027 was created from defra-2026/i)).toBeInTheDocument()
})

test('a new family is created with its key and kind', async () => {
  const user = userEvent.setup()
  vi.mocked(createFactorPackFamily).mockResolvedValue({ ...family, packKey: 'ipcc-process' })
  renderPage()

  await user.click(await screen.findByRole('button', { name: /add family/i }))
  const dialog = await screen.findByRole('dialog', { name: /add a pack family/i })
  await user.type(within(dialog).getByLabelText(/^key$/i), 'ipcc-process')
  await user.type(within(dialog).getByLabelText(/^name$/i), 'IPCC 2006 process defaults')
  await user.selectOptions(within(dialog).getByLabelText(/kind/i), 'SECTOR')
  await user.click(within(dialog).getByRole('button', { name: /add family/i }))

  await waitFor(() =>
    expect(createFactorPackFamily).toHaveBeenCalledWith(
      expect.objectContaining({ packKey: 'ipcc-process', kind: 'SECTOR' }),
    ),
  )
})

test('a refused key is shown under the field it belongs to', async () => {
  const user = userEvent.setup()
  const { ApiError } = await import('../../lib/api')
  vi.mocked(createFactorPackFamily).mockRejectedValue(
    new ApiError(422, { errors: { packKey: 'Use lowercase letters, digits, hyphens and dots.' } }),
  )
  renderPage()

  await user.click(await screen.findByRole('button', { name: /add family/i }))
  const dialog = await screen.findByRole('dialog', { name: /add a pack family/i })
  await user.type(within(dialog).getByLabelText(/^key$/i), 'Not A Key')
  await user.type(within(dialog).getByLabelText(/^name$/i), 'Something')
  await user.click(within(dialog).getByRole('button', { name: /add family/i }))

  expect(
    await within(dialog).findByText(/use lowercase letters, digits, hyphens and dots/i),
  ).toBeInTheDocument()
})
