import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { FacilitiesPage } from './FacilitiesPage'
import type { Entity, Facility, Organization } from './api'

vi.mock('./api', () => import('./testApiMock'))

// forms with many fields take longer than the 15s default on a loaded machine
vi.setConfig({ testTimeout: 30000 })

import { getOrganization, listEntities, listFacilities } from './api'

const organization: Organization = {
  id: 'org-1',
  name: 'Sankofa Gold plc',
  accountNo: 1,
  myRole: 'OWNER',
  address: null,
  contact: null,
  facilityCount: 2,
  supportAccess: [],
  createdAt: '2026-08-01T00:00:00Z',
}

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
  vi.mocked(listEntities).mockReset()
  vi.mocked(getOrganization).mockReset()
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
  expect(screen.getByText('Under the company or a subsidiary')).toBeInTheDocument()
})

test('names the reporting company as such, not as a subsidiary', async () => {
  renderPage()

  const pitRow = (await screen.findByText('Obuasi Ridge Open Pit')).closest('tr')
  expect(pitRow).toHaveTextContent(/Sankofa Gold plc.*Reporting company/)
  expect(pitRow).not.toHaveTextContent('Subsidiary')
})

test('Edit leads to the facility’s own page under the list (spec 08)', async () => {
  const user = userEvent.setup()
  renderWithProviders(<FacilitiesPage />, {
    route: '/app/ghg/org-1/facilities',
    path: '/app/ghg/:organizationId/facilities',
    extraRoutes: [
      { path: '/app/ghg/:organizationId/facilities/new', element: <h1>Add facility</h1> },
      {
        path: '/app/ghg/:organizationId/facilities/:facilityId/edit',
        element: <h1>Edit facility</h1>,
      },
    ],
  })

  const plantRow = (await screen.findByText('Tarkwa Processing Plant')).closest('tr') as HTMLElement
  await user.click(within(plantRow).getByRole('button', { name: /^edit$/i }))
  expect(await screen.findByRole('heading', { name: 'Edit facility' })).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('Add facility leads to the add page (spec 08)', async () => {
  const user = userEvent.setup()
  renderWithProviders(<FacilitiesPage />, {
    route: '/app/ghg/org-1/facilities',
    path: '/app/ghg/:organizationId/facilities',
    extraRoutes: [
      { path: '/app/ghg/:organizationId/facilities/new', element: <h1>Add facility</h1> },
    ],
  })

  await user.click(await screen.findByRole('button', { name: /add facility/i }))
  expect(await screen.findByRole('heading', { name: 'Add facility' })).toBeInTheDocument()
})

test('a verifier sees Add facility, Edit and Remove disabled, but Emission sources stays usable (spec 01.4)', async () => {
  vi.mocked(getOrganization).mockResolvedValue({ ...organization, myRole: 'VERIFIER' })
  renderPage()

  const add = await screen.findByRole('button', { name: /add facility/i })
  await waitFor(() => expect(add).toBeDisabled())
  expect(add).toHaveAttribute('title', 'Needs the Preparer, Reviewer or Owner role.')
  expect(add).toHaveAccessibleDescription('Needs the Preparer, Reviewer or Owner role.')

  const plantRow = screen.getByText('Tarkwa Processing Plant').closest('tr') as HTMLElement
  expect(within(plantRow).getByRole('button', { name: /^edit$/i })).toBeDisabled()
  expect(within(plantRow).getByRole('button', { name: /^remove$/i })).toBeDisabled()
  // reading the register of emission sources stays open to everyone (spec 04.10)
  expect(within(plantRow).getByRole('button', { name: /emission sources/i })).toBeEnabled()
})

test('a preparer can add, edit and remove facilities (spec 01.4)', async () => {
  vi.mocked(getOrganization).mockResolvedValue({ ...organization, myRole: 'PREPARER' })
  renderPage()

  const add = await screen.findByRole('button', { name: /add facility/i })
  await waitFor(() => expect(add).toBeEnabled())

  const plantRow = screen.getByText('Tarkwa Processing Plant').closest('tr') as HTMLElement
  expect(within(plantRow).getByRole('button', { name: /^edit$/i })).toBeEnabled()
  expect(within(plantRow).getByRole('button', { name: /^remove$/i })).toBeEnabled()
})

test("Emission sources opens the facility's register page (spec 04.10)", async () => {
  const user = userEvent.setup()
  vi.mocked(getOrganization).mockResolvedValue({ ...organization, myRole: 'VERIFIER' })
  renderWithProviders(<FacilitiesPage />, {
    route: '/app/ghg/org-1/facilities',
    path: '/app/ghg/:organizationId/facilities',
    extraRoutes: [
      {
        path: '/app/ghg/:organizationId/facilities/:facilityId/sources',
        element: <p>the register of fac-1</p>,
      },
    ],
  })

  const pitRow = (await screen.findByText('Obuasi Ridge Open Pit')).closest('tr') as HTMLElement
  await user.click(within(pitRow).getByRole('button', { name: /emission sources/i }))

  expect(await screen.findByText('the register of fac-1')).toBeInTheDocument()
})
