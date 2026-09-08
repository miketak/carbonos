import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { FacilitiesPage } from './FacilitiesPage'
import type { Entity, Facility } from './api'

vi.mock('./api', () => import('./testApiMock'))

import { createFacility, listEntities, listFacilities } from './api'

const own: Entity = {
  id: 'ent-1',
  name: 'Sankofa Gold plc',
  relationshipType: 'WHOLLY_OWNED',
  economicInterestPercent: 100,
  legalOwnershipPercent: 100,
  operatedByCompany: true,
  reportingCompany: true,
  equityShare: 1,
  financialControlShare: 1,
  operationalControlShare: 1,
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
  entityId: own.id,
  entityName: own.name,
  relationshipType: 'WHOLLY_OWNED',
  createdAt: '2026-08-01T00:00:00Z',
}

// the plant belongs to the JV: its facts live on the entity, not the site
const plant: Facility = {
  ...pit,
  id: 'fac-2',
  name: 'Tarkwa Processing Plant',
  location: 'Tarkwa, Ghana',
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
