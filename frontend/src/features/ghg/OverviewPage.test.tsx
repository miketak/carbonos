import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { OverviewPage } from './OverviewPage'
import type { Facility, Inventory, Organization, Run } from './api'

vi.mock('./api', () => import('./testApiMock'))

import {
  addMember,
  getOrganization,
  searchActivities,
  listFacilities,
  listInventories,
  listMembers,
  listRuns,
} from './api'

const organization: Organization = {
  id: 'org-1',
  name: 'Ecoriv Holdings',
  myRole: 'OWNER',
  address: null,
  contact: null,
  facilityCount: 1,
  createdAt: '2026-08-01T00:00:00Z',
}

const facility: Facility = {
  id: 'fac-1',
  name: 'Tema Plant',
  location: 'Tema',
  country: null,
  gridRegion: null,
  effectiveGridRegion: null,
  facilityType: null,
  leaseType: null,
  leaseFrom: null,
  leaseTo: null,
  entityId: 'ent-1',
  entityName: 'Ecoriv Holdings',
  relationshipType: 'SUBSIDIARY',
  createdAt: '2026-08-01T00:00:00Z',
}

const inventory: Inventory = {
  id: 'inv-1',
  organizationId: 'org-1',
  name: '2025 Corporate Inventory',
  periodStart: '2025-01-01',
  periodEnd: '2025-12-31',
  purpose: 'Corporate reporting',
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
  finalRunId: 'run-1',
  status: 'FINAL',
  supersededById: null,
  copiedFromId: null,
  correctionReason: null,
  publishedAt: null,
  currentBoundaryVersionId: 'bv-1',
  currentBoundaryVersionNo: 1,
  createdAt: '2026-08-29T00:00:00Z',
}

const run: Run = {
  id: 'run-1',
  inventoryId: 'inv-1',
  runNo: 1,
  label: 'Run 004',
  periodStart: '2025-01-01',
  periodEnd: '2025-12-31',
  consolidationApproach: 'OPERATIONAL_CONTROL',
  gwpSet: 'AR5',
  activityCount: 2,
  totalKgCo2e: 3012.8,
  scope1KgCo2e: 2660,
  scope2KgCo2e: 352.8,
  scope3KgCo2e: 0,
  scope2MarketBasedKgCo2e: 1000,
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
  isFinal: true,
  voided: false,
  voidedAt: null,
  voidedBy: null,
  voidReason: null,
  boundaryVersionId: 'bv-1',
  boundaryVersionNo: 1,
  createdBy: null,
  createdAt: '2026-08-29T00:00:00Z',
}

function renderOverviewPage() {
  return renderWithProviders(<OverviewPage />, {
    route: '/app/ghg/org-1',
    path: '/app/ghg/:organizationId',
  })
}

beforeEach(() => {
  vi.mocked(getOrganization).mockReset()
  vi.mocked(listFacilities).mockReset()
  vi.mocked(listMembers)
    .mockReset()
    .mockResolvedValue([
      {
        id: 'm-1',
        userId: 'user-1',
        email: 'ama@ecoriv.test',
        displayName: 'Ama Mensah',
        role: 'OWNER',
        createdAt: '2026-09-01T10:00:00Z',
      },
    ])
  vi.mocked(addMember).mockReset()
  vi.mocked(searchActivities).mockReset()
  vi.mocked(listInventories).mockReset()
  vi.mocked(listRuns).mockReset()
  vi.mocked(getOrganization).mockResolvedValue(organization)
})

test('walks a new organization from facts to a final inventory', async () => {
  vi.mocked(listFacilities).mockResolvedValue([])
  vi.mocked(searchActivities).mockResolvedValue({
    items: [],
    page: 0,
    size: 1,
    total: 0,
    counts: { total: 0, ready: 0, readyWithDocument: 0, needsAttention: 0, drafts: 0 },
  })
  vi.mocked(listInventories).mockResolvedValue([])
  renderOverviewPage()

  expect(
    await screen.findByRole('heading', { name: /from facts to a final inventory/i }),
  ).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /add facilities/i })).toHaveAttribute(
    'href',
    '/app/ghg/org-1/facilities',
  )
  // only the next incomplete step gets a call to action
  expect(screen.queryByRole('link', { name: /create inventory/i })).not.toBeInTheDocument()
})

test('points at inventories once facts exist', async () => {
  vi.mocked(listFacilities).mockResolvedValue([facility])
  vi.mocked(searchActivities).mockResolvedValue({
    items: [
      {
        id: 'act-1',
        facilityId: 'fac-1',
        facilityName: 'Tema Plant',
        streamId: null,
        streamName: null,
        activityType: 'Diesel consumption',
        quantity: 100,
        unit: 'litre',
        periodStart: '2025-03-15',
        periodEnd: '2025-03-15',
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
        recordNo: 1,
        recordRef: 'ACT-0001',
        draft: false,
        status: 'NEEDS_ATTENTION',
        issues: ['NO_STREAM'],
        importBatchId: null,
        importRow: null,
        createdAt: '2026-08-02T00:00:00Z',
      },
    ],
    page: 0,
    size: 1,
    total: 1,
    counts: { total: 1, ready: 0, readyWithDocument: 0, needsAttention: 1, drafts: 0 },
  })
  vi.mocked(listInventories).mockResolvedValue([])
  renderOverviewPage()

  expect(await screen.findByRole('link', { name: /create inventory/i })).toHaveAttribute(
    'href',
    '/app/ghg/org-1/inventories',
  )
})

test('shows the headline inventory with its final run once one exists', async () => {
  vi.mocked(listFacilities).mockResolvedValue([facility])
  vi.mocked(searchActivities).mockResolvedValue({
    items: [
      {
        id: 'act-1',
        facilityId: 'fac-1',
        facilityName: 'Tema Plant',
        streamId: null,
        streamName: null,
        activityType: 'Diesel consumption',
        quantity: 100,
        unit: 'litre',
        periodStart: '2025-03-15',
        periodEnd: '2025-03-15',
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
        recordNo: 1,
        recordRef: 'ACT-0001',
        draft: false,
        status: 'NEEDS_ATTENTION',
        issues: ['NO_STREAM'],
        importBatchId: null,
        importRow: null,
        createdAt: '2026-08-02T00:00:00Z',
      },
    ],
    page: 0,
    size: 1,
    total: 1,
    counts: { total: 1, ready: 0, readyWithDocument: 0, needsAttention: 1, drafts: 0 },
  })
  vi.mocked(listInventories).mockResolvedValue([inventory])
  vi.mocked(listRuns).mockResolvedValue([run])
  renderOverviewPage()

  expect(await screen.findByText('2025 Corporate Inventory')).toBeInTheDocument()
  expect(await screen.findByText('3.01 t CO₂e')).toBeInTheDocument()
  expect(screen.getByText('FINAL')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /view report/i })).toHaveAttribute(
    'href',
    '/app/ghg/org-1/inventories/inv-1/runs/run-1',
  )
  // every step is done, so the checklist retires
  expect(screen.queryByText(/from facts to a final inventory/i)).not.toBeInTheDocument()
})

test('an owner sees the members and adds one by email with a role', async () => {
  const user = userEvent.setup()
  vi.mocked(addMember).mockResolvedValue({
    id: 'm-2',
    userId: 'user-2',
    email: 'abena@client.test',
    displayName: 'Abena Owusu',
    role: 'PREPARER',
    createdAt: '2026-09-02T10:00:00Z',
  })
  renderOverviewPage()

  expect(await screen.findByText('Ama Mensah')).toBeInTheDocument()
  expect(screen.getByLabelText('Role of Ama Mensah')).toHaveValue('OWNER')
  await user.type(screen.getByLabelText(/email of an existing account/i), 'abena@client.test')
  await user.click(screen.getByRole('button', { name: /add member/i }))
  await waitFor(() =>
    expect(addMember).toHaveBeenCalledWith('org-1', {
      email: 'abena@client.test',
      role: 'PREPARER',
    }),
  )
})
