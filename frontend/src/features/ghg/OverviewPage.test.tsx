import { screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { OverviewPage } from './OverviewPage'
import type { Facility, Inventory, Organization, Run } from './api'

vi.mock('./api', () => import('./testApiMock'))

import { getOrganization, listActivities, listFacilities, listInventories, listRuns } from './api'

const organization: Organization = {
  id: 'org-1',
  name: 'Ecoriv Holdings',
  facilityCount: 1,
  createdAt: '2026-08-01T00:00:00Z',
}

const facility: Facility = {
  id: 'fac-1',
  name: 'Tema Plant',
  location: 'Tema',
  equitySharePercent: 100,
  controlled: true,
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
  finalRunId: 'run-1',
  createdAt: '2026-08-29T00:00:00Z',
}

const run: Run = {
  id: 'run-1',
  inventoryId: 'inv-1',
  label: 'Run 004',
  periodStart: '2025-01-01',
  periodEnd: '2025-12-31',
  consolidationApproach: 'OPERATIONAL_CONTROL',
  activityCount: 2,
  totalKgCo2e: 3012.8,
  scope1KgCo2e: 2660,
  scope2KgCo2e: 352.8,
  scope3KgCo2e: 0,
  isFinal: true,
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
  vi.mocked(listActivities).mockReset()
  vi.mocked(listInventories).mockReset()
  vi.mocked(listRuns).mockReset()
  vi.mocked(getOrganization).mockResolvedValue(organization)
})

test('walks a new organization from facts to a final inventory', async () => {
  vi.mocked(listFacilities).mockResolvedValue([])
  vi.mocked(listActivities).mockResolvedValue([])
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
  vi.mocked(listActivities).mockResolvedValue([
    {
      id: 'act-1',
      facilityId: 'fac-1',
      facilityName: 'Tema Plant',
      activityType: 'Diesel consumption',
      quantity: 100,
      unit: 'litre',
      activityDate: '2025-03-15',
      dataSource: null,
      evidenceRef: null,
      dataQuality: 'MEASURED',
      note: null,
    },
  ])
  vi.mocked(listInventories).mockResolvedValue([])
  renderOverviewPage()

  expect(await screen.findByRole('link', { name: /create inventory/i })).toHaveAttribute(
    'href',
    '/app/ghg/org-1/inventories',
  )
})

test('shows the headline inventory with its final run once one exists', async () => {
  vi.mocked(listFacilities).mockResolvedValue([facility])
  vi.mocked(listActivities).mockResolvedValue([
    {
      id: 'act-1',
      facilityId: 'fac-1',
      facilityName: 'Tema Plant',
      activityType: 'Diesel consumption',
      quantity: 100,
      unit: 'litre',
      activityDate: '2025-03-15',
      dataSource: null,
      evidenceRef: null,
      dataQuality: 'MEASURED',
      note: null,
    },
  ])
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
