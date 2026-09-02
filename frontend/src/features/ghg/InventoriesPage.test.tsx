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
  finalRunId: null,
  boundaryStatus: 'DRAFT',
  currentBoundaryVersionId: null,
  currentBoundaryVersionNo: null,
  createdAt: '2026-08-29T00:00:00Z',
}

const frozen: Inventory = {
  ...draft,
  id: 'inv-2',
  name: '2025 Equity Share Inventory',
  consolidationApproach: 'EQUITY_SHARE',
  finalRunId: 'run-1',
  boundaryStatus: 'FROZEN',
  currentBoundaryVersionId: 'bv-3',
  currentBoundaryVersionNo: 3,
}

beforeEach(() => {
  vi.mocked(listInventories).mockReset()
  vi.mocked(listInventories).mockResolvedValue([frozen, draft])
})

test('every card says whether its boundary is a draft or frozen, so the list shows what can run', async () => {
  renderWithProviders(<InventoriesPage />, {
    route: '/app/ghg/org-1/inventories',
    path: '/app/ghg/:organizationId/inventories',
  })

  expect(await screen.findByText('2025 Equity Share Inventory')).toBeInTheDocument()
  expect(screen.getByText('BOUNDARY FROZEN v3')).toBeInTheDocument()
  expect(screen.getByText('FINAL RUN DESIGNATED')).toBeInTheDocument()
  expect(screen.getByText('BOUNDARY DRAFT')).toBeInTheDocument()
})
