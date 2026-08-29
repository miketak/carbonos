import { screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { RunsPage } from './RunsPage'
import type { Run } from './api'

vi.mock('./api', () => ({
  listOrganizations: vi.fn(),
  getOrganization: vi.fn(),
  createOrganization: vi.fn(),
  updateOrganization: vi.fn(),
  deleteOrganization: vi.fn(),
  listFacilities: vi.fn(),
  createFacility: vi.fn(),
  updateFacility: vi.fn(),
  deleteFacility: vi.fn(),
  listEmissionFactors: vi.fn(),
  listActivities: vi.fn(),
  createActivity: vi.fn(),
  deleteActivity: vi.fn(),
  listRuns: vi.fn(),
  executeRun: vi.fn(),
  getRun: vi.fn(),
  deleteRun: vi.fn(),
}))

import { listRuns } from './api'

const run: Run = {
  id: 'run-1',
  label: 'FY2026 inventory',
  periodStart: '2026-01-01',
  periodEnd: '2026-12-31',
  consolidationApproach: 'EQUITY_SHARE',
  activityCount: 2,
  totalKgCo2e: 3012.8,
  scope1KgCo2e: 2660,
  scope2KgCo2e: 352.8,
  scope3KgCo2e: 0,
  createdAt: '2026-08-29T00:00:00Z',
}

function renderRunsPage() {
  return renderWithProviders(<RunsPage />, {
    route: '/app/ghg/org-1/runs',
    path: '/app/ghg/:organizationId/runs',
  })
}

beforeEach(() => {
  vi.mocked(listRuns).mockReset()
})

test('shows an empty state when there are no runs', async () => {
  vi.mocked(listRuns).mockResolvedValue([])
  renderRunsPage()
  expect(await screen.findByRole('heading', { name: /no runs yet/i })).toBeInTheDocument()
})

test('renders a run with its total and scope split', async () => {
  vi.mocked(listRuns).mockResolvedValue([run])
  renderRunsPage()
  expect(await screen.findByText('FY2026 inventory')).toBeInTheDocument()
  expect(screen.getByText('3.01 t CO₂e')).toBeInTheDocument()
  expect(screen.getByText('2.66 t CO₂e')).toBeInTheDocument()
  expect(screen.getByText('352.8 kg CO₂e')).toBeInTheDocument()
})

test('links each run to its report page', async () => {
  vi.mocked(listRuns).mockResolvedValue([run])
  renderRunsPage()
  const link = await screen.findByRole('link', { name: /view report/i })
  expect(link).toHaveAttribute('href', '/app/ghg/org-1/runs/run-1')
})
