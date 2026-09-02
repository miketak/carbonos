import { screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { RunDetailPage } from './RunDetailPage'
import type { Inventory, RunDetail } from './api'

vi.mock('./api', () => import('./testApiMock'))

import { getBoundaryVersion, getInventory, getRun } from './api'

const inventory: Inventory = {
  id: 'inv-1',
  organizationId: 'org-1',
  name: '2025 Corporate Inventory',
  periodStart: '2025-01-01',
  periodEnd: '2025-12-31',
  purpose: null,
  baseYear: null,
  consolidationApproach: 'EQUITY_SHARE',
  finalRunId: null,
  boundaryStatus: 'FROZEN',
  currentBoundaryVersionId: 'bv-1',
  currentBoundaryVersionNo: 1,
  createdAt: '2026-08-29T00:00:00Z',
}

const detail: RunDetail = {
  run: {
    id: 'run-1',
    inventoryId: 'inv-1',
    label: 'Run 001',
    periodStart: '2025-01-01',
    periodEnd: '2025-12-31',
    consolidationApproach: 'EQUITY_SHARE',
    activityCount: 1,
    totalKgCo2e: 1064,
    scope1KgCo2e: 1064,
    scope2KgCo2e: 0,
    scope3KgCo2e: 0,
    isFinal: false,
    boundaryVersionId: 'bv-1',
    boundaryVersionNo: 1,
    createdAt: '2026-08-29T00:00:00Z',
  },
  lines: [
    {
      id: 'line-1',
      activityId: 'act-1',
      facilityName: 'Tema Plant',
      factorName: 'Diesel',
      scope: 'SCOPE_1',
      category: 'MOBILE_COMBUSTION',
      quantity: 1000,
      unit: 'litre',
      factorUnit: 'litre',
      convertedQuantity: 1000,
      conversionFactor: 1,
      kgCo2ePerUnit: 2.66,
      weight: 0.4,
      kgCo2e: 1064,
    },
  ],
}

function renderRunDetailPage() {
  return renderWithProviders(<RunDetailPage />, {
    route: '/app/ghg/org-1/inventories/inv-1/runs/run-1',
    path: '/app/ghg/:organizationId/inventories/:inventoryId/runs/:runId',
  })
}

beforeEach(() => {
  vi.mocked(getRun).mockReset()
  vi.mocked(getInventory).mockReset()
  vi.mocked(getBoundaryVersion).mockReset()
  vi.mocked(getInventory).mockResolvedValue(inventory)
  vi.mocked(getBoundaryVersion).mockResolvedValue({
    version: {
      id: 'bv-1',
      versionNo: 1,
      consolidationApproach: 'EQUITY_SHARE',
      facilityCount: 2,
      frozenByUserId: 'user-1',
      frozenBy: 'ama@ecoriv.test',
      frozenAt: '2026-09-01T10:00:00Z',
    },
    entries: [
      {
        facilityId: 'fac-1',
        facilityName: 'Tema Plant',
        location: 'Tema',
        ownershipPercent: 40,
        financialControl: false,
        operationalControl: true,
        accountingShare: 0.4,
      },
      {
        // in the boundary but emitted nothing: absent from the lines, present in the version
        facilityId: 'fac-2',
        facilityName: 'Nkran Camp',
        location: 'Ashanti',
        ownershipPercent: 100,
        financialControl: true,
        operationalControl: true,
        accountingShare: 1,
      },
    ],
  })
})

test('renders the run as a report with the accounting share applied', async () => {
  vi.mocked(getRun).mockResolvedValue(detail)
  renderRunDetailPage()

  expect(await screen.findByRole('heading', { name: 'Run 001' })).toBeInTheDocument()
  expect(screen.getAllByText('1.06 t CO₂e').length).toBeGreaterThan(0)
  expect(screen.getAllByText('Tema Plant')[0]).toBeInTheDocument()
  expect(screen.getAllByText('40%')[0]).toBeInTheDocument()
  expect(vi.mocked(getRun)).toHaveBeenCalledWith('run-1')
})

test('shows a not-found state when the run fails to load', async () => {
  vi.mocked(getRun).mockRejectedValue(new Error('gone'))
  renderRunDetailPage()

  expect(await screen.findByRole('heading', { name: /report not found/i })).toBeInTheDocument()
})

test('cites the boundary version the run computed from, including silent facilities', async () => {
  vi.mocked(getRun).mockResolvedValue(detail)
  renderRunDetailPage()

  expect(await screen.findByRole('heading', { name: /boundary version 1/i })).toBeInTheDocument()
  await screen.findByText(/Version 1 · Equity share · frozen .* by ama@ecoriv\.test/)
  // Nkran Camp has no run line, yet the version shows it was in scope at 100%
  const nkran = screen.getByText('Nkran Camp').closest('tr')
  // ownership 100%, both controls, and a 100% accounting share
  expect(nkran).toHaveTextContent(/Nkran Camp.*100%.*Yes.*Yes.*100%/)
  expect(vi.mocked(getBoundaryVersion)).toHaveBeenCalledWith('bv-1')
})

test('a run older than boundary versioning says so instead of citing one', async () => {
  vi.mocked(getRun).mockResolvedValue({
    ...detail,
    run: { ...detail.run, boundaryVersionId: null, boundaryVersionNo: null },
  })
  renderRunDetailPage()

  expect(await screen.findByRole('heading', { name: 'Run 001' })).toBeInTheDocument()
  expect(screen.getByText(/predates boundary versioning/)).toBeInTheDocument()
  expect(vi.mocked(getBoundaryVersion)).not.toHaveBeenCalled()
})
