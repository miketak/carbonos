import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../../test/utils'
import { LifecycleBar, describeFreezeBlockers } from './LifecycleBar'
import type { Inventory, ValidationReport } from '../api'

vi.mock('../api', () => import('../testApiMock'))

import { freezeInventory, getValidation, listBoundaryVersions, reopenInventory } from '../api'

const inventory: Inventory = {
  id: 'inv-1',
  organizationId: 'org-1',
  name: 'FY2025',
  periodStart: '2025-01-01',
  periodEnd: '2025-12-31',
  purpose: null,
  baseYear: null,
  consolidationApproach: 'OPERATIONAL_CONTROL',
  gwpSet: 'AR5',
  straddleTreatment: 'PRO_RATE',
  periodLabel: '2025',
  approvedBy: null,
  publishedBy: null,
  assuranceLevel: 'UNVERIFIED',
  assuranceProvider: null,
  assuranceStatement: null,
  uncertaintyStatement: null,
  scope3Categories: [],
  scope3ExclusionsRationale: null,
  scope3NotQuantified: [],
  residualMixAvailable: null,
  residualMixKgCo2ePerKwh: null,
  finalRunId: null,
  status: 'DRAFT',
  supersededById: null,
  copiedFromId: null,
  correctionReason: null,
  publishedAt: null,
  finalDesignatedBy: null,
  finalDesignatedAt: null,
  finalNote: null,
  currentBoundaryVersionId: null,
  currentBoundaryVersionNo: null,
  createdAt: '2026-08-29T00:00:00Z',
}

const clean: ValidationReport = {
  ready: false,
  freezeBlockers: [],
  gates: [
    {
      gate: 'BOUNDARY',
      status: 'BLOCKED',
      findings: [
        { severity: 'ERROR', message: 'The inventory is a draft. Freeze it to enable a run.' },
      ],
    },
    { gate: 'COMPLETENESS', status: 'PASSED', findings: [] },
    { gate: 'CLASSIFICATION', status: 'PASSED', findings: [] },
    { gate: 'EMISSION_FACTOR', status: 'PASSED', findings: [] },
    { gate: 'BASE_YEAR', status: 'PASSED', findings: [] },
  ],
}

beforeEach(() => {
  vi.mocked(getValidation).mockReset().mockResolvedValue(clean)
  vi.mocked(listBoundaryVersions).mockReset().mockResolvedValue([])
  vi.mocked(freezeInventory).mockReset()
  vi.mocked(reopenInventory).mockReset()
})

test('describes why a freeze is refused in one sentence (spec 05.5)', () => {
  const blocker = {
    activityId: 'a',
    recordRef: 'ACT-0001',
    activityType: 'Genset diesel',
    facilityName: 'Nkran',
    problem: 'is not classified',
  }
  expect(describeFreezeBlockers([])).toBeNull()
  expect(describeFreezeBlockers([blocker])).toBe(
    '1 record is not classified; classify or exclude it first',
  )
  expect(describeFreezeBlockers([blocker, blocker, blocker])).toBe(
    '3 records are not classified; classify or exclude them first',
  )
  expect(
    describeFreezeBlockers([{ ...blocker, problem: 'is a draft with data outstanding' }]),
  ).toBe('1 draft record at facilities in the boundary is not entered; complete or remove it first')
  expect(
    describeFreezeBlockers([
      blocker,
      { ...blocker, problem: 'is classified in scope 3 without a justification' },
    ]),
  ).toBe('2 records block the freeze; classify, justify or exclude them first')
})

test('the freeze dialog is disabled with its reason while records block the freeze', async () => {
  const user = userEvent.setup()
  vi.mocked(getValidation).mockResolvedValue({
    ...clean,
    freezeBlockers: [
      {
        activityId: 'a',
        recordRef: 'ACT-0012',
        activityType: 'Genset diesel',
        facilityName: 'Nkran',
        problem: 'is not classified',
      },
    ],
  })
  renderWithProviders(<LifecycleBar inventory={inventory} inBoundaryCount={2} />)

  await user.click(screen.getByRole('button', { name: /freeze inventory/i }))
  const dialog = await screen.findByRole('dialog', { name: /freeze the inventory/i })
  expect(within(dialog).getByText(/cuts boundary version 1/)).toBeInTheDocument()
  const confirm = within(dialog).getByRole('button', { name: /freeze inventory/i })
  await waitFor(() => expect(confirm).toBeDisabled())
  expect(confirm).toHaveAttribute(
    'title',
    '1 record is not classified; classify or exclude it first',
  )
  expect(within(dialog).getByRole('alert')).toHaveTextContent(
    /ACT-0012 'Genset diesel' at Nkran is not classified/,
  )
})

test('a clean classification freezes after the gate summary is shown', async () => {
  const user = userEvent.setup()
  vi.mocked(listBoundaryVersions).mockResolvedValue([
    {
      id: 'bv-1',
      versionNo: 1,
      consolidationApproach: 'OPERATIONAL_CONTROL',
      entityCount: 1,
      facilityCount: 2,
      frozenByUserId: null,
      frozenBy: 'kojo@ecoriv.com',
      frozenAt: '2026-09-01T10:00:00Z',
      reopenedBy: 'kojo@ecoriv.com',
      reopenedAt: '2026-09-02T10:00:00Z',
      reopenReason: 'instruments added for Nkran',
    },
  ])
  vi.mocked(freezeInventory).mockResolvedValue({
    version: {
      id: 'bv-2',
      versionNo: 2,
      consolidationApproach: 'OPERATIONAL_CONTROL',
      entityCount: 1,
      facilityCount: 2,
      frozenByUserId: null,
      frozenBy: 'kojo@ecoriv.com',
      frozenAt: '2026-09-03T10:00:00Z',
      reopenedBy: null,
      reopenedAt: null,
      reopenReason: null,
    },
    entries: [],
    exclusions: [],
  })
  renderWithProviders(<LifecycleBar inventory={inventory} inBoundaryCount={2} />)

  expect(await screen.findByText('1 boundary version cut')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /freeze inventory/i }))
  const dialog = await screen.findByRole('dialog', { name: /freeze the inventory/i })
  const summary = await within(dialog).findByRole('list', { name: /gate summary/i })
  expect(within(summary).getByText('Reporting boundary').closest('li')).toHaveTextContent('1 error')
  expect(within(dialog).getByText(/cuts boundary version 2/)).toBeInTheDocument()
  await user.click(within(dialog).getByRole('button', { name: /freeze inventory/i }))
  await waitFor(() => expect(freezeInventory).toHaveBeenCalledWith('inv-1'))
  expect(await screen.findByText(/frozen as boundary version 2/i)).toBeInTheDocument()
})

test('reopening asks for a reason of at least 10 characters and names the version it supersedes', async () => {
  const user = userEvent.setup()
  vi.mocked(reopenInventory).mockResolvedValue(inventory)
  renderWithProviders(
    <LifecycleBar
      inventory={{
        ...inventory,
        status: 'FROZEN',
        currentBoundaryVersionId: 'bv-3',
        currentBoundaryVersionNo: 3,
      }}
      inBoundaryCount={2}
    />,
  )

  expect(screen.getByText('Boundary version 3')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /reopen as draft/i }))
  const dialog = await screen.findByRole('dialog', { name: /reopen as a draft/i })
  expect(within(dialog).getByText(/Boundary version 3 stays on the record/)).toBeInTheDocument()
  const confirm = within(dialog).getByRole('button', { name: /reopen as draft/i })
  await user.type(within(dialog).getByLabelText(/reason/i), 'too short')
  expect(confirm).toBeDisabled()
  await user.clear(within(dialog).getByLabelText(/reason/i))
  await user.type(within(dialog).getByLabelText(/reason/i), 'instruments added for Nkran')
  await user.click(confirm)
  await waitFor(() =>
    expect(reopenInventory).toHaveBeenCalledWith('inv-1', 'instruments added for Nkran'),
  )
})
