import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { ApiError } from '../../lib/api'
import { BaseYearPage } from './BaseYearPage'
import type { BaseYear, Inventory, Run } from './api'

vi.mock('./api', () => import('./testApiMock'))

// forms with many fields take longer than the 15s default on a loaded machine
vi.setConfig({ testTimeout: 30000 })

import {
  decideRecalculation,
  getBaseYear,
  getOrganization,
  listInventories,
  listRuns,
  raiseRecalculation,
  setBaseYear,
} from './api'
import type { Organization } from './api'

function organization(myRole: Organization['myRole']): Organization {
  return {
    id: 'org-1',
    name: 'Ecoriv Holdings',
    accountNo: 1,
    myRole,
    address: null,
    contact: null,
    facilityCount: 3,
    supportAccess: [],
    createdAt: '2026-08-01T00:00:00Z',
  }
}

const inventory: Inventory = {
  id: 'inv-2024',
  organizationId: 'org-1',
  name: '2024 Base Year',
  periodStart: '2024-01-01',
  periodEnd: '2024-12-31',
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
  intensityMetrics: [],
  finalRunId: 'run-base',
  status: 'FINAL',
  supersededById: null,
  copiedFromId: null,
  correctionReason: null,
  publishedAt: null,
  finalDesignatedBy: null,
  finalDesignatedAt: null,
  finalNote: null,
  currentBoundaryVersionId: 'bv-1',
  currentBoundaryVersionNo: 1,
  createdAt: '2026-08-01T00:00:00Z',
}

const baseYear: BaseYear = {
  id: 'by-1',
  inventoryId: 'inv-2024',
  inventoryName: '2024 Base Year',
  year: 2024,
  thresholdPercent: 5,
  reason: 'First year with metered data for every site',
  structuralChangeConvention: 'TRANSACTION_DATE',
  baseRunId: 'run-base',
  recalculations: [
    {
      id: 'rc-1',
      triggerType: 'STRUCTURAL_CHANGE',
      reason:
        'structural change: Takoradi Port Loadout added; 4.1% of base-year emissions, below the 5% threshold, recalculation optional',
      triggeringInventoryId: 'inv-2025',
      boundaryVersionId: 'bv-2',
      boundaryVersionNo: 2,
      affectedPercent: 4.1,
      cumulativePercent: 4.1,
      aboveThreshold: false,
      raisedBy: null,
      comparisonRunId: null,
      status: 'FLAGGED',
      runId: null,
      decisionNote: null,
      decidedBy: null,
      decidedAt: null,
      createdAt: '2026-09-02T10:00:00Z',
    },
  ],
  createdAt: '2026-09-01T00:00:00Z',
}

function renderPage() {
  return renderWithProviders(<BaseYearPage />, {
    route: '/app/ghg/org-1/settings/baseline',
    path: '/app/ghg/:organizationId/settings/baseline',
  })
}

beforeEach(() => {
  vi.mocked(getBaseYear).mockReset()
  vi.mocked(listInventories).mockReset()
  vi.mocked(listRuns).mockReset()
  vi.mocked(setBaseYear).mockReset()
  vi.mocked(decideRecalculation).mockReset()
  vi.mocked(raiseRecalculation).mockReset()
  vi.mocked(getOrganization).mockReset()
  vi.mocked(listInventories).mockResolvedValue([inventory])
  vi.mocked(listRuns).mockResolvedValue([])
})

test('designating a base year records the inventory, threshold, reason and convention', async () => {
  const user = userEvent.setup()
  vi.mocked(getBaseYear).mockResolvedValue(null)
  vi.mocked(setBaseYear).mockResolvedValue({ ...baseYear, recalculations: [] })
  renderPage()

  expect(
    await screen.findByRole('heading', { name: /base year and recalculation policy/i }),
  ).toBeInTheDocument()
  await screen.findByRole('option', { name: /2024 Base Year/ })
  await user.clear(screen.getByLabelText('Significance threshold (%)'))
  await user.paste('7.5')
  await user.click(screen.getByLabelText('Why this year'))
  await user.paste('First year with metered data for every site')
  await user.selectOptions(screen.getByLabelText('Mid-year structural changes'), 'WHOLE_YEAR')
  await user.click(screen.getByRole('button', { name: /designate base year/i }))

  await waitFor(() =>
    expect(setBaseYear).toHaveBeenCalledWith('org-1', {
      inventoryId: 'inv-2024',
      thresholdPercent: 7.5,
      reason: 'First year with metered data for every site',
      structuralChangeConvention: 'WHOLE_YEAR',
    }),
  )
  expect(await screen.findByText(/base year 2024 designated/i)).toBeInTheDocument()
})

test('the inventory the select shows is the one sent, even when the list arrives after the form', async () => {
  const user = userEvent.setup()
  vi.mocked(getBaseYear).mockResolvedValue(null)
  // the list resolves after the form first renders, as it can on a slow load
  let resolveInventories: (value: Inventory[]) => void = () => {}
  vi.mocked(listInventories).mockReturnValue(
    new Promise<Inventory[]>((resolve) => {
      resolveInventories = resolve
    }),
  )
  vi.mocked(setBaseYear).mockResolvedValue({ ...baseYear, recalculations: [] })
  renderPage()

  await screen.findByRole('heading', { name: /base year and recalculation policy/i })
  resolveInventories([inventory])
  await screen.findByRole('option', { name: /2024 Base Year/ })
  await user.click(screen.getByLabelText('Why this year'))
  await user.paste('First year with metered data for every site')
  await user.click(screen.getByRole('button', { name: /designate base year/i }))

  await waitFor(() =>
    expect(setBaseYear).toHaveBeenCalledWith(
      'org-1',
      expect.objectContaining({ inventoryId: 'inv-2024' }),
    ),
  )
})

test('a base year with no reason is refused on the spot, in words', async () => {
  const user = userEvent.setup()
  vi.mocked(getBaseYear).mockResolvedValue(null)
  renderPage()

  await screen.findByRole('option', { name: /2024 Base Year/ })
  await user.click(screen.getByRole('button', { name: /designate base year/i }))

  expect(await screen.findByText('Say why this year is the base year.')).toBeInTheDocument()
  expect(setBaseYear).not.toHaveBeenCalled()
})

test('a methodology change is raised by hand with its weight', async () => {
  const user = userEvent.setup()
  vi.mocked(getBaseYear).mockResolvedValue(baseYear)
  vi.mocked(raiseRecalculation).mockResolvedValue(baseYear)
  renderPage()

  expect(await screen.findByText(/First year with metered data/)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /raise a candidate/i }))
  const dialog = await screen.findByRole('dialog', { name: /raise a recalculation candidate/i })
  await user.selectOptions(within(dialog).getByLabelText('Trigger'), 'ERROR_CORRECTION')
  await user.click(within(dialog).getByLabelText('What changed'))
  await user.paste('Mill meter under-read by 2.5%')
  await user.click(within(dialog).getByLabelText(/Affected share of base-year emissions/))
  await user.paste('2.5')
  await user.click(within(dialog).getByRole('button', { name: /^raise$/i }))

  await waitFor(() =>
    expect(raiseRecalculation).toHaveBeenCalledWith('org-1', {
      trigger: 'ERROR_CORRECTION',
      reason: 'Mill meter under-read by 2.5%',
      affectedPercent: 2.5,
    }),
  )
  expect(await screen.findByText(/recalculation candidate raised/i)).toBeInTheDocument()
})

test('a flagged candidate shows its reason and can be declined', async () => {
  const user = userEvent.setup()
  vi.mocked(getBaseYear).mockResolvedValue(baseYear)
  vi.mocked(decideRecalculation).mockResolvedValue({
    ...baseYear,
    recalculations: [{ ...baseYear.recalculations[0], status: 'DECLINED' }],
  })
  renderPage()

  expect(await screen.findByText('2024')).toBeInTheDocument()
  expect(screen.getByText(/Takoradi Port Loadout added/)).toBeInTheDocument()
  expect(screen.getByText(/4\.1% of base-year emissions, below the threshold/)).toBeInTheDocument()
  expect(screen.getByText('FLAGGED')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /^decline$/i }))
  const dialog = await screen.findByRole('dialog', { name: /decline the recalculation/i })
  await user.click(within(dialog).getByLabelText('Note (optional)'))
  await user.paste('Below threshold; base year kept.')
  await user.click(within(dialog).getByRole('button', { name: /^decline$/i }))

  await waitFor(() =>
    expect(decideRecalculation).toHaveBeenCalledWith('org-1', 'rc-1', {
      decision: 'DECLINED',
      note: 'Below threshold; base year kept.',
    }),
  )
  expect(await screen.findByText(/recalculation declined/i)).toBeInTheDocument()
})

test('a candidate can be weighed against a comparison run instead of a typed share (spec 03.4)', async () => {
  const user = userEvent.setup()
  vi.mocked(getBaseYear).mockResolvedValue(baseYear)
  vi.mocked(raiseRecalculation).mockResolvedValue(baseYear)
  renderPage()

  await screen.findByText(/First year with metered data/)
  await user.click(screen.getByRole('button', { name: /raise a candidate/i }))
  const dialog = await screen.findByRole('dialog', { name: /raise a recalculation candidate/i })
  await user.click(within(dialog).getByLabelText('What changed'))
  await user.paste('Supplier-specific grid factor')
  await user.click(within(dialog).getByLabelText('Comparison run id (optional)'))
  await user.paste('run-9')
  await user.click(within(dialog).getByRole('button', { name: /^raise$/i }))

  await waitFor(() =>
    expect(raiseRecalculation).toHaveBeenCalledWith('org-1', {
      trigger: 'METHODOLOGY_CHANGE',
      reason: 'Supplier-specific grid factor',
      affectedPercent: undefined,
      comparisonRunId: 'run-9',
    }),
  )
})

test('a verifier sees the base year and its policy, with the policy form and candidate outcomes disabled (spec 01.4)', async () => {
  vi.mocked(getBaseYear).mockResolvedValue(baseYear)
  vi.mocked(getOrganization).mockResolvedValue(organization('VERIFIER'))
  renderPage()

  expect(await screen.findByText('2024', { selector: 'dd' })).toBeInTheDocument()
  expect(screen.getByText(/First year with metered data for every site/)).toBeInTheDocument()
  expect(screen.getByText('FLAGGED')).toBeInTheDocument()

  const editPolicy = screen.getByRole('button', { name: /edit policy/i })
  expect(editPolicy).toBeDisabled()
  expect(editPolicy).toHaveAccessibleDescription('Needs the Preparer, Reviewer or Owner role.')
  expect(screen.getByRole('button', { name: /clear base year/i })).toBeDisabled()
  expect(screen.getByRole('button', { name: /raise a candidate/i })).toBeDisabled()
  expect(screen.getByRole('button', { name: /record recalculated base/i })).toBeDisabled()
  expect(screen.getByRole('button', { name: /^decline$/i })).toBeDisabled()

  // the policy form never opens: clicking a disabled control does nothing
  const user = userEvent.setup()
  await user.click(editPolicy)
  expect(screen.queryByLabelText('Significance threshold (%)')).not.toBeInTheDocument()
})

test('a verifier with no base year yet sees no designation form', async () => {
  vi.mocked(getBaseYear).mockResolvedValue(null)
  vi.mocked(getOrganization).mockResolvedValue(organization('VERIFIER'))
  renderPage()

  expect(await screen.findByText(/no base year has been designated yet/i)).toBeInTheDocument()
  expect(screen.queryByLabelText('Base-year inventory')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /designate base year/i })).not.toBeInTheDocument()
})

test('a voided run is not offered as the recalculated base (spec 05.2)', async () => {
  const user = userEvent.setup()
  const run: Run = {
    id: 'run-2',
    inventoryId: 'inv-2024',
    runNo: 2,
    label: 'Run 002',
    periodStart: '2024-01-01',
    periodEnd: '2024-12-31',
    consolidationApproach: 'OPERATIONAL_CONTROL',
    gwpSet: 'AR5',
    activityCount: 2,
    totalKgCo2e: 3012.8,
    scope1KgCo2e: 2660,
    scope2KgCo2e: 352.8,
    scope3KgCo2e: 0,
    scope2MarketBasedKgCo2e: 352.8,
    scope2MarketBasis: 'GRID_AVERAGE',
    byGas: {
      co2Kg: 3012.8,
      ch4Kg: 0,
      ch4FossilKg: 0,
      n2oKg: 0,
      hfcsKg: 0,
      pfcsKg: 0,
      hfcsKgCo2e: 0,
      pfcsKgCo2e: 0,
      sf6Kg: 0,
      nf3Kg: 0,
      co2eUnsplitKg: 0,
    },
    biogenicCo2Kg: 0,
    isFinal: false,
    voided: false,
    voidedAt: null,
    voidedBy: null,
    voidReason: null,
    boundaryVersionId: null,
    boundaryVersionNo: null,
    createdBy: null,
    createdAt: '2026-08-29T00:00:00Z',
  }
  const voided: Run = { ...run, id: 'run-1', runNo: 1, label: 'Run 001', voided: true }
  vi.mocked(getBaseYear).mockResolvedValue(baseYear)
  vi.mocked(listRuns).mockResolvedValue([run, voided])
  renderPage()

  await screen.findByText(/First year with metered data/)
  await user.click(screen.getByRole('button', { name: /record recalculated base/i }))

  expect(await screen.findByRole('option', { name: /Run 002/ })).toBeInTheDocument()
  expect(screen.queryByRole('option', { name: /Run 001/ })).not.toBeInTheDocument()
})

test('a preparer has the policy form and the candidate outcome controls enabled', async () => {
  vi.mocked(getBaseYear).mockResolvedValue(baseYear)
  vi.mocked(getOrganization).mockResolvedValue(organization('PREPARER'))
  renderPage()

  expect(await screen.findByText(/First year with metered data for every site/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /edit policy/i })).toBeEnabled()
  expect(screen.getByRole('button', { name: /clear base year/i })).toBeEnabled()
  expect(screen.getByRole('button', { name: /raise a candidate/i })).toBeEnabled()
  expect(screen.getByRole('button', { name: /record recalculated base/i })).toBeEnabled()
  expect(screen.getByRole('button', { name: /^decline$/i })).toBeEnabled()
})

test('a refused save keeps the policy form open with the typed values (spec 01.4)', async () => {
  const user = userEvent.setup()
  vi.mocked(getBaseYear).mockResolvedValue(null)
  vi.mocked(getOrganization).mockResolvedValue(organization('PREPARER'))
  vi.mocked(setBaseYear).mockRejectedValue(
    new ApiError(403, { detail: 'This action needs the PREPARER, REVIEWER or OWNER role.' }),
  )
  renderPage()

  await screen.findByRole('option', { name: /2024 Base Year/ })
  await user.click(screen.getByLabelText('Why this year'))
  await user.paste('First year with metered data for every site')
  await user.click(screen.getByRole('button', { name: /designate base year/i }))

  expect(await screen.findByRole('alert')).toHaveTextContent(
    /this action needs the preparer, reviewer or owner role/i,
  )
  // the form stays open with what was typed
  expect(screen.getByLabelText('Why this year')).toHaveValue(
    'First year with metered data for every site',
  )
})
