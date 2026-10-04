import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { ApiError } from '../../lib/api'
import { renderWithProviders } from '../../test/utils'
import { FacilityFormPage } from './FacilityFormPage'
import type { Entity, Facility } from './api'

vi.mock('./api', () => import('./testApiMock'))

// forms with many fields take longer than the 15s default on a loaded machine
vi.setConfig({ testTimeout: 30000 })

import { createFacility, listEntities, listFacilities, updateFacility } from './api'

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

const plant: Facility = {
  ...pit,
  id: 'fac-2',
  name: 'Tarkwa Processing Plant',
  location: 'Tarkwa, Ghana',
  country: 'GH',
  gridRegion: 'GHA',
  facilityType: 'PROCESSING_PLANT',
  leaseType: 'OPERATING_LEASE_IN',
  leaseFrom: '2025-01-01',
  leaseTo: '2027-12-31',
  entityId: jv.id,
  entityName: jv.name,
  relationshipType: 'JOINT_VENTURE',
}

/** The list, as the place a save or a cancel lands. */
const neighbours = [{ path: '/app/ghg/:organizationId/facilities', element: <h1>Facilities</h1> }]

function renderNew() {
  return renderWithProviders(<FacilityFormPage />, {
    route: '/app/ghg/org-1/facilities/new',
    path: '/app/ghg/:organizationId/facilities/new',
    extraRoutes: neighbours,
  })
}

function renderEdit(id = 'fac-2') {
  return renderWithProviders(<FacilityFormPage />, {
    route: `/app/ghg/org-1/facilities/${id}/edit`,
    path: '/app/ghg/:organizationId/facilities/:facilityId/edit',
    extraRoutes: neighbours,
  })
}

beforeEach(() => {
  vi.mocked(listFacilities).mockReset().mockResolvedValue([pit, plant])
  vi.mocked(listEntities).mockReset().mockResolvedValue([own, jv])
  vi.mocked(createFacility).mockReset()
  vi.mocked(updateFacility).mockReset()
})

test('Add facility is a page of its own under the list, with a breadcrumb back (spec 08)', async () => {
  renderNew()

  expect(await screen.findByRole('heading', { level: 1, name: 'Add facility' })).toBeInTheDocument()
  const trail = screen.getByRole('navigation', { name: 'Breadcrumb' })
  expect(within(trail).getByRole('link', { name: 'Facilities' })).toHaveAttribute(
    'href',
    '/app/ghg/org-1/facilities',
  )
  expect(within(trail).getByText('Add facility')).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('form', { name: 'Add facility' })).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('the add form submits the chosen legal entity and returns to the list', async () => {
  const user = userEvent.setup()
  vi.mocked(createFacility).mockResolvedValue({
    ...plant,
    id: 'fac-3',
    name: 'Takoradi Port Loadout',
  })
  renderNew()

  const form = await screen.findByRole('form', { name: 'Add facility' })
  // paste rather than type: keystroke-by-keystroke typing is slow on a loaded machine
  await user.click(within(form).getByLabelText('Name'))
  await user.paste('Takoradi Port Loadout')
  await user.click(within(form).getByLabelText('Location'))
  await user.paste('Takoradi, Ghana')
  const legalEntity = await within(form).findByLabelText('Legal entity')
  // the company itself is named as such, not by the Table 1 row it is stored under
  expect(
    within(legalEntity)
      .getAllByRole('option')
      .map((option) => option.textContent),
  ).toEqual(['Sankofa Gold plc (Reporting company)', 'Tarkwa Gold JV Ltd (Joint venture)'])
  await user.selectOptions(legalEntity, 'ent-2')
  await user.click(within(form).getByRole('button', { name: /^add facility$/i }))

  await waitFor(() =>
    expect(createFacility).toHaveBeenCalledWith('org-1', {
      name: 'Takoradi Port Loadout',
      location: 'Takoradi, Ghana',
      entityId: 'ent-2',
    }),
  )
  expect(await screen.findByRole('heading', { name: 'Facilities' })).toBeInTheDocument()
  expect(await screen.findByText('Takoradi Port Loadout added.')).toBeInTheDocument()
})

test('the add form submits the grid region, the type and the lease (spec 03.4)', async () => {
  const user = userEvent.setup()
  vi.mocked(createFacility).mockResolvedValue({ ...pit, id: 'fac-3', name: 'Tema Warehouse' })
  renderNew()

  const form = await screen.findByRole('form', { name: 'Add facility' })
  await user.type(within(form).getByLabelText('Name'), 'Tema Warehouse')
  await user.type(within(form).getByLabelText('Location'), 'Tema, Ghana')
  await user.type(within(form).getByLabelText('Grid region (optional)'), 'gha')
  await user.selectOptions(within(form).getByLabelText('Facility type (optional)'), 'WAREHOUSE')
  await user.selectOptions(within(form).getByLabelText('Lease (optional)'), 'OPERATING_LEASE_IN')
  await user.type(within(form).getByLabelText('Lease from (optional)'), '2025-07-01')
  await user.click(within(form).getByRole('button', { name: /^add facility$/i }))

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

test('Cancel returns to the list without adding anything', async () => {
  const user = userEvent.setup()
  renderNew()

  await user.click(await screen.findByRole('button', { name: 'Cancel' }))
  expect(await screen.findByRole('heading', { name: 'Facilities' })).toBeInTheDocument()
  expect(createFacility).not.toHaveBeenCalled()
})

test('Edit facility loads the site, saves the change and returns to the list', async () => {
  const user = userEvent.setup()
  vi.mocked(updateFacility).mockResolvedValue({ ...plant, name: 'Tarkwa Plant' })
  renderEdit()

  expect(
    await screen.findByRole('heading', { level: 1, name: 'Edit facility' }),
  ).toBeInTheDocument()
  expect(screen.getByText(/^Tarkwa Processing Plant:/)).toBeInTheDocument()
  const form = screen.getByRole('form', { name: 'Edit facility' })
  expect(within(form).getByLabelText('Name')).toHaveValue('Tarkwa Processing Plant')
  expect(within(form).getByLabelText('Country (optional)')).toHaveValue('GH')
  expect(within(form).getByLabelText('Lease (optional)')).toHaveValue('OPERATING_LEASE_IN')
  expect(within(form).getByLabelText('Lease until (optional)')).toHaveValue('2027-12-31')
  await waitFor(() => expect(within(form).getByLabelText('Legal entity')).toHaveValue('ent-2'))

  await user.clear(within(form).getByLabelText('Name'))
  await user.click(within(form).getByLabelText('Name'))
  await user.paste('Tarkwa Plant')
  await user.click(within(form).getByRole('button', { name: 'Save changes' }))

  await waitFor(() => expect(updateFacility).toHaveBeenCalledTimes(1))
  expect(vi.mocked(updateFacility).mock.calls[0][0]).toBe('fac-2')
  expect(vi.mocked(updateFacility).mock.calls[0][1]).toMatchObject({
    name: 'Tarkwa Plant',
    location: 'Tarkwa, Ghana',
    country: 'GH',
    gridRegion: 'GHA',
    facilityType: 'PROCESSING_PLANT',
    leaseType: 'OPERATING_LEASE_IN',
    leaseFrom: '2025-01-01',
    leaseTo: '2027-12-31',
    entityId: 'ent-2',
  })
  expect(await screen.findByRole('heading', { name: 'Facilities' })).toBeInTheDocument()
  expect(await screen.findByText('Tarkwa Plant updated.')).toBeInTheDocument()
})

test('a refused save prints under the field and keeps the page (spec 08)', async () => {
  const user = userEvent.setup()
  vi.mocked(createFacility).mockRejectedValue(
    new ApiError(422, {
      detail: 'The lease ends before it starts.',
      errors: { leaseTo: 'The lease ends before it starts.' },
    }),
  )
  renderNew()

  const form = await screen.findByRole('form', { name: 'Add facility' })
  await user.type(within(form).getByLabelText('Name'), 'Temporary Yard')
  await user.type(within(form).getByLabelText('Location'), 'Tema, Ghana')
  await user.selectOptions(within(form).getByLabelText('Lease (optional)'), 'OPERATING_LEASE_IN')
  await user.type(within(form).getByLabelText('Lease from (optional)'), '2025-07-01')
  await user.type(within(form).getByLabelText('Lease until (optional)'), '2025-06-30')
  await user.click(within(form).getByRole('button', { name: /^add facility$/i }))

  expect(await screen.findByText('The lease ends before it starts.')).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 1, name: 'Add facility' })).toBeInTheDocument()
})

test('editing a facility that is gone offers the way back', async () => {
  renderEdit('fac-404')

  expect(await screen.findByRole('heading', { name: 'Facility not found' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Back to facilities' })).toHaveAttribute(
    'href',
    '/app/ghg/org-1/facilities',
  )
})
