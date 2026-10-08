import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { ImportActivitiesPage } from './ImportActivitiesPage'
import type { ActivityImportResult, SourceStream } from './api'

vi.mock('./api', () => import('./testApiMock'))

import { getOrganization, importActivities, listFacilities, listStreams } from './api'

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
  origin: 'REGISTER',
  createdAt: '2026-08-01T00:00:00Z',
  recordCount: 0,
}
const boiler: SourceStream = { ...gensets, id: 'str-2', name: 'Boiler LPG', fuel: 'LPG' }

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
  sha256: 'abc123',
  unknownSources: [],
  sourcesCreated: 0,
}

const undecided: ActivityImportResult = {
  ...preview,
  rows: [
    preview.rows[0]!,
    {
      ...preview.rows[1]!,
      row: 3,
      streamName: 'Standby genset 3',
      status: 'NEEDS_DECISION',
      issues: ['NO_DATA_SOURCE', 'NO_EVIDENCE'],
    },
    {
      ...preview.rows[1]!,
      row: 4,
      activityType: 'Lime calcination',
      streamName: 'Kiln 1',
      unit: 'tonne',
      quantity: 400,
      status: 'NEEDS_DECISION',
    },
  ],
  warnings: [
    { row: null, message: "The workbook has 2 sheets; only 'Sheet1' was read." },
    { row: 3, message: 'quantity came from a formula; the saved value is the cached result' },
  ],
  unknownSources: [
    {
      facilityId: 'fac-1',
      facility: 'Nkran Mine',
      name: 'Standby genset 3',
      rows: [3],
      candidates: [
        {
          id: 'str-1',
          name: 'Standby gensets',
          kind: 'STATIONARY_COMBUSTION',
          defaultScope: 'SCOPE_1',
          defaultCategory: 'STATIONARY_COMBUSTION',
        },
      ],
    },
    { facilityId: 'fac-1', facility: 'Nkran Mine', name: 'Kiln 1', rows: [4], candidates: [] },
  ],
}

function renderPage() {
  return renderWithProviders(<ImportActivitiesPage />, {
    route: '/app/ghg/org-1/activity/import',
    path: '/app/ghg/:organizationId/activity/import',
    extraRoutes: [{ path: '/app/ghg/:organizationId/activity', element: <h1>Activity data</h1> }],
  })
}

beforeEach(() => {
  vi.mocked(importActivities).mockReset()
  vi.mocked(listStreams).mockReset().mockResolvedValue([gensets, boiler])
  vi.mocked(listFacilities)
    .mockReset()
    .mockResolvedValue([
      {
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
      },
    ])
  vi.mocked(getOrganization).mockReset().mockResolvedValue({
    id: 'org-1',
    name: 'Ecoriv Holdings',
    accountNo: 1,
    myRole: 'OWNER',
    address: null,
    contact: null,
    facilityCount: 1,
    supportAccess: [],
    createdAt: '2026-08-01T00:00:00Z',
  })
})

test('choosing a file previews it: totals, rows with their readiness, warnings; Add records commits it and returns to the register', async () => {
  const user = userEvent.setup()
  vi.mocked(importActivities)
    .mockResolvedValueOnce(preview)
    .mockResolvedValueOnce({ ...preview, dryRun: false, batchId: 'batch-1', imported: 2, rows: [] })
  renderPage()

  const form = screen.getByRole('form', { name: 'Import activity data' })
  expect(within(form).getByRole('link', { name: 'Download CSV template' })).toHaveAttribute(
    'href',
    '/api/ghg/organizations/org-1/activities/import-template.csv',
  )
  const add = within(form).getByRole('button', { name: 'Add records' })
  expect(add).toBeDisabled()
  const file = new File(['facility,activity_type\nNkran Mine,Diesel\n'], 'q1.csv', {
    type: 'text/csv',
  })
  await user.upload(within(form).getByLabelText('Spreadsheet file'), file)

  await waitFor(() =>
    expect(importActivities).toHaveBeenCalledWith(
      'org-1',
      file,
      expect.objectContaining({ dryRun: true, decisions: undefined }),
    ),
  )
  expect(await within(form).findByText('2 records to add')).toBeInTheDocument()
  const totals = within(form).getByRole('table', { name: 'Control totals' })
  expect(within(totals).getByText('12,500 litre')).toBeInTheDocument()
  expect(within(form).getByText(/mixes units in this file/)).toBeInTheDocument()
  expect(within(form).getByText('Ready')).toBeInTheDocument()

  expect(add).toBeEnabled()
  await user.click(add)
  await waitFor(() =>
    expect(vi.mocked(importActivities).mock.calls[1]?.[2]).toEqual(
      expect.objectContaining({ dryRun: false, decisions: { sha256: 'abc123', items: [] } }),
    ),
  )
  expect(await screen.findByText('2 records imported.')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Activity data' })).toBeInTheDocument()
})

test('an unknown emission source holds Add records until it is decided; the decisions travel with the file', async () => {
  const user = userEvent.setup()
  vi.mocked(importActivities)
    .mockResolvedValueOnce(undecided)
    .mockResolvedValueOnce({
      ...undecided,
      dryRun: false,
      batchId: 'batch-1',
      imported: 3,
      rows: [],
      unknownSources: [],
      sourcesCreated: 1,
    })
  renderPage()
  const form = screen.getByRole('form', { name: 'Import activity data' })
  const file = new File(['facility,activity_type\n'], 'q3.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  await user.upload(within(form).getByLabelText('Spreadsheet file'), file)

  expect(await within(form).findByText('Decide 2 unknown emission sources')).toBeInTheDocument()
  // the file-level warning carries no row number; the formula one does
  expect(
    within(form).getByText("The workbook has 2 sheets; only 'Sheet1' was read."),
  ).toBeInTheDocument()
  expect(within(form).getByText(/Row 3:/)).toBeInTheDocument()
  expect(within(form).getAllByText('Needs a decision')).toHaveLength(2)
  const add = within(form).getByRole('button', { name: 'Add records' })
  expect(add).toBeDisabled()
  expect(add).toHaveAttribute('title', 'Decide 2 emission sources first')

  // the near name is used with one click; the other is created with the typed name
  const genset = within(form).getByRole('group', { name: "'Standby genset 3' at Nkran Mine" })
  expect(within(genset).getByText('It covers row 3.', { exact: false })).toBeInTheDocument()
  await user.click(within(genset).getByRole('radio', { name: /^Use Standby gensets/ }))
  expect(add).toBeDisabled()
  const kiln = within(form).getByRole('group', { name: "'Kiln 1' at Nkran Mine" })
  expect(
    within(kiln).queryByRole('radio', { name: /^Use Standby gensets/ }),
  ).not.toBeInTheDocument()
  await user.click(within(kiln).getByRole('radio', { name: /^Create 'Kiln 1'/ }))
  expect(within(kiln).getByLabelText('Source name *')).toHaveValue('Kiln 1')
  await user.selectOptions(within(kiln).getByLabelText('Kind'), 'PROCESS')
  // no candidate is near, so no reason is asked
  expect(within(kiln).queryByLabelText('Why is this a different source?')).not.toBeInTheDocument()
  expect(add).toBeEnabled()

  await user.click(add)
  await waitFor(() => expect(importActivities).toHaveBeenCalledTimes(2))
  expect(vi.mocked(importActivities).mock.calls[1]?.[2]).toEqual(
    expect.objectContaining({
      dryRun: false,
      decisions: {
        sha256: 'abc123',
        items: [
          { facilityId: 'fac-1', name: 'Standby genset 3', mapTo: 'str-1' },
          {
            facilityId: 'fac-1',
            name: 'Kiln 1',
            create: {
              name: 'Kiln 1',
              kind: 'PROCESS',
              fuel: undefined,
              meterOrSupplier: undefined,
              contractorOperated: false,
            },
            reason: undefined,
          },
        ],
      },
    }),
  )
  expect(
    await screen.findByText('3 records imported. 1 emission source added during import.'),
  ).toBeInTheDocument()
})

test('mapping to a source the preview did not suggest needs a reason of ten characters', async () => {
  const user = userEvent.setup()
  vi.mocked(importActivities).mockResolvedValueOnce({
    ...undecided,
    rows: [undecided.rows[2]!],
    unknownSources: [undecided.unknownSources[1]!],
  })
  renderPage()
  const form = screen.getByRole('form', { name: 'Import activity data' })
  await user.upload(
    within(form).getByLabelText('Spreadsheet file'),
    new File(['facility,activity_type\n'], 'kiln.csv', { type: 'text/csv' }),
  )
  const kiln =
    within(form).getByRole('group', { name: "'Kiln 1' at Nkran Mine" }) ??
    (await within(form).findByRole('group', { name: "'Kiln 1' at Nkran Mine" }))
  await user.click(within(kiln).getByRole('radio', { name: /^Use another source of Nkran Mine/ }))
  await user.selectOptions(within(kiln).getByLabelText('Emission source'), 'str-2')
  const add = within(form).getByRole('button', { name: 'Add records' })
  expect(add).toBeDisabled()
  await user.type(
    within(kiln).getByLabelText('Why this source?'),
    'Lime is calcined in the boiler yard',
  )
  expect(add).toBeEnabled()
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
  renderPage()
  const form = screen.getByRole('form', { name: 'Import activity data' })
  await user.upload(
    within(form).getByLabelText('Spreadsheet file'),
    new File(['facility,activity_type\n'], 'march.csv', { type: 'text/csv' }),
  )

  expect(await within(form).findByText(/Nothing will import: 1 row rejected/)).toBeInTheDocument()
  expect(within(form).getByText("quantity 'abc' is not a number")).toBeInTheDocument()
  expect(within(form).getByRole('button', { name: 'Add records' })).toBeDisabled()
})

test('a facility and a month give the monthly template link (spec 04.12)', async () => {
  const user = userEvent.setup()
  renderPage()
  const form = screen.getByRole('form', { name: 'Import activity data' })
  expect(within(form).getByText('Choose the facility and the month.')).toBeInTheDocument()
  await within(form).findByRole('option', { name: 'Nkran Mine' })
  await user.selectOptions(within(form).getByLabelText('Facility'), 'fac-1')
  fireEvent.change(within(form).getByLabelText('Month'), { target: { value: '2025-09' } })
  expect(
    await within(form).findByRole('link', { name: 'Download the monthly template' }),
  ).toHaveAttribute(
    'href',
    '/api/ghg/organizations/org-1/activities/import-template.csv?facilityId=fac-1&month=2025-09',
  )
})
