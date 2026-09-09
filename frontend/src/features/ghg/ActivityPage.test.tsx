import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { ActivityPage } from './ActivityPage'
import type { Activity, Facility, Unit } from './api'

vi.mock('./api', () => import('./testApiMock'))

vi.setConfig({ testTimeout: 30000 })

import {
  deleteActivity,
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
  entityId: 'ent-1',
  entityName: 'Asante Gold Resources',
  relationshipType: 'SUBSIDIARY',
  createdAt: '2026-08-01T00:00:00Z',
}

const diesel: Activity = {
  id: 'act-1',
  facilityId: 'fac-1',
  facilityName: 'Nkran Mine',
  streamId: null,
  streamName: null,
  activityType: 'Diesel consumption',
  quantity: 1000,
  unit: 'litre',
  periodStart: '2025-03-15',
  periodEnd: '2025-03-15',
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
}

function renderPage() {
  return renderWithProviders(<ActivityPage />, {
    route: '/app/ghg/org-1/activity',
    path: '/app/ghg/:organizationId/activity',
  })
}

beforeEach(() => {
  vi.mocked(searchActivities)
    .mockReset()
    .mockResolvedValue({ items: [diesel], page: 0, size: 50, total: 1 })
  vi.mocked(listStreams).mockReset().mockResolvedValue([])
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

test('shows each record with its quality tier, uncertainty and evidence count', async () => {
  renderPage()

  expect(await screen.findByText('Diesel consumption')).toBeInTheDocument()
  expect(screen.getByText('Tier 1 · Measured')).toBeInTheDocument()
  expect(screen.getByText('±2%')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '1 attachment' })).toBeInTheDocument()
})

test('a correction needs a reason before it can be saved, and sends it', async () => {
  const user = userEvent.setup()
  vi.mocked(updateActivity).mockResolvedValue({ ...diesel, quantity: 1200 })
  renderPage()

  await user.click(await screen.findByRole('button', { name: 'Correct' }))
  const dialog = screen.getByRole('dialog', { name: 'Correct record' })
  const save = within(dialog).getByRole('button', { name: 'Save correction' })
  expect(save).toBeDisabled()
  await user.type(
    within(dialog).getByLabelText('Reason for the correction'),
    'dispensing log reconciled with the supplier invoice',
  )
  expect(save).toBeEnabled()
  await user.click(save)

  await waitFor(() => expect(updateActivity).toHaveBeenCalled())
  expect(vi.mocked(updateActivity).mock.calls[0][1]).toMatchObject({
    quantity: 1000,
    reason: 'dispensing log reconciled with the supplier invoice',
  })
})

test('removing a record asks for a reason and records it', async () => {
  const user = userEvent.setup()
  vi.mocked(deleteActivity).mockResolvedValue(undefined)
  renderPage()

  await user.click(await screen.findByRole('button', { name: 'Remove' }))
  const dialog = screen.getByRole('dialog', { name: 'Remove Diesel consumption?' })
  const confirm = within(dialog).getByRole('button', { name: 'Remove' })
  expect(confirm).toBeDisabled()
  await user.type(within(dialog).getByLabelText('Reason'), 'entered twice from the same log')
  await user.click(confirm)

  await waitFor(() =>
    expect(deleteActivity).toHaveBeenCalledWith('act-1', 'entered twice from the same log'),
  )
})

test('the evidence dialog lists the attached files and the history shows old and new values', async () => {
  const user = userEvent.setup()
  renderPage()

  await user.click(await screen.findByRole('button', { name: '1 attachment' }))
  const evidence = screen.getByRole('dialog', { name: 'Evidence for Diesel consumption' })
  expect(await within(evidence).findByText('invoice-2938.pdf')).toHaveAttribute(
    'href',
    '/api/ghg/evidence/ev-1',
  )
  await user.click(within(evidence).getByRole('button', { name: 'Close' }))

  await user.click(screen.getByRole('button', { name: 'History (1)' }))
  const history = screen.getByRole('dialog', { name: 'History of Diesel consumption' })
  expect(
    await within(history).findByText('dispensing log reconciled with the supplier invoice'),
  ).toBeInTheDocument()
  expect(within(history).getByText('900')).toBeInTheDocument()
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

test('an import with rejected rows names each row and imports nothing (spec 04.5)', async () => {
  const user = userEvent.setup()
  vi.mocked(importActivities).mockResolvedValue({
    imported: 0,
    rejected: [{ row: 3, message: "quantity 'abc' is not a number" }],
  })
  renderPage()

  await user.click(await screen.findByRole('button', { name: 'Import CSV' }))
  const dialog = screen.getByRole('dialog', { name: 'Import activity data' })
  expect(within(dialog).getByRole('link', { name: 'Download the template' })).toHaveAttribute(
    'href',
    '/api/ghg/organizations/org-1/activities/import-template.csv',
  )
  const file = new File(['facility,activity_type\n'], 'march.csv', { type: 'text/csv' })
  await user.upload(within(dialog).getByLabelText('CSV file'), file)
  await user.click(within(dialog).getByRole('button', { name: 'Import' }))

  expect(await within(dialog).findByText(/Nothing imported: 1 row rejected/)).toBeInTheDocument()
  expect(within(dialog).getByText("quantity 'abc' is not a number")).toBeInTheDocument()
  expect(importActivities).toHaveBeenCalledWith('org-1', file)
})
