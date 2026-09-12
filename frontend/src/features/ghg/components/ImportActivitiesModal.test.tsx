import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../../test/utils'
import { ImportActivitiesModal } from './ImportActivitiesModal'
import type { ActivityImportResult } from '../api'

vi.mock('../api', () => import('../testApiMock'))

import { importActivities } from '../api'

const preview: ActivityImportResult = {
  dryRun: true,
  batchId: null,
  imported: 0,
  rejected: [],
  rows: [
    {
      row: 2,
      facilityName: 'Nkran Mine',
      streamName: 'Standby gensets',
      activityType: 'Diesel consumption',
      quantity: 12500,
      unit: 'litre',
      periodStart: '2025-03-01',
      periodEnd: '2025-03-31',
      dataSource: 'Fuel register',
      evidenceRef: 'INV-3',
      dataQuality: 'MEASURED',
      dataQualityTier: 1,
      status: 'READY',
      issues: ['EVIDENCE_REFERENCE_ONLY'],
    },
    {
      row: 3,
      facilityName: 'Nkran Mine',
      streamName: 'Standby gensets',
      activityType: 'Diesel consumption',
      quantity: 300,
      unit: 'gallon',
      periodStart: '2025-04-01',
      periodEnd: '2025-04-30',
      dataSource: null,
      evidenceRef: null,
      dataQuality: 'MEASURED',
      dataQualityTier: 1,
      status: 'NEEDS_ATTENTION',
      issues: ['NO_DATA_SOURCE', 'NO_EVIDENCE'],
    },
  ],
  totals: [
    {
      facilityName: 'Nkran Mine',
      streamName: 'Standby gensets',
      unit: 'litre',
      rows: 1,
      quantity: 12500,
    },
    {
      facilityName: 'Nkran Mine',
      streamName: 'Standby gensets',
      unit: 'gallon',
      rows: 1,
      quantity: 300,
    },
  ],
  warnings: [{ row: 3, message: "'Standby gensets' mixes units in this file: gallon, litre" }],
}

function renderModal() {
  const onImported = vi.fn()
  renderWithProviders(
    <ImportActivitiesModal organizationId="org-1" onClose={vi.fn()} onImported={onImported} />,
  )
  return { onImported }
}

beforeEach(() => {
  vi.mocked(importActivities).mockReset()
})

test('choosing a file previews it: totals, rows with their readiness, warnings; Add records commits it', async () => {
  const user = userEvent.setup()
  vi.mocked(importActivities)
    .mockResolvedValueOnce(preview)
    .mockResolvedValueOnce({ ...preview, dryRun: false, batchId: 'batch-1', imported: 2, rows: [] })
  const { onImported } = renderModal()

  const dialog = screen.getByRole('dialog', { name: 'Import activity data' })
  expect(within(dialog).getByRole('link', { name: 'Download CSV template' })).toHaveAttribute(
    'href',
    '/api/ghg/organizations/org-1/activities/import-template.csv',
  )
  const add = within(dialog).getByRole('button', { name: 'Add records' })
  expect(add).toBeDisabled()
  const file = new File(['facility,activity_type\n'], 'q1.csv', { type: 'text/csv' })
  await user.upload(within(dialog).getByLabelText('CSV file'), file)

  await waitFor(() =>
    expect(importActivities).toHaveBeenCalledWith('org-1', file, { dryRun: true }),
  )
  expect(await within(dialog).findByText('2 records to add')).toBeInTheDocument()
  const totals = within(dialog).getByRole('table', { name: 'Control totals' })
  expect(within(totals).getByText('12,500 litre')).toBeInTheDocument()
  expect(within(dialog).getByText('1 row: missing source')).toBeInTheDocument()
  expect(within(dialog).getByText(/mixes units in this file/)).toBeInTheDocument()
  expect(within(dialog).getByText('Ready')).toBeInTheDocument()
  expect(within(dialog).getByText('Missing source +1')).toBeInTheDocument()

  expect(add).toBeEnabled()
  await user.click(add)
  await waitFor(() => expect(onImported).toHaveBeenCalledWith(2))
  expect(vi.mocked(importActivities).mock.calls[1]).toEqual(['org-1', file, { dryRun: undefined }])
})

test('a rejected row keeps Add records disabled and names the row', async () => {
  const user = userEvent.setup()
  vi.mocked(importActivities).mockResolvedValue({
    ...preview,
    rows: [],
    totals: [],
    warnings: [],
    rejected: [{ row: 3, message: "quantity 'abc' is not a number" }],
  })
  renderModal()
  const dialog = screen.getByRole('dialog', { name: 'Import activity data' })
  await user.upload(
    within(dialog).getByLabelText('CSV file'),
    new File(['facility,activity_type\n'], 'march.csv', { type: 'text/csv' }),
  )

  expect(await within(dialog).findByText(/Nothing will import: 1 row rejected/)).toBeInTheDocument()
  expect(within(dialog).getByText("quantity 'abc' is not a number")).toBeInTheDocument()
  expect(within(dialog).getByRole('button', { name: 'Add records' })).toBeDisabled()
})
