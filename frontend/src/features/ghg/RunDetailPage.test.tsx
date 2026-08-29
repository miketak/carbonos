import { screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { RunDetailPage } from './RunDetailPage'
import type { Organization, Run, RunDetail } from './api'

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

import { getOrganization, getRun } from './api'

const organization: Organization = {
  id: 'org-1',
  name: 'Acme Corp',
  consolidationApproach: 'EQUITY_SHARE',
  facilityCount: 1,
  createdAt: '2026-08-01T00:00:00Z',
}

const run: Run = {
  id: 'run-1',
  label: 'FY2026 inventory',
  periodStart: '2026-01-01',
  periodEnd: '2026-12-31',
  consolidationApproach: 'EQUITY_SHARE',
  activityCount: 1,
  totalKgCo2e: 2660,
  scope1KgCo2e: 2660,
  scope2KgCo2e: 0,
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
  ],
}

function renderRunDetailPage() {
  return renderWithProviders(<RunDetailPage />, {
    route: '/app/ghg/org-1/runs/run-1',
    path: '/app/ghg/:organizationId/runs/:runId',
  })
}

beforeEach(() => {
  vi.mocked(getRun).mockReset()
  vi.mocked(getOrganization).mockReset()
  vi.mocked(getOrganization).mockResolvedValue(organization)
})

test('renders the run as a report with totals and snapshot lines', async () => {
  vi.mocked(getRun).mockResolvedValue(detail)
  renderRunDetailPage()

  expect(await screen.findByRole('heading', { name: 'FY2026 inventory' })).toBeInTheDocument()
  expect(screen.getAllByText('2.66 t CO₂e').length).toBeGreaterThan(0)
  expect(screen.getByText('Accra HQ')).toBeInTheDocument()
  expect(screen.getByText('Diesel')).toBeInTheDocument()
  expect(screen.getByText('100%')).toBeInTheDocument()
  expect(vi.mocked(getRun)).toHaveBeenCalledWith('run-1')
})

test('shows a not-found state when the run fails to load', async () => {
  vi.mocked(getRun).mockRejectedValue(new Error('gone'))
  renderRunDetailPage()

  expect(await screen.findByRole('heading', { name: /report not found/i })).toBeInTheDocument()
})
