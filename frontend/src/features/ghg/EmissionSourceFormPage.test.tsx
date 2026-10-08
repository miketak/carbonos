import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { ApiError } from '../../lib/api'
import { renderWithProviders } from '../../test/utils'
import { EmissionSourceFormPage } from './EmissionSourceFormPage'
import type { Facility, SourceStream } from './api'

vi.mock('./api', () => import('./testApiMock'))

// forms with many fields take longer than the 15s default on a loaded machine
vi.setConfig({ testTimeout: 30000 })

import { listFacilities, listStreams, updateStream } from './api'

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

/** A source nothing names yet. */
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

/** A source with twelve records filed under it. */
const fleet: SourceStream = {
  ...gensets,
  id: 'str-2',
  name: 'Haul fleet',
  kind: 'MOBILE_COMBUSTION',
  meterOrSupplier: null,
  defaultCategory: 'MOBILE_COMBUSTION',
  allowedCategories: ['MOBILE_COMBUSTION'],
  recordCount: 12,
}

/** The register, as the place a save or a cancel lands. */
const neighbours = [
  {
    path: '/app/ghg/:organizationId/facilities/:facilityId/sources',
    element: <h1>Emission sources</h1>,
  },
]

function renderEdit(streamId = 'str-1', facilityId = 'fac-1') {
  return renderWithProviders(<EmissionSourceFormPage />, {
    route: `/app/ghg/org-1/facilities/${facilityId}/sources/${streamId}/edit`,
    path: '/app/ghg/:organizationId/facilities/:facilityId/sources/:streamId/edit',
    extraRoutes: neighbours,
  })
}

beforeEach(() => {
  vi.mocked(listFacilities).mockReset().mockResolvedValue([pit])
  vi.mocked(listStreams).mockReset().mockResolvedValue([gensets, fleet])
  vi.mocked(updateStream).mockReset()
})

test('the page is prefilled under a breadcrumb back to the register, and Save returns there with a toast', async () => {
  const user = userEvent.setup()
  vi.mocked(updateStream).mockResolvedValue({ ...gensets, name: 'Standby gensets 1 and 2' })
  renderEdit()

  expect(
    await screen.findByRole('heading', { level: 1, name: 'Edit emission source' }),
  ).toBeInTheDocument()
  const trail = screen.getByRole('navigation', { name: 'Breadcrumb' })
  expect(within(trail).getByRole('link', { name: 'Facilities' })).toHaveAttribute(
    'href',
    '/app/ghg/org-1/facilities',
  )
  expect(within(trail).getByText('Obuasi Ridge Open Pit')).toBeInTheDocument()
  expect(within(trail).getByRole('link', { name: 'Emission sources' })).toHaveAttribute(
    'href',
    '/app/ghg/org-1/facilities/fac-1/sources',
  )
  expect(within(trail).getByText('Edit emission source')).toHaveAttribute('aria-current', 'page')

  const form = screen.getByRole('form', { name: 'Edit emission source' })
  expect(within(form).getByLabelText('Source name')).toHaveValue('Standby gensets')
  expect(within(form).getByLabelText('Kind')).toHaveValue('STATIONARY_COMBUSTION')
  expect(within(form).getByLabelText('Fuel or material (optional)')).toHaveValue('Diesel')
  expect(within(form).getByLabelText('Meter or supplier (optional)')).toHaveValue('Tank meter 3')
  expect(within(form).getByLabelText(/Operated by a contractor/)).not.toBeChecked()
  // no records, so a change of kind asks nothing
  await user.selectOptions(within(form).getByLabelText('Kind'), 'MOBILE_COMBUSTION')
  expect(within(form).queryByLabelText(/Reason for the change/)).not.toBeInTheDocument()
  await user.selectOptions(within(form).getByLabelText('Kind'), 'STATIONARY_COMBUSTION')

  await user.clear(within(form).getByLabelText('Source name'))
  await user.type(within(form).getByLabelText('Source name'), 'Standby gensets 1 and 2')
  await user.click(within(form).getByRole('button', { name: 'Save' }))

  await waitFor(() =>
    expect(updateStream).toHaveBeenCalledWith('str-1', {
      name: 'Standby gensets 1 and 2',
      kind: 'STATIONARY_COMBUSTION',
      fuel: 'Diesel',
      meterOrSupplier: 'Tank meter 3',
      contractorOperated: false,
      note: undefined,
      reclassifyReason: undefined,
    }),
  )
  expect(await screen.findByText('Standby gensets 1 and 2 updated.')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Emission sources' })).toBeInTheDocument()
})

test('a change of kind on a source with records asks for a reason, and the refusal prints under it (spec 04.3)', async () => {
  const user = userEvent.setup()
  vi.mocked(updateStream).mockRejectedValueOnce(
    new ApiError(422, {
      detail: 'Invalid request',
      rule: 'ghg.stream.reclassify-reason-required',
      errors: {
        reclassifyReason:
          "'Haul fleet' has activity records. Say in at least 10 characters why its kind or operator changes; the records already filed keep their scope and category.",
      },
    }),
  )
  renderEdit('str-2')

  const form = await screen.findByRole('form', { name: 'Edit emission source' })
  expect(within(form).queryByLabelText(/Reason for the change/)).not.toBeInTheDocument()
  await user.click(within(form).getByLabelText(/Operated by a contractor/))
  const reason = within(form).getByLabelText(/Reason for the change of kind or operator/)
  expect(reason).toBeInTheDocument()
  expect(form).toHaveTextContent('Haul fleet has 12 records, which keep the scope and category')
  expect(form).toHaveTextContent('only new records take the new default')

  await user.type(reason, 'moved')
  await user.click(within(form).getByRole('button', { name: 'Save' }))
  await waitFor(() =>
    expect(updateStream).toHaveBeenCalledWith(
      'str-2',
      expect.objectContaining({ contractorOperated: true, reclassifyReason: 'moved' }),
    ),
  )
  expect(
    await within(form).findByText(/has activity records\. Say in at least 10/),
  ).toBeInTheDocument()
  expect(reason).toHaveAttribute('aria-invalid', 'true')
  expect(screen.queryByRole('heading', { name: 'Emission sources' })).not.toBeInTheDocument()

  // with a reason it goes through, and the reason travels with the save
  vi.mocked(updateStream).mockResolvedValueOnce({ ...fleet, contractorOperated: true })
  await user.type(reason, ' to a contractor under the 2026 mining services agreement')
  await user.click(within(form).getByRole('button', { name: 'Save' }))
  await waitFor(() =>
    expect(updateStream).toHaveBeenLastCalledWith(
      'str-2',
      expect.objectContaining({
        contractorOperated: true,
        reclassifyReason: 'moved to a contractor under the 2026 mining services agreement',
      }),
    ),
  )
  expect(await screen.findByText('Haul fleet updated.')).toBeInTheDocument()
})

test('a fuel change on a source with records needs no reason and says filed records keep their factor', async () => {
  const user = userEvent.setup()
  renderEdit('str-2')

  const form = await screen.findByRole('form', { name: 'Edit emission source' })
  const fuel = within(form).getByLabelText('Fuel or material (optional)')
  expect(form).not.toHaveTextContent('keep the factor')
  await user.clear(fuel)
  await user.type(fuel, 'Diesel (B7)')
  expect(form).toHaveTextContent('Records already filed keep the factor they were classified with')
  expect(within(form).queryByLabelText(/Reason for the change/)).not.toBeInTheDocument()
})

test('Cancel returns to the register without saving', async () => {
  const user = userEvent.setup()
  renderEdit()

  const form = await screen.findByRole('form', { name: 'Edit emission source' })
  await user.type(within(form).getByLabelText('Source name'), ' spare')
  await user.click(within(form).getByRole('button', { name: 'Cancel' }))

  expect(await screen.findByRole('heading', { name: 'Emission sources' })).toBeInTheDocument()
  expect(updateStream).not.toHaveBeenCalled()
})

test('a source that is gone reads "Emission source not found" with the way back', async () => {
  renderEdit('str-9')

  expect(await screen.findByText('Emission source not found')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Back to emission sources' })).toHaveAttribute(
    'href',
    '/app/ghg/org-1/facilities/fac-1/sources',
  )
})
