import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { EmissionSourcesPage } from './EmissionSourcesPage'
import type { Facility, Organization, SourceStream } from './api'

vi.mock('./api', () => import('./testApiMock'))

import { createStream, deleteStream, getOrganization, listFacilities, listStreams } from './api'

const organization: Organization = {
  id: 'org-1',
  name: 'Sankofa Gold plc',
  accountNo: 1,
  myRole: 'OWNER',
  address: null,
  contact: null,
  facilityCount: 1,
  supportAccess: [],
  createdAt: '2026-08-01T00:00:00Z',
}

const pit: Facility = {
  id: 'fac-1',
  name: 'Obuasi Ridge Open Pit',
  location: 'Obuasi, Ghana',
  country: 'GH',
  gridRegion: null,
  effectiveGridRegion: null,
  facilityType: 'MINE',
  leaseType: null,
  leaseFrom: null,
  leaseTo: null,
  entityId: 'ent-1',
  entityName: 'Sankofa Gold plc',
  relationshipType: 'SUBSIDIARY',
  createdAt: '2026-08-01T00:00:00Z',
}

const gensets: SourceStream = {
  id: 'str-1',
  facilityId: pit.id,
  facilityName: pit.name,
  name: 'Standby gensets',
  kind: 'STATIONARY_COMBUSTION',
  fuel: 'Diesel',
  meterOrSupplier: 'Tank meter 3',
  contractorOperated: false,
  note: null,
  defaultScope: 'SCOPE_1',
  defaultCategory: 'STATIONARY_COMBUSTION',
  allowedCategories: ['STATIONARY_COMBUSTION'],
  origin: 'REGISTER',
  createdAt: '2026-08-01T00:00:00Z',
  recordCount: 0,
}

const fleet: SourceStream = {
  ...gensets,
  id: 'str-2',
  name: 'Contract mining fleet',
  kind: 'MOBILE_COMBUSTION',
  meterOrSupplier: null,
  contractorOperated: true,
  defaultScope: 'SCOPE_3',
  defaultCategory: 'PURCHASED_GOODS_SERVICES',
  allowedCategories: ['PURCHASED_GOODS_SERVICES', 'UPSTREAM_TRANSPORT'],
  origin: 'INLINE',
}

function renderPage(facilityId = 'fac-1') {
  return renderWithProviders(<EmissionSourcesPage />, {
    route: `/app/ghg/org-1/facilities/${facilityId}/sources`,
    path: '/app/ghg/:organizationId/facilities/:facilityId/sources',
  })
}

beforeEach(() => {
  vi.mocked(listFacilities).mockReset().mockResolvedValue([pit])
  vi.mocked(listStreams).mockReset().mockResolvedValue([gensets, fleet])
  vi.mocked(createStream).mockReset()
  vi.mocked(deleteStream).mockReset()
  vi.mocked(getOrganization).mockReset().mockResolvedValue(organization)
})

test('lists the sources of the facility under its breadcrumb, marking one born on the activity form (spec 04.10)', async () => {
  renderPage()

  expect(await screen.findByRole('heading', { name: 'Emission sources' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Facilities' })).toBeInTheDocument()
  expect(screen.getByText('Obuasi Ridge Open Pit')).toBeInTheDocument()
  const list = await screen.findByRole('list', { name: 'Emission sources' })
  const items = within(list).getAllByRole('listitem')
  expect(items).toHaveLength(2)
  expect(items[0]).toHaveTextContent('Standby gensets')
  expect(items[0]).toHaveTextContent(
    'owned or controlled · defaults to Scope 1, Stationary combustion',
  )
  expect(items[0]).not.toHaveTextContent('added during data entry')
  expect(items[1]).toHaveTextContent('contractor-operated')
  expect(items[1]).toHaveTextContent('added during data entry')
})

test('a preparer adds several sources in a row; the kind and the contractor flag stay', async () => {
  const user = userEvent.setup()
  vi.mocked(getOrganization).mockResolvedValue({ ...organization, myRole: 'PREPARER' })
  vi.mocked(createStream).mockResolvedValue({ ...gensets, id: 'str-3', name: 'Camp LPG' })
  renderPage()

  const form = await screen.findByRole('form', { name: 'Add emission source' })
  const add = within(form).getByRole('button', { name: 'Add emission source' })
  expect(add).toBeDisabled()
  await user.type(within(form).getByLabelText('Source name'), 'Camp LPG')
  await user.type(within(form).getByLabelText('Fuel or material (optional)'), 'LPG')
  await user.click(within(form).getByLabelText(/Operated by a contractor/))
  await user.click(add)

  await waitFor(() =>
    expect(createStream).toHaveBeenCalledWith('fac-1', {
      name: 'Camp LPG',
      kind: 'STATIONARY_COMBUSTION',
      fuel: 'LPG',
      meterOrSupplier: undefined,
      contractorOperated: true,
    }),
  )
  expect(await screen.findByText('Camp LPG added to Obuasi Ridge Open Pit.')).toBeInTheDocument()
  expect(within(form).getByLabelText('Source name')).toHaveValue('')
  expect(within(form).getByLabelText('Fuel or material (optional)')).toHaveValue('')
  expect(within(form).getByLabelText(/Operated by a contractor/)).toBeChecked()
})

test('Remove asks for confirmation before the source goes', async () => {
  const user = userEvent.setup()
  vi.mocked(deleteStream).mockResolvedValue(undefined)
  renderPage()

  await user.click(
    await screen.findByRole('button', { name: 'Remove emission source Standby gensets' }),
  )
  const dialog = await screen.findByRole('dialog', { name: 'Remove emission source?' })
  expect(deleteStream).not.toHaveBeenCalled()
  await user.click(within(dialog).getByRole('button', { name: 'Remove' }))

  await waitFor(() => expect(deleteStream).toHaveBeenCalledWith('str-1'))
  expect(
    await screen.findByText('Standby gensets removed from Obuasi Ridge Open Pit.'),
  ).toBeInTheDocument()
})

test('a verifier reads the register without the add form and with Remove disabled (spec 01.4)', async () => {
  vi.mocked(getOrganization).mockResolvedValue({ ...organization, myRole: 'VERIFIER' })
  renderPage()

  expect(await screen.findByText('Standby gensets')).toBeInTheDocument()
  expect(screen.queryByRole('form', { name: 'Add emission source' })).not.toBeInTheDocument()
  const remove = screen.getByRole('button', { name: 'Remove emission source Standby gensets' })
  expect(remove).toBeDisabled()
  expect(remove).toHaveAccessibleDescription('Needs the Preparer, Reviewer or Owner role.')
  const edit = screen.getByRole('button', { name: 'Edit emission source Standby gensets' })
  expect(edit).toBeDisabled()
  expect(edit).toHaveAccessibleDescription('Needs the Preparer, Reviewer or Owner role.')
})

test('Edit opens the edit page of the source', async () => {
  const user = userEvent.setup()
  renderWithProviders(<EmissionSourcesPage />, {
    route: '/app/ghg/org-1/facilities/fac-1/sources',
    path: '/app/ghg/:organizationId/facilities/:facilityId/sources',
    extraRoutes: [
      {
        path: '/app/ghg/:organizationId/facilities/:facilityId/sources/:streamId/edit',
        element: <h1>Edit emission source</h1>,
      },
    ],
  })

  await user.click(
    await screen.findByRole('button', { name: 'Edit emission source Standby gensets' }),
  )
  expect(await screen.findByRole('heading', { name: 'Edit emission source' })).toBeInTheDocument()
})

test('a facility that is gone reads "Facility not found" with the way back', async () => {
  renderPage('fac-9')

  expect(await screen.findByText('Facility not found')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Back to facilities' })).toHaveAttribute(
    'href',
    '/app/ghg/org-1/facilities',
  )
})
