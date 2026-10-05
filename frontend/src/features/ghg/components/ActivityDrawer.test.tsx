import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { ApiError } from '../../../lib/api'
import { renderWithProviders } from '../../../test/utils'
import { ActivityDrawer } from './ActivityDrawer'
import type { Activity, Facility, SourceStream } from '../api'

vi.mock('../api', () => import('../testApiMock'))

import { createActivity, listOrganizationUnits, listStreams, updateActivity } from '../api'

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

const draft: Activity = {
  id: 'act-3',
  recordNo: 3,
  recordRef: 'ACT-0003',
  draft: true,
  status: 'DRAFT',
  issues: ['MISSING_QUANTITY', 'MISSING_UNIT', 'NO_STREAM', 'NO_DATA_SOURCE', 'NO_EVIDENCE'],
  facilityId: 'fac-1',
  facilityName: 'Nkran Mine',
  streamId: null,
  streamName: null,
  activityType: 'July dispensing',
  quantity: null,
  unit: null,
  periodStart: '2025-07-01',
  periodEnd: '2025-07-31',
  dataSource: null,
  evidenceRef: null,
  dataQuality: 'MEASURED',
  note: null,
  dataQualityTier: 1,
  dataQualityTierLabel: 'Metered or invoiced primary data',
  uncertaintyPercent: null,
  removed: false,
  removedAt: null,
  removedBy: null,
  removeReason: null,
  evidenceCount: 0,
  revisionCount: 0,
  importBatchId: null,
  importRow: null,
  createdAt: '2026-08-02T00:00:00Z',
}

const nextRecord: Activity = { ...draft, id: 'act-4', recordNo: 4, recordRef: 'ACT-0004' }

const fact: Activity = {
  ...draft,
  draft: false,
  status: 'NEEDS_ATTENTION',
  issues: ['NO_STREAM'],
  quantity: 12500,
  unit: 'litre',
  dataSource: 'Dispensing log',
}

const haulFleet: SourceStream = {
  id: 'str-1',
  facilityId: 'fac-1',
  facilityName: 'Nkran Mine',
  name: 'Haul fleet',
  kind: 'MOBILE_COMBUSTION',
  fuel: 'Diesel',
  meterOrSupplier: null,
  contractorOperated: false,
  note: null,
  defaultScope: 'SCOPE_1',
  defaultCategory: 'MOBILE_COMBUSTION',
  allowedCategories: ['MOBILE_COMBUSTION'],
  origin: 'REGISTER',
  createdAt: '2026-09-01T00:00:00Z',
}

function renderDrawer(
  activityId: string,
  pageItems: Activity[],
  options: {
    myRole?: 'PREPARER' | 'REVIEWER' | 'OWNER' | 'VERIFIER' | 'ADMIN'
    facilities?: Facility[]
  } = {},
) {
  const onNavigate = vi.fn()
  const onSaved = vi.fn()
  renderWithProviders(
    <ActivityDrawer
      organizationId="org-1"
      activityId={activityId}
      pageItems={pageItems}
      facilities={options.facilities ?? [facility]}
      myRole={options.myRole}
      onNavigate={onNavigate}
      onClose={vi.fn()}
      onSaved={onSaved}
      onHistory={vi.fn()}
      onRemove={vi.fn()}
    />,
  )
  return { onNavigate, onSaved }
}

beforeEach(() => {
  vi.mocked(listStreams).mockReset().mockResolvedValue([])
  vi.mocked(listOrganizationUnits)
    .mockReset()
    .mockResolvedValue([
      {
        code: 'litre',
        label: 'Litre',
        dimension: 'VOLUME',
        toCanonical: 0.001,
        custom: false,
        definition: null,
      },
    ])
  vi.mocked(createActivity).mockReset()
  vi.mocked(updateActivity).mockReset()
})

test('a new record saves as a draft with only an activity and a facility (spec 04.6)', async () => {
  const user = userEvent.setup()
  vi.mocked(createActivity).mockResolvedValue({ ...draft, id: 'act-9', recordRef: 'ACT-0009' })
  const { onNavigate, onSaved } = renderDrawer('new', [])

  const drawer = screen.getByRole('region', { name: 'New activity' })
  await user.type(within(drawer).getByLabelText('Activity type *'), 'July dispensing')
  await user.click(within(drawer).getByRole('button', { name: 'Save draft' }))

  await waitFor(() => expect(createActivity).toHaveBeenCalled())
  expect(vi.mocked(createActivity).mock.calls[0][1]).toMatchObject({
    draft: true,
    facilityId: 'fac-1',
    activityType: 'July dispensing',
  })
  expect(vi.mocked(createActivity).mock.calls[0][1].quantity).toBeUndefined()
  await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Draft saved.'))
  expect(onNavigate).toHaveBeenCalledWith('act-9')
})

test('saving a fact without its figures is refused on the spot', async () => {
  const user = userEvent.setup()
  renderDrawer('new', [])
  const drawer = screen.getByRole('region', { name: 'New activity' })
  await user.type(within(drawer).getByLabelText('Activity type *'), 'July dispensing')
  await user.click(within(drawer).getByRole('button', { name: 'Save' }))

  expect(await within(drawer).findByText('Enter quantity.')).toBeInTheDocument()
  expect(within(drawer).getByText('Choose a unit.')).toBeInTheDocument()
  expect(within(drawer).getByText('Enter the period start.')).toBeInTheDocument()
  expect(createActivity).not.toHaveBeenCalled()
})

test('a draft is entered without a reason, and Save & next moves to the next record', async () => {
  const user = userEvent.setup()
  vi.mocked(updateActivity).mockResolvedValue({ ...draft, draft: false, status: 'NEEDS_ATTENTION' })
  const { onNavigate, onSaved } = renderDrawer('act-3', [draft, nextRecord])

  const drawer = screen.getByRole('region', { name: 'July dispensing' })
  expect(within(drawer).getByText('A draft, not yet a fact.')).toBeInTheDocument()
  expect(within(drawer).getByText('1/2')).toBeInTheDocument()
  expect(within(drawer).queryByLabelText('Reason for the correction *')).not.toBeInTheDocument()
  await user.type(within(drawer).getByLabelText('Activity quantity *'), '12500')
  await user.selectOptions(await within(drawer).findByLabelText('Unit'), 'litre')
  await user.click(within(drawer).getByRole('button', { name: 'Save & next →' }))

  await waitFor(() => expect(updateActivity).toHaveBeenCalled())
  expect(vi.mocked(updateActivity).mock.calls[0]).toEqual([
    'act-3',
    expect.objectContaining({
      draft: false,
      quantity: 12500,
      unit: 'litre',
      periodStart: '2025-07-01',
    }),
  ])
  expect(vi.mocked(updateActivity).mock.calls[0][1].reason).toBeUndefined()
  await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Record entered. It is now a fact.'))
  expect(onNavigate).toHaveBeenCalledWith('act-4')
})

test('a server field error lands beside its field', async () => {
  const user = userEvent.setup()
  const { ApiError } = await import('../../../lib/api')
  vi.mocked(updateActivity).mockRejectedValue(
    new ApiError(422, {
      title: 'Invalid request',
      errors: { unit: 'A unit is required unless the record is saved as a draft.' },
    }),
  )
  renderDrawer('act-3', [draft])
  const drawer = screen.getByRole('region', { name: 'July dispensing' })
  await user.type(within(drawer).getByLabelText('Activity quantity *'), '12500')
  await user.selectOptions(await within(drawer).findByLabelText('Unit'), 'litre')
  await user.click(within(drawer).getByRole('button', { name: 'Save' }))

  expect(
    await within(drawer).findByText('A unit is required unless the record is saved as a draft.'),
  ).toBeInTheDocument()
})

test('a 403 on save shows the refusal sentence in the drawer and keeps the typed values (spec 01.4)', async () => {
  const user = userEvent.setup()
  const { ApiError } = await import('../../../lib/api')
  vi.mocked(updateActivity).mockRejectedValue(
    new ApiError(403, {
      title: 'Forbidden',
      detail: 'This action needs the PREPARER, REVIEWER or OWNER role in the organization.',
    }),
  )
  renderDrawer('act-3', [draft], { myRole: 'PREPARER' })
  const drawer = screen.getByRole('region', { name: 'July dispensing' })
  await user.type(within(drawer).getByLabelText('Activity quantity *'), '12500')
  await user.selectOptions(await within(drawer).findByLabelText('Unit'), 'litre')
  await user.click(within(drawer).getByRole('button', { name: 'Save' }))

  const alert = await within(drawer).findByRole('alert')
  expect(alert).toHaveTextContent(
    'This action needs the PREPARER, REVIEWER or OWNER role in the organization.',
  )
  expect(screen.getByRole('region', { name: 'July dispensing' })).toBeInTheDocument()
  expect(within(drawer).getByLabelText('Activity quantity *')).toHaveValue(12500)
})

test('a verifier opens a drawer with no fields and no Save (spec 01.4)', async () => {
  renderDrawer('act-3', [draft], { myRole: 'VERIFIER' })
  const drawer = screen.getByRole('region', { name: 'July dispensing' })

  expect(within(drawer).queryByLabelText('Activity type *')).not.toBeInTheDocument()
  expect(within(drawer).queryByLabelText('Activity quantity *')).not.toBeInTheDocument()
  expect(within(drawer).queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
  expect(within(drawer).queryByRole('button', { name: 'Save draft' })).not.toBeInTheDocument()
  expect(within(drawer).getByText('ACT-0003')).toBeInTheDocument()
})

test('naming an emission source on a saved fact asks for the reason instead of a dead Save button', async () => {
  const user = userEvent.setup()
  vi.mocked(listStreams).mockResolvedValue([haulFleet])
  vi.mocked(updateActivity).mockResolvedValue({
    ...fact,
    streamId: 'str-1',
    streamName: 'Haul fleet',
  })
  const { onSaved } = renderDrawer('act-3', [fact])

  const drawer = screen.getByRole('region', { name: 'July dispensing' })
  await within(drawer).findByRole('option', { name: 'Haul fleet' })
  await user.selectOptions(within(drawer).getByLabelText('Emission source'), 'str-1')
  expect(within(drawer).getByText(/Source default:/)).toBeInTheDocument()

  const save = within(drawer).getByRole('button', { name: 'Save' })
  expect(save).toBeEnabled()
  await user.click(save)

  expect(
    await within(drawer).findByText('A correction needs a reason of at least 5 characters.'),
  ).toBeInTheDocument()
  expect(within(drawer).getByLabelText('Reason for the correction *')).toHaveFocus()
  expect(updateActivity).not.toHaveBeenCalled()

  await user.type(
    within(drawer).getByLabelText('Reason for the correction *'),
    'Stream register added after the record',
  )
  await user.click(within(drawer).getByRole('button', { name: 'Save' }))

  await waitFor(() => expect(updateActivity).toHaveBeenCalled())
  expect(vi.mocked(updateActivity).mock.calls[0]).toEqual([
    'act-3',
    expect.objectContaining({
      draft: false,
      streamId: 'str-1',
      reason: 'Stream register added after the record',
    }),
  ])
  await waitFor(() =>
    expect(onSaved).toHaveBeenCalledWith('Record corrected. Past runs are unaffected.'),
  )
})

test('a document reference with no file reads as a reference, not as nothing (spec 04.6)', async () => {
  renderDrawer('act-3', [{ ...fact, evidenceRef: 'WB-2025-11' }])
  const drawer = screen.getByRole('region', { name: 'July dispensing' })

  expect(within(drawer).getByText('Reference WB-2025-11, nothing attached')).toBeInTheDocument()
})

// --- an emission source described on the record (spec 04.10) ---------------------

const similarRefusal = new ApiError(409, {
  rule: 'ghg.stream.name-similar',
  detail:
    "'Nkran Mine' has an emission source with a similar name: 'Haul fleet'. Use it, or give a reason to create 'Haul fleets' as a separate source.",
  candidates: [
    {
      id: 'str-1',
      name: 'Haul fleet',
      kind: 'MOBILE_COMBUSTION',
      defaultScope: 'SCOPE_1',
      defaultCategory: 'MOBILE_COMBUSTION',
    },
  ],
})

async function describeNewSource(
  user: ReturnType<typeof userEvent.setup>,
  drawer: HTMLElement,
  name: string,
) {
  await user.type(within(drawer).getByLabelText('Activity type *'), 'Haul fleet diesel')
  await user.selectOptions(within(drawer).getByLabelText('Emission source'), 'New emission source…')
  const panel = within(drawer).getByRole('group', { name: 'New emission source' })
  await user.type(within(panel).getByLabelText('Source name *'), name)
  return panel
}

test('a new record describes its emission source, which is saved with it (spec 04.10)', async () => {
  const user = userEvent.setup()
  vi.mocked(createActivity).mockResolvedValue({ ...draft, id: 'act-9', recordRef: 'ACT-0009' })
  renderDrawer('new', [])
  const drawer = screen.getByRole('region', { name: 'New activity' })
  expect(within(drawer).getByText(/no emission sources yet/)).toBeInTheDocument()

  const panel = await describeNewSource(user, drawer, 'Haul fleet')
  expect(
    within(panel).getByText(/Added to Nkran Mine when the record is saved/),
  ).toBeInTheDocument()
  await user.selectOptions(within(panel).getByLabelText('Kind'), 'MOBILE_COMBUSTION')
  await user.type(within(panel).getByLabelText('Fuel or material (optional)'), 'Diesel')
  await user.click(within(drawer).getByRole('button', { name: 'Save draft' }))

  await waitFor(() => expect(createActivity).toHaveBeenCalled())
  const input = vi.mocked(createActivity).mock.calls[0][1]
  expect(input.streamId).toBeUndefined()
  expect(input.confirmNewStreamReason).toBeUndefined()
  expect(input.newStream).toEqual({
    name: 'Haul fleet',
    kind: 'MOBILE_COMBUSTION',
    fuel: 'Diesel',
    meterOrSupplier: undefined,
    contractorOperated: false,
  })
})

test('a source without a name is refused on the spot, and choosing a facility closes the panel', async () => {
  const user = userEvent.setup()
  const camp: Facility = { ...facility, id: 'fac-2', name: 'Nkran Camp' }
  renderDrawer('new', [], { facilities: [facility, camp] })
  const drawer = screen.getByRole('region', { name: 'New activity' })
  await user.type(within(drawer).getByLabelText('Activity type *'), 'Camp LPG')
  await user.selectOptions(within(drawer).getByLabelText('Emission source'), 'New emission source…')
  await user.click(within(drawer).getByRole('button', { name: 'Save draft' }))

  expect(await within(drawer).findByText("Enter the source's name.")).toBeInTheDocument()
  expect(createActivity).not.toHaveBeenCalled()

  await user.selectOptions(within(drawer).getByLabelText('Facility *'), 'fac-2')
  expect(
    within(drawer).queryByRole('group', { name: 'New emission source' }),
  ).not.toBeInTheDocument()
  expect(within(drawer).getByLabelText('Emission source')).toHaveValue('')
})

test('a near name is answered with the candidates, and Use attaches the existing source with one click', async () => {
  const user = userEvent.setup()
  vi.mocked(listStreams).mockResolvedValue([haulFleet])
  vi.mocked(createActivity)
    .mockRejectedValueOnce(similarRefusal)
    .mockResolvedValueOnce({ ...draft, id: 'act-9', streamId: 'str-1', streamName: 'Haul fleet' })
  const { onSaved } = renderDrawer('new', [])
  const drawer = screen.getByRole('region', { name: 'New activity' })

  await describeNewSource(user, drawer, 'Haul fleets')
  await user.click(within(drawer).getByRole('button', { name: 'Save draft' }))

  const notice = await within(drawer).findByRole('alert')
  expect(notice).toHaveTextContent(
    "'Nkran Mine' has an emission source with a similar name: 'Haul fleet'.",
  )
  expect(notice).toHaveTextContent(
    'Haul fleet · Mobile combustion · defaults to Scope 1, Mobile combustion',
  )
  expect(within(notice).getByRole('button', { name: "Create 'Haul fleets' anyway" })).toBeDisabled()
  await user.click(within(notice).getByRole('button', { name: 'Use Haul fleet' }))

  await waitFor(() => expect(createActivity).toHaveBeenCalledTimes(2))
  const retry = vi.mocked(createActivity).mock.calls[1][1]
  expect(retry.streamId).toBe('str-1')
  expect(retry.newStream).toBeUndefined()
  await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Draft saved.'))
  expect(within(drawer).queryByRole('alert')).not.toBeInTheDocument()
})

test('Create anyway needs a reason of 10 characters, which goes with the request', async () => {
  const user = userEvent.setup()
  vi.mocked(listStreams).mockResolvedValue([haulFleet])
  vi.mocked(createActivity)
    .mockRejectedValueOnce(similarRefusal)
    .mockResolvedValueOnce({ ...draft, id: 'act-9', streamId: 'str-2', streamName: 'Haul fleets' })
  renderDrawer('new', [])
  const drawer = screen.getByRole('region', { name: 'New activity' })

  await describeNewSource(user, drawer, 'Haul fleets')
  await user.click(within(drawer).getByRole('button', { name: 'Save draft' }))
  const notice = await within(drawer).findByRole('alert')
  const anyway = within(notice).getByRole('button', { name: "Create 'Haul fleets' anyway" })
  await user.type(within(notice).getByLabelText('Why is this a different source?'), 'Too short')
  expect(anyway).toBeDisabled()
  await user.type(
    within(notice).getByLabelText('Why is this a different source?'),
    ', the contractor fleet',
  )
  expect(anyway).toBeEnabled()
  await user.click(anyway)

  await waitFor(() => expect(createActivity).toHaveBeenCalledTimes(2))
  const retry = vi.mocked(createActivity).mock.calls[1][1]
  expect(retry.newStream?.name).toBe('Haul fleets')
  expect(retry.confirmNewStreamReason).toBe('Too short, the contractor fleet')
})

test('the exact name is taken: the notice offers the existing source and no "anyway"', async () => {
  const user = userEvent.setup()
  vi.mocked(listStreams).mockResolvedValue([haulFleet])
  vi.mocked(createActivity).mockRejectedValueOnce(
    new ApiError(409, {
      rule: 'ghg.stream.name-duplicate',
      detail: "'Nkran Mine' already has an emission source named 'haul fleet'.",
      candidates: [
        {
          id: 'str-1',
          name: 'Haul fleet',
          kind: 'MOBILE_COMBUSTION',
          defaultScope: 'SCOPE_1',
          defaultCategory: 'MOBILE_COMBUSTION',
        },
      ],
    }),
  )
  renderDrawer('new', [])
  const drawer = screen.getByRole('region', { name: 'New activity' })

  await describeNewSource(user, drawer, 'haul fleet')
  await user.click(within(drawer).getByRole('button', { name: 'Save draft' }))

  const notice = await within(drawer).findByRole('alert')
  expect(notice).toHaveTextContent(
    "'Nkran Mine' already has an emission source named 'haul fleet'.",
  )
  expect(notice).toHaveTextContent('The name is taken: use it, or change the name.')
  expect(within(notice).getByRole('button', { name: 'Use Haul fleet' })).toBeEnabled()
  expect(within(notice).queryByLabelText('Why is this a different source?')).not.toBeInTheDocument()
  expect(within(notice).queryByRole('button', { name: /anyway/ })).not.toBeInTheDocument()
})
