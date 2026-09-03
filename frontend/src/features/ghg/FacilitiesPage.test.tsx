import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { FacilitiesPage } from './FacilitiesPage'
import type { Facility } from './api'

vi.mock('./api', () => import('./testApiMock'))

import { createFacility, listFacilities } from './api'

const pit: Facility = {
  id: 'fac-1',
  name: 'Obuasi Ridge Open Pit',
  location: 'Obuasi, Ghana',
  equitySharePercent: 100,
  financialControl: true,
  operationalControl: true,
  createdAt: '2026-08-01T00:00:00Z',
}

// operated joint venture: the case one "controlled" flag could not express
const jv: Facility = {
  ...pit,
  id: 'fac-2',
  name: 'Tarkwa Processing Plant',
  location: 'Tarkwa, Ghana',
  equitySharePercent: 40,
  financialControl: false,
  operationalControl: true,
}

function renderPage() {
  return renderWithProviders(<FacilitiesPage />, {
    route: '/app/ghg/org-1/facilities',
    path: '/app/ghg/:organizationId/facilities',
  })
}

beforeEach(() => {
  vi.mocked(listFacilities).mockReset()
  vi.mocked(createFacility).mockReset()
  vi.mocked(listFacilities).mockResolvedValue([pit, jv])
})

test('lists financial and operational control separately', async () => {
  renderPage()

  expect(await screen.findByText('Tarkwa Processing Plant')).toBeInTheDocument()
  expect(screen.getByText('Financial ctrl')).toBeInTheDocument()
  expect(screen.getByText('Operational ctrl')).toBeInTheDocument()
  const jvRow = screen.getByText('Tarkwa Processing Plant').closest('tr')
  expect(jvRow).toHaveTextContent(/40%.*No.*Yes/)
  // the operated JV counts as operationally controlled, which one flag could not say
  expect(screen.getByText('2 of 2')).toBeInTheDocument()
})

test('the add form submits both control facts', async () => {
  const user = userEvent.setup()
  vi.mocked(createFacility).mockResolvedValue({ ...jv, id: 'fac-3', name: 'Takoradi Port Loadout' })
  renderPage()

  await user.click(await screen.findByRole('button', { name: /add facility/i }))
  const dialog = await screen.findByRole('dialog', { name: /add facility/i })
  // paste rather than type: keystroke-by-keystroke typing is slow on a loaded machine
  await user.click(screen.getByLabelText('Name'))
  await user.paste('Takoradi Port Loadout')
  await user.click(screen.getByLabelText('Location'))
  await user.paste('Takoradi, Ghana')
  await user.clear(screen.getByLabelText('Equity share (%)'))
  await user.paste('30')
  await user.click(screen.getByLabelText('Financial control'))
  await user.click(screen.getByLabelText('Operational control'))
  await user.click(within(dialog).getByRole('button', { name: /^add facility$/i }))

  await waitFor(() =>
    expect(createFacility).toHaveBeenCalledWith('org-1', {
      name: 'Takoradi Port Loadout',
      location: 'Takoradi, Ghana',
      equitySharePercent: 30,
      financialControl: false,
      operationalControl: false,
    }),
  )
})
