import { screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { OverviewPage } from './OverviewPage'
import type { Activity, Facility, Organization, Run, RunDetail } from './api'

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

import { getOrganization, getRun, listActivities, listFacilities, listRuns } from './api'

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

const activity: Activity = {
  id: 'act-1',
  facilityId: 'fac-1',
  facilityName: 'Accra HQ',
  emissionFactorId: 'ef-1',
  factorName: 'Diesel',
  scope: 'SCOPE_1',
  category: 'MOBILE_COMBUSTION',
  quantity: 1000,
  unit: 'litre',
  activityDate: '2026-05-19',
  note: null,
  unweightedKgCo2e: 2660,
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

const detail: RunDetail = {
  run,
  lines: [
    {
      id: 'line-1',
      activityId: 'act-1',
      facilityName: 'Accra HQ',
      factorName: 'Diesel',
      scope: 'SCOPE_1',
      category: 'MOBILE_COMBUSTION',
      quantity: 1000,
      unit: 'litre',
      kgCo2ePerUnit: 2.66,
      weight: 1,
      kgCo2e: 2660,
    },
    {
      id: 'line-2',
      activityId: 'act-2',
      facilityName: 'Kumasi Processing',
      factorName: 'Grid electricity (Ghana)',
      scope: 'SCOPE_2',
      category: 'PURCHASED_ELECTRICITY',
      quantity: 800,
      unit: 'kWh',
      kgCo2ePerUnit: 0.441,
      weight: 1,
      kgCo2e: 352.8,
    },
  ],
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
  vi.mocked(getRun).mockReset()
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
  // no facilities yet, so there is no coverage matrix to show
  expect(screen.queryByText(/data coverage/i)).not.toBeInTheDocument()
})

test('advances the checklist and shows the coverage matrix once facilities exist', async () => {
  vi.mocked(listFacilities).mockResolvedValue([facility])
  vi.mocked(listActivities).mockResolvedValue([])
  vi.mocked(listRuns).mockResolvedValue([])
  renderOverviewPage()

  expect(await screen.findByRole('link', { name: /record activity/i })).toHaveAttribute(
    'href',
    '/app/ghg/org-1/activity',
  )
  expect(screen.queryByRole('link', { name: /add facilities/i })).not.toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /data coverage/i })).toBeInTheDocument()
  expect(screen.getByText('0% complete')).toBeInTheDocument()
})

test('shows the dashboard with KPI cards, panels, and the latest run once runs exist', async () => {
  vi.mocked(listFacilities).mockResolvedValue([facility])
  vi.mocked(listActivities).mockResolvedValue([activity])
  vi.mocked(listRuns).mockResolvedValue([run])
  vi.mocked(getRun).mockResolvedValue(detail)
  renderOverviewPage()

  // KPI cards
  expect(await screen.findByText('Total emissions')).toBeInTheDocument()
  expect(screen.getByText('3.01 t CO₂e')).toBeInTheDocument()
  expect(screen.getByText('Scope 1 — Direct')).toBeInTheDocument()
  expect(screen.getByText('Scope 3 — Indirect')).toBeInTheDocument()

  // latest run card
  expect(screen.getByText('FY2026 inventory')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /view report/i })).toHaveAttribute(
    'href',
    '/app/ghg/org-1/runs/run-1',
  )

  // top facilities grouped from the run's lines
  expect(await screen.findByText('Kumasi Processing')).toBeInTheDocument()

  // coverage matrix: 1 facility with scope 1 covered out of 3 scopes
  expect(screen.getByText('33% complete')).toBeInTheDocument()

  // recent activity feed
  expect(screen.getByText('Recent activity data')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /view all/i })).toHaveAttribute(
    'href',
    '/app/ghg/org-1/activity',
  )

  expect(screen.queryByText(/get to your first inventory/i)).not.toBeInTheDocument()
})
