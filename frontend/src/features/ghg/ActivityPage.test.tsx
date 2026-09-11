import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { ActivityPage } from './ActivityPage'
import type {
  Activity,
  ActivityPage as ActivityPageResult,
  Facility,
  SourceStream,
  Unit,
} from './api'

vi.mock('./api', () => import('./testApiMock'))

vi.setConfig({ testTimeout: 30000 })

import {
  deleteActivity,
  getActivity,
  importActivities,
  listStreams,
  searchActivities,
  listActivityRevisions,
  listEvidence,
  listFacilities,
  listOrganizationUnits,
  updateActivity,
} from './api'

const units: Unit[] = [
  {
    code: 'litre',
    label: 'Litre',
    dimension: 'VOLUME',
    toCanonical: 0.001,
    custom: false,
    definition: null,
  },
]

const facility: Facility = {
  id: 'fac-1',
  name: 'Nkran Mine',
  location: 'Obuasi, Ghana',
  country: 'GH',
  gridRegion: null,
  effectiveGridRegion: null,
  facilityType: null,
  leaseType: null,
  leaseFrom: null,
  leaseTo: null,
  entityId: 'ent-1',
  entityName: 'Asante Gold Resources',
  relationshipType: 'SUBSIDIARY',
  createdAt: '2026-08-01T00:00:00Z',
}

const gensets: SourceStream = {
  id: 'str-1',
  facilityId: 'fac-1',
  facilityName: 'Nkran Mine',
  name: 'Standby gensets',
  kind: 'STATIONARY_COMBUSTION',
  fuel: 'Diesel',
  meterOrSupplier: 'Tank meter 3',
  contractorOperated: false,
  note: null,
  defaultScope: 'SCOPE_1',
  defaultCategory: 'STATIONARY_COMBUSTION',
  allowedCategories: ['STATIONARY_COMBUSTION'],
  createdAt: '2026-08-01T00:00:00Z',
}

const diesel: Activity = {
  id: 'act-1',
  recordNo: 1,
  recordRef: 'ACT-0001',
  draft: false,
  status: 'READY',
  issues: [],
  facilityId: 'fac-1',
  facilityName: 'Nkran Mine',
  streamId: 'str-1',
  streamName: 'Standby gensets',
  activityType: 'Diesel consumption',
  quantity: 1000,
  unit: 'litre',
  periodStart: '2025-03-01',
  periodEnd: '2025-03-31',
  dataSource: 'Fuel invoice',
  evidenceRef: 'INV-2938',
  dataQuality: 'MEASURED',
  note: null,
  dataQualityTier: 1,
  dataQualityTierLabel: 'Metered or invoiced primary data',
  uncertaintyPercent: 2,
  removed: false,
  removedAt: null,
  removedBy: null,
  removeReason: null,
  evidenceCount: 1,
  revisionCount: 1,
  importBatchId: null,
  importRow: null,
  createdAt: '2026-08-02T00:00:00Z',
}

const lpg: Activity = {
  ...diesel,
  id: 'act-2',
  recordNo: 2,
  recordRef: 'ACT-0002',
  status: 'NEEDS_ATTENTION',
  issues: ['NO_STREAM', 'NO_EVIDENCE'],
  streamId: null,
  streamName: null,
  activityType: 'LPG cylinders',
  quantity: 120,
  unit: 'kg',
  evidenceRef: null,
  evidenceCount: 0,
  revisionCount: 0,
}

function page(items: Activity[]): ActivityPageResult {
  const ready = items.filter((item) => item.status === 'READY').length
  return {
    items,
    page: 0,
    size: 50,
    total: items.length,
    counts: {
      total: items.length,
      ready,
      readyWithDocument: items.filter((item) => item.status === 'READY' && item.evidenceCount > 0)
        .length,
      needsAttention: items.length - ready,
      drafts: items.filter((item) => item.draft).length,
    },
  }
}

function renderPage(route = '/app/ghg/org-1/activity') {
  return renderWithProviders(<ActivityPage />, {
    route,
    path: '/app/ghg/:organizationId/activity',
  })
}

beforeEach(() => {
  vi.mocked(searchActivities)
    .mockReset()
    .mockResolvedValue(page([diesel, lpg]))
  vi.mocked(getActivity).mockReset().mockResolvedValue(diesel)
  vi.mocked(listStreams).mockReset().mockResolvedValue([gensets])
  vi.mocked(importActivities).mockReset()
  vi.mocked(listFacilities).mockReset().mockResolvedValue([facility])
  vi.mocked(listOrganizationUnits).mockReset().mockResolvedValue(units)
  vi.mocked(listEvidence)
    .mockReset()
    .mockResolvedValue([
      {
        id: 'ev-1',
        kind: 'FILE',
        name: 'invoice-2938.pdf',
        url: null,
        contentType: 'application/pdf',
        sizeBytes: 20480,
        uploadedBy: 'kojo@ecoriv.test',
        uploadedAt: '2026-09-01T10:00:00Z',
      },
    ])
  vi.mocked(listActivityRevisions)
    .mockReset()
    .mockResolvedValue([
      {
        id: 'rev-1',
        kind: 'CORRECTED',
        reason: 'dispensing log reconciled with the supplier invoice',
        changes: [{ field: 'quantity', before: '900', after: '1000' }],
        changedBy: 'kojo@ecoriv.test',
        changedAt: '2026-09-02T09:00:00Z',
      },
    ])
  vi.mocked(updateActivity).mockReset()
  vi.mocked(deleteActivity).mockReset()
})

test('the register shows each record with its number, stream, period, quantity and readiness', async () => {
  renderPage()

  expect(await screen.findByText('Diesel consumption')).toBeInTheDocument()
  expect(screen.getByText('Standby gensets · ACT-0001')).toBeInTheDocument()
  expect(screen.getAllByText('Mar 2025')).toHaveLength(2)
  expect(screen.getByTitle('All completeness checks passed')).toHaveTextContent('Ready')
  expect(screen.getByText('No stream +1')).toBeInTheDocument()
  expect(screen.getByText('1 of 2 records ready')).toBeInTheDocument()
  expect(screen.getByText(', 1 with a document on file')).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Record completeness' })).toHaveAttribute(
    'aria-valuenow',
    '50',
  )
  expect(screen.getByRole('tab', { name: 'Needs attention 1' })).toBeInTheDocument()
  expect(
    screen.getByText('Review status reflects completeness, not assurance.'),
  ).toBeInTheDocument()
})

test('the tabs and "Resolve n items" ask the server for a readiness, and the month picker for a period', async () => {
  const user = userEvent.setup()
  renderPage()
  await screen.findByText('Diesel consumption')

  await user.click(screen.getByRole('tab', { name: 'Ready 1' }))
  await waitFor(() =>
    expect(searchActivities).toHaveBeenLastCalledWith(
      'org-1',
      expect.objectContaining({ status: 'READY', page: 0, size: 50 }),
    ),
  )
  await user.click(screen.getByRole('button', { name: /Resolve 1 item/ }))
  await waitFor(() =>
    expect(searchActivities).toHaveBeenLastCalledWith(
      'org-1',
      expect.objectContaining({ status: 'NEEDS_ATTENTION' }),
    ),
  )
  fireEvent.change(screen.getByLabelText('Period'), { target: { value: '2026-08' } })
  await waitFor(() =>
    expect(searchActivities).toHaveBeenLastCalledWith(
      'org-1',
      expect.objectContaining({ from: '2026-08-01', to: '2026-08-31' }),
    ),
  )
})

test('searching the register asks the server with the query and sort (spec 04.5)', async () => {
  const user = userEvent.setup()
  renderPage()

  await screen.findByText('Diesel consumption')
  await user.type(screen.getByLabelText('Search'), 'lpg')
  await waitFor(() =>
    expect(searchActivities).toHaveBeenLastCalledWith(
      'org-1',
      expect.objectContaining({ q: 'lpg', sort: 'periodEnd', dir: 'desc', page: 0, size: 50 }),
    ),
  )
})

test('a row opens the drawer, and a correction needs a reason before it is sent', async () => {
  const user = userEvent.setup()
  vi.mocked(updateActivity).mockResolvedValue({ ...diesel, quantity: 1200 })
  renderPage()

  await user.click(await screen.findByRole('button', { name: 'Diesel consumption' }))
  const drawer = screen.getByRole('dialog', { name: 'Diesel consumption' })
  expect(within(drawer).getByText('Edit activity')).toBeInTheDocument()
  expect(within(drawer).getByText('ACT-0001')).toBeInTheDocument()
  expect(within(drawer).getByText('All completeness checks passed.')).toBeInTheDocument()
  expect(
    within(drawer)
      .getByText(/Stream default:/)
      .closest('p'),
  ).toHaveTextContent(
    "Scope 1 · Stationary combustion. Scope is confirmed in each inventory's review.",
  )
  const save = within(drawer).getByRole('button', { name: 'Save & next →' })
  expect(save).toBeDisabled()
  await user.type(
    within(drawer).getByLabelText('Reason for the correction *'),
    'dispensing log reconciled with the supplier invoice',
  )
  expect(save).toBeEnabled()
  await user.click(save)

  await waitFor(() => expect(updateActivity).toHaveBeenCalled())
  expect(vi.mocked(updateActivity).mock.calls[0][1]).toMatchObject({
    draft: false,
    quantity: 1000,
    unit: 'litre',
    reason: 'dispensing log reconciled with the supplier invoice',
  })
})

test('keys: n adds, / searches, j and Enter open the next row, and nothing fires while typing', async () => {
  const user = userEvent.setup()
  renderPage()
  await screen.findByText('Diesel consumption')

  await user.keyboard('/')
  expect(screen.getByLabelText('Search')).toHaveFocus()
  await user.keyboard('j')
  expect(screen.getByLabelText('Search')).toHaveValue('j')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

  act(() => (document.activeElement as HTMLElement | null)?.blur())
  await user.keyboard('n')
  expect(await screen.findByRole('dialog', { name: 'New activity' })).toBeInTheDocument()
  await user.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

  await user.keyboard('jj{Enter}')
  expect(await screen.findByRole('dialog', { name: 'LPG cylinders' })).toBeInTheDocument()
})

test('the drawer opens from ?record= and its Evidence tab and history read the record', async () => {
  const user = userEvent.setup()
  renderPage('/app/ghg/org-1/activity?record=act-1')

  const drawer = await screen.findByRole('dialog', { name: 'Diesel consumption' })
  await user.click(within(drawer).getByRole('tab', { name: 'Evidence 1' }))
  expect(await within(drawer).findByText('invoice-2938.pdf')).toHaveAttribute(
    'href',
    '/api/ghg/evidence/ev-1',
  )
  await user.click(within(drawer).getByRole('button', { name: 'History (1)' }))
  const history = screen.getByRole('dialog', { name: 'History of Diesel consumption' })
  expect(
    await within(history).findByText('dispensing log reconciled with the supplier invoice'),
  ).toBeInTheDocument()
  expect(within(history).getByText('900')).toBeInTheDocument()
})

test('removing a record from the drawer asks for a reason and records it', async () => {
  const user = userEvent.setup()
  vi.mocked(deleteActivity).mockResolvedValue(undefined)
  renderPage('/app/ghg/org-1/activity?record=act-1')

  const drawer = await screen.findByRole('dialog', { name: 'Diesel consumption' })
  await user.click(within(drawer).getByRole('button', { name: 'Remove' }))
  const dialog = screen.getByRole('dialog', { name: 'Remove Diesel consumption?' })
  const confirm = within(dialog).getByRole('button', { name: 'Remove' })
  expect(confirm).toBeDisabled()
  await user.type(within(dialog).getByLabelText('Reason'), 'entered twice from the same log')
  await user.click(confirm)

  await waitFor(() =>
    expect(deleteActivity).toHaveBeenCalledWith('act-1', 'entered twice from the same log'),
  )
})

test('ticking rows offers a bulk removal with one reason for all of them', async () => {
  const user = userEvent.setup()
  vi.mocked(deleteActivity).mockResolvedValue(undefined)
  renderPage()
  await screen.findByText('Diesel consumption')

  await user.click(screen.getByLabelText('Select ACT-0001'))
  await user.click(screen.getByLabelText('Select ACT-0002'))
  await user.click(screen.getByRole('button', { name: 'Remove 2 selected' }))
  const dialog = screen.getByRole('dialog', { name: 'Remove 2 records?' })
  await user.type(within(dialog).getByLabelText('Reason'), 'entered twice from the same log')
  await user.click(within(dialog).getByRole('button', { name: 'Remove' }))

  await waitFor(() => expect(deleteActivity).toHaveBeenCalledTimes(2))
  expect(deleteActivity).toHaveBeenCalledWith('act-1', 'entered twice from the same log')
  expect(deleteActivity).toHaveBeenCalledWith('act-2', 'entered twice from the same log')
  expect(await screen.findByText('2 records removed.')).toBeInTheDocument()
})

test('Import CSV opens the bulk entry dialog with the template link', async () => {
  const user = userEvent.setup()
  renderPage()

  await user.click(await screen.findByRole('button', { name: 'Import CSV' }))
  const dialog = screen.getByRole('dialog', { name: 'Import activity data' })
  expect(within(dialog).getByRole('link', { name: 'Download CSV template' })).toHaveAttribute(
    'href',
    '/api/ghg/organizations/org-1/activities/import-template.csv',
  )
  expect(within(dialog).getByRole('button', { name: 'Add records' })).toBeDisabled()
})
