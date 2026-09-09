import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { FacilitiesPage } from './FacilitiesPage'
import type { Entity, Facility } from './api'

vi.mock('./api', () => import('./testApiMock'))

// forms with many fields take longer than the 15s default on a loaded machine
vi.setConfig({ testTimeout: 30000 })

import { createFacility, createStream, listEntities, listFacilities, listStreams } from './api'

const own: Entity = {
  id: 'ent-1',
  name: 'Sankofa Gold plc',
  relationshipType: 'SUBSIDIARY',
  economicInterestPercent: 100,
  legalOwnershipPercent: 100,
  operatedByCompany: true,
  controlledByCompany: true,
  parentEntityId: null,
  effectiveEconomicInterestPercent: 100,
  chain: [],
  reportingCompany: true,
  equityShare: 1,
  financialControlShare: 1,
  operationalControlShare: 1,
  effectiveFrom: null,
  effectiveTo: null,
  jurisdiction: null,
  financialControlOverride: null,
  controlNote: null,
  createdAt: '2026-08-01T00:00:00Z',
}

const jv: Entity = {
  ...own,
  id: 'ent-2',
  name: 'Tarkwa Gold JV Ltd',
  relationshipType: 'JOINT_VENTURE',
  economicInterestPercent: 40,
  legalOwnershipPercent: null,
  reportingCompany: false,
  equityShare: 0.4,
  financialControlShare: 0.4,
}

const pit: Facility = {
  id: 'fac-1',
  name: 'Obuasi Ridge Open Pit',
  location: 'Obuasi, Ghana',
  country: null,
  gridRegion: null,
  effectiveGridRegion: null,
  facilityType: null,
  leaseType: null,
  leaseFrom: null,
  leaseTo: null,
  entityId: own.id,
  entityName: own.name,
  relationshipType: 'SUBSIDIARY',
  createdAt: '2026-08-01T00:00:00Z',
}

// the plant belongs to the JV: its facts live on the entity, not the site
const plant: Facility = {
  ...pit,
  id: 'fac-2',
  name: 'Tarkwa Processing Plant',
  location: 'Tarkwa, Ghana',
  country: null,
  gridRegion: null,
  effectiveGridRegion: null,
  facilityType: null,
  leaseType: null,
  leaseFrom: null,
  leaseTo: null,
  entityId: jv.id,
  entityName: jv.name,
  relationshipType: 'JOINT_VENTURE',
}

function renderPage() {
  return renderWithProviders(<FacilitiesPage />, {
    route: '/app/ghg/org-1/facilities',
    path: '/app/ghg/:organizationId/facilities',
  })
}

beforeEach(() => {
  vi.mocked(listFacilities).mockReset()
  vi.mocked(listStreams).mockReset().mockResolvedValue([])
  vi.mocked(createStream).mockReset()
  vi.mocked(listEntities).mockReset()
  vi.mocked(createFacility).mockReset()
  vi.mocked(listFacilities).mockResolvedValue([pit, plant])
  vi.mocked(listEntities).mockResolvedValue([own, jv])
})

test('lists each facility under its legal entity', async () => {
  renderPage()

  expect(await screen.findByText('Tarkwa Processing Plant')).toBeInTheDocument()
  expect(screen.getByText('Legal entity')).toBeInTheDocument()
  const plantRow = screen.getByText('Tarkwa Processing Plant').closest('tr')
  expect(plantRow).toHaveTextContent(/Tarkwa Gold JV Ltd.*Joint venture/)
  // two entities represented out of two; one of two facilities wholly owned
  expect(await screen.findByText('2 of 2')).toBeInTheDocument()
  expect(screen.getByText('1 of 2')).toBeInTheDocument()
})

test('the add form submits the chosen legal entity', async () => {
  const user = userEvent.setup()
  vi.mocked(createFacility).mockResolvedValue({
    ...plant,
    id: 'fac-3',
    name: 'Takoradi Port Loadout',
  })
  renderPage()

  await user.click(await screen.findByRole('button', { name: /add facility/i }))
  const dialog = await screen.findByRole('dialog', { name: /add facility/i })
  // paste rather than type: keystroke-by-keystroke typing is slow on a loaded machine
  await user.click(screen.getByLabelText('Name'))
  await user.paste('Takoradi Port Loadout')
  await user.click(screen.getByLabelText('Location'))
  await user.paste('Takoradi, Ghana')
  await user.selectOptions(await screen.findByLabelText('Legal entity'), 'ent-2')
  await user.click(within(dialog).getByRole('button', { name: /^add facility$/i }))

  await waitFor(() =>
    expect(createFacility).toHaveBeenCalledWith('org-1', {
      name: 'Takoradi Port Loadout',
      location: 'Takoradi, Ghana',
      entityId: 'ent-2',
    }),
  )
})

test('the add form submits the grid region, the type and the lease (spec 03.4)', async () => {
  const user = userEvent.setup()
  vi.mocked(createFacility).mockResolvedValue({ ...pit, id: 'fac-3', name: 'Tema Warehouse' })
  renderPage()

  await user.click(await screen.findByRole('button', { name: /add facility/i }))
  const dialog = await screen.findByRole('dialog', { name: /add facility/i })
  await user.type(within(dialog).getByLabelText('Name'), 'Tema Warehouse')
  await user.type(within(dialog).getByLabelText('Location'), 'Tema, Ghana')
  await user.type(within(dialog).getByLabelText('Grid region (optional)'), 'gha')
  await user.selectOptions(within(dialog).getByLabelText('Facility type (optional)'), 'WAREHOUSE')
  await user.selectOptions(within(dialog).getByLabelText('Lease (optional)'), 'OPERATING_LEASE_IN')
  await user.type(within(dialog).getByLabelText('Lease from (optional)'), '2025-07-01')
  await user.click(within(dialog).getByRole('button', { name: /^add facility$/i }))

  await waitFor(() =>
    expect(createFacility).toHaveBeenCalledWith(
      'org-1',
      expect.objectContaining({
        name: 'Tema Warehouse',
        gridRegion: 'GHA',
        facilityType: 'WAREHOUSE',
        leaseType: 'OPERATING_LEASE_IN',
        leaseFrom: '2025-07-01',
      }),
    ),
  )
})
