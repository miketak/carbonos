import { screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { RunDetailPage } from './RunDetailPage'
import type { Inventory, RunDetail } from './api'

vi.mock('./api', () => import('./testApiMock'))

import { getInventory, getRun } from './api'

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
  vi.mocked(getInventory).mockResolvedValue(inventory)
})

test('renders the run as a report with the accounting share applied', async () => {
  vi.mocked(getRun).mockResolvedValue(detail)
  renderRunDetailPage()

  expect(await screen.findByRole('heading', { name: 'Run 001' })).toBeInTheDocument()
  expect(screen.getAllByText('1.06 t CO₂e').length).toBeGreaterThan(0)
  expect(screen.getByText('Tema Plant')).toBeInTheDocument()
  expect(screen.getByText('40%')).toBeInTheDocument()
  expect(vi.mocked(getRun)).toHaveBeenCalledWith('run-1')
})

test('shows a not-found state when the run fails to load', async () => {
  vi.mocked(getRun).mockRejectedValue(new Error('gone'))
  renderRunDetailPage()

  expect(await screen.findByRole('heading', { name: /report not found/i })).toBeInTheDocument()
})
