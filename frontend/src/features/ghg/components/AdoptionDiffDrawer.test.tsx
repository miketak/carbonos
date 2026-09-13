import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../../test/utils'
import { ApiError } from '../../../lib/api'
import { AdoptionDiffDrawer } from './AdoptionDiffDrawer'
import type { MyRole } from '../roles'

vi.mock('../api', () => import('../testApiMock'))

import { acceptFactorPackNotice, declineFactorPackNotice, getFactorPackDiff } from '../api'
import type { FactorPackDiff, FactorPackNotice } from '../api'

const notice: FactorPackNotice = {
  id: 'notice-1',
  editionId: 'sector-mining-2027',
  editionName: 'Mining sector pack 2027',
  packKey: 'sector-mining',
  predecessorEditionId: 'sector-mining-2026',
  status: 'OPEN',
  editionStatus: 'PUBLISHED',
  withdrawalReason: null,
  appliesFrom: '2027-01-01',
  raisedAt: '2026-09-12T09:30:00Z',
  rowsAffected: 2,
  rowsOverThreshold: 1,
  estimatedKgCo2eDelta: 1400,
  scopesAffected: 'SCOPE_1',
  diffHash: 'abc123'.padEnd(64, '0'),
  decidedAt: null,
  decidedBy: null,
  decidedByRole: null,
  recalculationCase: null,
  decisionNote: null,
  significanceThresholdPercent: null,
  affectedPercent: null,
  recalculationId: null,
  appliedAt: null,
}

const diff: FactorPackDiff = {
  noticeId: 'notice-1',
  editionId: 'sector-mining-2027',
  editionName: 'Mining sector pack 2027',
  predecessorEditionId: 'sector-mining-2026',
  appliesFrom: '2027-01-01',
  status: 'OPEN',
  rows: [
    {
      code: 'DESNZ:diesel',
      name: 'Diesel (average biofuel blend)',
      unit: 'litre',
      currentKgCo2ePerUnit: 2.66,
      newKgCo2ePerUnit: 2.8,
      absoluteChange: 0.14,
      percentChange: 5.2632,
      gasesChanged: ['CO2', 'CH4'],
      provenanceChanged: true,
      gwpBasisChanged: false,
      estimatedKgCo2eDelta: 1400,
    },
  ],
  conflicts: [
    {
      code: 'DESNZ:petrol',
      name: 'Petrol',
      reason: 'Edited here, so the import never touches it.',
    },
  ],
  blocked: [{ code: 'DESNZ:coal', name: 'Coal', reason: 'Used by a period that is frozen.' }],
  discontinued: [
    { code: 'DESNZ:lubricants', name: 'Lubricants', reason: 'The new edition drops this lineage.' },
  ],
  earlierPeriods: [
    {
      inventoryId: 'inv-2025',
      name: '2025',
      periodStart: '2025-01-01',
      periodEnd: '2025-12-31',
      status: 'PUBLISHED',
    },
  ],
  estimatedKgCo2eDelta: 1400,
  diffHash: 'abc123'.padEnd(64, '0'),
  gwpBasisChanged: false,
  currentGwpBasis: 'AR5',
  newGwpBasis: 'AR5',
  estimatedOver: '2027 draft',
  lockedPeriod: null,
  hasBaseYear: true,
  thresholdPercent: 5,
  affectedPercent: 5.26,
  recalculationWarning:
    'Accepting raises a base-year recalculation candidate. If it is above your significance threshold, inventories that report against the base year cannot be marked final or published until the recalculation is completed or declined.',
}

function renderDrawer(myRole: MyRole = 'OWNER', notices: FactorPackNotice = notice) {
  return renderWithProviders(
    <AdoptionDiffDrawer
      organizationId="org-1"
      notice={notices}
      myRole={myRole}
      onClose={() => {}}
    />,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getFactorPackDiff).mockResolvedValue(diff)
  vi.mocked(acceptFactorPackNotice).mockResolvedValue({
    edition: 'sector-mining-2027',
    appliesFrom: '2027-01-01',
    created: 1,
    versioned: 1,
    tagged: 0,
    unchanged: 0,
    skippedUnits: [],
    conflicts: [],
    discontinued: [],
    splitPeriods: [],
  })
  vi.mocked(declineFactorPackNotice).mockResolvedValue({ ...notice, status: 'DECLINED' })
})

test('the diff shows the per-row change and the four groups the decision does not apply to', async () => {
  renderDrawer()

  const row = (await screen.findByText('Diesel (average biofuel blend)')).closest('tr')
  const cells = within(row as HTMLElement)
  expect(cells.getByText('2.66')).toBeInTheDocument()
  expect(cells.getByText('2.8')).toBeInTheDocument()
  expect(cells.getByText('+5.2632%')).toBeInTheDocument()
  expect(cells.getByText(/Gases changed: CO2, CH4/)).toBeInTheDocument()
  expect(cells.getByText(/Provenance changed/)).toBeInTheDocument()
  expect(cells.getByText(/\+1\.4 t/)).toBeInTheDocument()

  expect(screen.getByText('Conflicts (1)')).toBeInTheDocument()
  expect(screen.getByText('Blocked (1)')).toBeInTheDocument()
  expect(screen.getByText('Discontinued (1)')).toBeInTheDocument()
  expect(screen.getByText('Earlier periods (1)')).toBeInTheDocument()
  expect(screen.getByText(/what a vintage means/)).toBeInTheDocument()
})

test('the decision screen warns about the hold before accepting, in the words the spec fixes', async () => {
  renderDrawer()

  expect(await screen.findByRole('note')).toHaveTextContent(
    'Accepting raises a base-year recalculation candidate. If it is above your significance ' +
      'threshold, inventories that report against the base year cannot be marked final or ' +
      'published until the recalculation is completed or declined.',
  )
})

test('a preparer reads the diff but cannot accept, and the button says which role it needs', async () => {
  renderDrawer('PREPARER')

  await screen.findByText('Diesel (average biofuel blend)')
  expect(screen.getByRole('button', { name: /Accept/ })).toBeDisabled()
  expect(screen.getByRole('button', { name: /Decline/ })).toBeDisabled()
  expect(screen.getAllByText('Needs the Reviewer or Owner role.').length).toBeGreaterThan(0)
})

test('accepting requires the recalculation answer, then sends it', async () => {
  const user = userEvent.setup()
  renderDrawer()

  await screen.findByText('Diesel (average biofuel blend)')
  // the answer is required: the control is disabled until the question is answered
  expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled()

  await user.selectOptions(
    screen.getByLabelText(/How does chapter 5 treat this adoption/),
    'VINTAGE_PROGRESSION',
  )
  await user.type(screen.getByLabelText(/Note/), 'The 2027 tables are the current vintage.')
  await user.click(screen.getByRole('button', { name: 'Accept' }))

  await waitFor(() =>
    expect(acceptFactorPackNotice).toHaveBeenCalledWith('notice-1', {
      recalculationCase: 'VINTAGE_PROGRESSION',
      note: 'The 2027 tables are the current vintage.',
    }),
  )
})

test('declining sends the note and never asks the recalculation question', async () => {
  const user = userEvent.setup()
  renderDrawer()

  await screen.findByText('Diesel (average biofuel blend)')
  await user.type(screen.getByLabelText(/Note/), 'We report 2027 on the 2026 tables.')
  await user.click(screen.getByRole('button', { name: 'Decline' }))

  await waitFor(() =>
    expect(declineFactorPackNotice).toHaveBeenCalledWith('notice-1', {
      note: 'We report 2027 on the 2026 tables.',
    }),
  )
})

test('a locked period is named in place, and the refusal is rendered where the decision is made', async () => {
  vi.mocked(getFactorPackDiff).mockResolvedValue({
    ...diff,
    lockedPeriod: {
      inventoryId: 'inv-2027',
      name: '2027',
      periodStart: '2027-01-01',
      periodEnd: '2027-12-31',
      status: 'FROZEN',
    },
  })
  vi.mocked(acceptFactorPackNotice).mockRejectedValue(
    new ApiError(409, {
      detail: "'sector-mining-2027' applies from 2027-01-01, which falls inside '2027'.",
    }),
  )
  const user = userEvent.setup()
  renderDrawer()

  expect(await screen.findByText(/falls inside 2027/)).toBeInTheDocument()

  await user.selectOptions(
    screen.getByLabelText(/How does chapter 5 treat this adoption/),
    'VINTAGE_PROGRESSION',
  )
  await user.click(screen.getByRole('button', { name: 'Accept' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('which falls inside')
})

test('a GWP basis change is shown as a banner, because chapter 1 allows one basis', async () => {
  vi.mocked(getFactorPackDiff).mockResolvedValue({
    ...diff,
    gwpBasisChanged: true,
    currentGwpBasis: 'AR5',
    newGwpBasis: 'AR6',
  })
  renderDrawer()

  expect(
    await screen.findByText(/moves the Global Warming Potential basis from AR5 to AR6/),
  ).toBeInTheDocument()
})
