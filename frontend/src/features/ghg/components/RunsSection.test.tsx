import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../../test/utils'
import { RunsSection } from './RunsSection'
import type { Run, RunDetail } from '../api'

vi.mock('../api', () => ({
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

import { getRun, listRuns } from '../api'

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
  ],
}

beforeEach(() => {
  vi.mocked(listRuns).mockReset()
  vi.mocked(getRun).mockReset()
})

test('shows an empty state when there are no runs', async () => {
  vi.mocked(listRuns).mockResolvedValue([])
  renderWithProviders(<RunsSection organizationId="org-1" />)
  expect(await screen.findByRole('heading', { name: /no runs yet/i })).toBeInTheDocument()
})

test('renders a run with its total and scope split', async () => {
  vi.mocked(listRuns).mockResolvedValue([run])
  renderWithProviders(<RunsSection organizationId="org-1" />)
  expect(await screen.findByText('FY2026 inventory')).toBeInTheDocument()
  expect(screen.getByText('3.01 t CO₂e')).toBeInTheDocument()
  expect(screen.getByText('2.66 t CO₂e')).toBeInTheDocument()
  expect(screen.getByText('352.8 kg CO₂e')).toBeInTheDocument()
})

test('expanding a run loads its snapshot lines', async () => {
  const user = userEvent.setup()
  vi.mocked(listRuns).mockResolvedValue([run])
  vi.mocked(getRun).mockResolvedValue(detail)
  renderWithProviders(<RunsSection organizationId="org-1" />)

  await user.click(await screen.findByRole('button', { name: /show details/i }))

  expect(await screen.findByText('Accra HQ')).toBeInTheDocument()
  expect(screen.getByText('Diesel')).toBeInTheDocument()
  expect(screen.getByText('100%')).toBeInTheDocument()
  expect(vi.mocked(getRun)).toHaveBeenCalledWith('run-1')
})
