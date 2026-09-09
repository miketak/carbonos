import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { UnitsPage } from './UnitsPage'
import type { Unit } from './api'

vi.mock('./api', () => import('./testApiMock'))

// two forms of fields on one page take longer than the 15s default on a loaded machine
vi.setConfig({ testTimeout: 30000 })

import { createCustomUnit, createDensity, listCustomUnits, listDensities, listUnits } from './api'

const units: Unit[] = [
  {
    code: 'litre',
    label: 'Litre',
    dimension: 'VOLUME',
    toCanonical: 0.001,
    custom: false,
    definition: null,
  },
  {
    code: 'kg',
    label: 'Kilogram',
    dimension: 'MASS',
    toCanonical: 1,
    custom: false,
    definition: null,
  },
]

function renderPage() {
  return renderWithProviders(<UnitsPage />, {
    route: '/app/ghg/org-1/units',
    path: '/app/ghg/:organizationId/units',
  })
}

beforeEach(() => {
  vi.mocked(listUnits).mockReset().mockResolvedValue(units)
  vi.mocked(listCustomUnits)
    .mockReset()
    .mockResolvedValue([
      {
        id: 'cu-1',
        code: 'drum',
        label: 'Drum (200 L)',
        baseUnit: 'litre',
        factor: 200,
        definition: '1 drum = 200 litre',
      },
    ])
  vi.mocked(listDensities)
    .mockReset()
    .mockResolvedValue([
      {
        id: 'den-1',
        organizationId: null,
        typical: true,
        material: 'Diesel',
        kgPerLitre: 0.84,
        source: 'Typical mid-range density of automotive diesel at 15 C',
        note: 'A planning value.',
      },
    ])
  vi.mocked(createCustomUnit).mockReset()
  vi.mocked(createDensity).mockReset()
})

test('lists custom units with their definition and densities with the typical flag', async () => {
  renderPage()

  expect(await screen.findByText('1 drum = 200 litre')).toBeInTheDocument()
  expect(screen.getByText('Diesel')).toBeInTheDocument()
  expect(screen.getByText('Typical value')).toBeInTheDocument()
})

test('defines a custom unit as a multiple of a registered unit', async () => {
  const user = userEvent.setup()
  vi.mocked(createCustomUnit).mockResolvedValue({
    id: 'cu-2',
    code: 'bag',
    label: 'Bag (50 kg)',
    baseUnit: 'kg',
    factor: 50,
    definition: '1 bag = 50 kg',
  })
  renderPage()

  await screen.findByText('1 drum = 200 litre')
  await user.type(screen.getByLabelText('Code'), 'bag')
  await user.type(screen.getByLabelText('Label'), 'Bag (50 kg)')
  await user.type(screen.getByLabelText('One unit equals'), '50')
  await user.selectOptions(screen.getByLabelText('Of'), 'kg')
  await user.click(screen.getByRole('button', { name: 'Define unit' }))

  await waitFor(() =>
    expect(createCustomUnit).toHaveBeenCalledWith('org-1', {
      code: 'bag',
      label: 'Bag (50 kg)',
      baseUnit: 'kg',
      factor: 50,
    }),
  )
})

test('records a supplier density with its source', async () => {
  const user = userEvent.setup()
  vi.mocked(createDensity).mockResolvedValue({
    id: 'den-2',
    organizationId: 'org-1',
    typical: false,
    material: 'Diesel (GOIL)',
    kgPerLitre: 0.8325,
    source: 'GOIL CoA 2025-03',
    note: null,
  })
  renderPage()

  const card = (await screen.findByText('Densities')).closest('div')!
  await user.type(within(card).getByLabelText('Material'), 'Diesel (GOIL)')
  await user.type(within(card).getByLabelText('kg per litre'), '0.8325')
  await user.type(within(card).getByLabelText('Source'), 'GOIL CoA 2025-03')
  await user.click(within(card).getByRole('button', { name: 'Record density' }))

  await waitFor(() =>
    expect(createDensity).toHaveBeenCalledWith('org-1', {
      material: 'Diesel (GOIL)',
      kgPerLitre: 0.8325,
      source: 'GOIL CoA 2025-03',
      note: undefined,
    }),
  )
})
