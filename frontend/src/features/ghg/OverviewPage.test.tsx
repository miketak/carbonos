import { screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { OverviewPage } from './OverviewPage'
import type { Facility, Organization, Run } from './api'

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

import { getOrganization, listActivities, listFacilities, listRuns } from './api'

const organization: Organization = {
  id: 'org-1',
  name: 'Acme Corp',
  consolidationApproach: 'EQUITY_SHARE',
  facilityCount: 0,
  createdAt: '2026-08-01T00:00:00Z',
}

const facility: Facility = {
  id: 'fac-1',
  name: 'Accra HQ',
  location: 'Accra',
  equitySharePercent: 100,
  controlled: true,
  createdAt: '2026-08-01T00:00:00Z',
}

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
  vi.mocked(listRuns).mockReset()
  vi.mocked(getOrganization).mockResolvedValue(organization)
})

test('shows the setup checklist with the boundary step next for an empty organization', async () => {
  vi.mocked(listFacilities).mockResolvedValue([])
  vi.mocked(listActivities).mockResolvedValue([])
  vi.mocked(listRuns).mockResolvedValue([])
  renderOverviewPage()

  expect(
    await screen.findByRole('heading', { name: /get to your first inventory/i }),
  ).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /add facilities/i })).toHaveAttribute(
    'href',
    '/app/ghg/org-1/boundary',
  )
  // only the next incomplete step gets a call to action
  expect(screen.queryByRole('link', { name: /record activity/i })).not.toBeInTheDocument()
})

test('advances the checklist call to action as steps complete', async () => {
  vi.mocked(listFacilities).mockResolvedValue([facility])
  vi.mocked(listActivities).mockResolvedValue([])
  vi.mocked(listRuns).mockResolvedValue([])
  renderOverviewPage()

  expect(await screen.findByRole('link', { name: /record activity/i })).toHaveAttribute(
    'href',
    '/app/ghg/org-1/activity',
  )
  expect(screen.queryByRole('link', { name: /add facilities/i })).not.toBeInTheDocument()
})

test('shows the dashboard with the latest run once runs exist', async () => {
  vi.mocked(listFacilities).mockResolvedValue([facility])
  vi.mocked(listActivities).mockResolvedValue([])
  vi.mocked(listRuns).mockResolvedValue([run])
  renderOverviewPage()

  expect(await screen.findByText('3.01 t CO₂e')).toBeInTheDocument()
  expect(screen.getByText('FY2026 inventory')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /view report/i })).toHaveAttribute(
    'href',
    '/app/ghg/org-1/runs/run-1',
  )
  expect(screen.queryByText(/get to your first inventory/i)).not.toBeInTheDocument()
})
