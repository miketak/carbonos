import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../../test/utils'
import { PackRowFormModal } from './PackRowFormModal'
import type { FactorPackRow } from '../api'

vi.mock('../api', () => ({
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

import { createFactorPackRow, updateFactorPackRow } from '../api'

const existing: FactorPackRow = {
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

beforeEach(() => {
  vi.mocked(createFactorPackRow).mockReset()
  vi.mocked(updateFactorPackRow).mockReset()
})

function renderModal(row: FactorPackRow | null, onSaved = vi.fn()) {
  renderWithProviders(
    <PackRowFormModal editionId="defra-2027" row={row} onClose={vi.fn()} onSaved={onSaved} />,
    { route: '/admin/factor-packs/defra-2027' },
  )
  return { onSaved }
}

test('a new row is added with its gases and the publisher taxonomy apart', async () => {
  const user = userEvent.setup()
  vi.mocked(createFactorPackRow).mockResolvedValue(existing)
  renderModal(null)

  await user.type(screen.getByLabelText(/^code$/i), 'TEST:diesel:litres')
  await user.type(screen.getByLabelText(/^name$/i), 'Diesel')
  await user.type(screen.getByLabelText(/^unit$/i), 'litre')
  await user.type(screen.getByLabelText(/kg CO2e per unit/i), '2.66')
  await user.type(screen.getByLabelText(/^CO2 \(kg per unit\)$/i), '2.66')
  await user.type(screen.getByLabelText(/source category/i), 'Fuels')
  await user.type(screen.getByLabelText(/source activity/i), 'Liquid fuels / Diesel')
  await user.click(screen.getByRole('button', { name: /add row/i }))

  await waitFor(() =>
    expect(createFactorPackRow).toHaveBeenCalledWith(
      'defra-2027',
      expect.objectContaining({
        code: 'TEST:diesel:litres',
        unit: 'litre',
        kgCo2ePerUnit: 2.66,
        co2KgPerUnit: 2.66,
        sourceCategory: 'Fuels',
        sourceActivity: 'Liquid fuels / Diesel',
      }),
    ),
  )
})

test('a gas left empty stays null, which is not a stated zero', async () => {
  const user = userEvent.setup()
  vi.mocked(createFactorPackRow).mockResolvedValue(existing)
  renderModal(null)

  await user.type(screen.getByLabelText(/^code$/i), 'TEST:one')
  await user.type(screen.getByLabelText(/^name$/i), 'A row')
  await user.type(screen.getByLabelText(/^unit$/i), 'kg')
  await user.type(screen.getByLabelText(/kg CO2e per unit/i), '1')
  await user.type(screen.getByLabelText(/^SF6 \(kg per unit\)$/i), '0')
  await user.click(screen.getByRole('button', { name: /add row/i }))

  await waitFor(() => expect(createFactorPackRow).toHaveBeenCalled())
  const input = vi.mocked(createFactorPackRow).mock.calls[0][1]
  expect(input.sf6KgPerUnit).toBe(0)
  expect(input.ch4KgPerUnit).toBeNull()
  expect(input.biogenicCo2KgPerUnit).toBeNull()
})

test('the category list follows the scope, because each category belongs to one scope', async () => {
  const user = userEvent.setup()
  renderModal(null)

  expect(screen.getByRole('option', { name: 'STATIONARY_COMBUSTION' })).toBeInTheDocument()
  await user.selectOptions(screen.getByLabelText(/default scope/i), 'SCOPE_2')
  expect(screen.queryByRole('option', { name: 'STATIONARY_COMBUSTION' })).not.toBeInTheDocument()
  expect(screen.getByRole('option', { name: 'PURCHASED_ELECTRICITY' })).toBeInTheDocument()
})

test('an existing row opens with its values and is saved back', async () => {
  const user = userEvent.setup()
  vi.mocked(updateFactorPackRow).mockResolvedValue(existing)
  const { onSaved } = renderModal(existing)

  expect(screen.getByLabelText(/^code$/i)).toHaveValue('DEFRA:Fuels:Gaseous_fuels_Butane:tonnes')
  expect(screen.getByLabelText(/kg CO2e per unit/i)).toHaveValue(3033.38067)
  expect(screen.getByLabelText(/source activity/i)).toHaveValue('Gaseous fuels / Butane')

  await user.clear(screen.getByLabelText(/kg CO2e per unit/i))
  await user.type(screen.getByLabelText(/kg CO2e per unit/i), '3033.5')
  await user.click(screen.getByRole('button', { name: /save row/i }))

  await waitFor(() =>
    expect(updateFactorPackRow).toHaveBeenCalledWith(
      'defra-2027',
      'row-1',
      expect.objectContaining({ kgCo2ePerUnit: 3033.5 }),
    ),
  )
  expect(onSaved).toHaveBeenCalled()
})

test('a refused field is shown under the field it belongs to', async () => {
  const user = userEvent.setup()
  const { ApiError } = await import('../../../lib/api')
  vi.mocked(createFactorPackRow).mockRejectedValue(
    new ApiError(422, {
      errors: { code: 'This edition already carries a row coded TEST:one.' },
    }),
  )
  renderModal(null)

  await user.type(screen.getByLabelText(/^code$/i), 'TEST:one')
  await user.type(screen.getByLabelText(/^name$/i), 'A row')
  await user.type(screen.getByLabelText(/^unit$/i), 'kg')
  await user.type(screen.getByLabelText(/kg CO2e per unit/i), '1')
  await user.click(screen.getByRole('button', { name: /add row/i }))

  expect(await screen.findByText(/already carries a row coded TEST:one/i)).toBeInTheDocument()
})
