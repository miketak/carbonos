import { screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { InventoriesPage } from './InventoriesPage'
import type { Inventory } from './api'

vi.mock('./api', () => import('./testApiMock'))

import { listInventories } from './api'

const draft: Inventory = {
  id: 'inv-1',
  organizationId: 'org-1',
  name: '2025 Corporate Inventory',
  periodStart: '2025-01-01',
  periodEnd: '2025-12-31',
  purpose: 'Corporate reporting',
  baseYear: null,
  consolidationApproach: 'OPERATIONAL_CONTROL',
  gwpSet: 'AR5',
  scope3Categories: [],
  scope3ExclusionsRationale: null,
  finalRunId: null,
  status: 'DRAFT',
  supersededById: null,
  publishedAt: null,
  currentBoundaryVersionId: null,
  currentBoundaryVersionNo: null,
  createdAt: '2026-08-29T00:00:00Z',
}

const final: Inventory = {
  ...draft,
  id: 'inv-2',
  name: '2025 Equity Share Inventory',
  consolidationApproach: 'EQUITY_SHARE',
  finalRunId: 'run-1',
  status: 'FINAL',
  currentBoundaryVersionId: 'bv-3',
  currentBoundaryVersionNo: 3,
}

const published: Inventory = {
  ...draft,
  id: 'inv-3',
  name: '2024 Corporate Inventory',
  finalRunId: 'run-0',
  status: 'PUBLISHED',
  publishedAt: '2026-09-01T00:00:00Z',
  supersededById: 'inv-4',
  currentBoundaryVersionId: 'bv-1',
  currentBoundaryVersionNo: 1,
}

beforeEach(() => {
  vi.mocked(listInventories).mockReset()
  vi.mocked(listInventories).mockResolvedValue([final, draft, published])
})

test('every card shows its lifecycle state, so the list shows what can run or change', async () => {
  renderWithProviders(<InventoriesPage />, {
    route: '/app/ghg/org-1/inventories',
    path: '/app/ghg/:organizationId/inventories',
  })

  expect(await screen.findByText('2025 Equity Share Inventory')).toBeInTheDocument()
  expect(screen.getByText('FINAL · BOUNDARY v3')).toBeInTheDocument()
  expect(screen.getByText('DRAFT')).toBeInTheDocument()
  expect(screen.getByText('PUBLISHED · SUPERSEDED')).toBeInTheDocument()
  expect(screen.getByText('Superseded by a correction')).toBeInTheDocument()
  // a published inventory is a record: no delete button on its card
  expect(screen.getAllByRole('button', { name: /^delete$/i })).toHaveLength(2)
})
