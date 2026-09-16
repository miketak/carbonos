import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { FactorPackUpdatesPage } from './FactorPackUpdatesPage'
import { OrganizationLayout } from './OrganizationLayout'

vi.mock('./api', () => import('./testApiMock'))

import { getFactorPackDiff, getOrganization, listFactorPackNotices, listOrganizations } from './api'
import type { FactorPackDiff, FactorPackNotice, Organization } from './api'

function organization(myRole: Organization['myRole']): Organization {
  return {
    id: 'org-1',
    name: 'Asante Gold Resources',
    myRole,
    address: null,
    contact: null,
    facilityCount: 3,
    supportAccess: [],
    createdAt: '2026-08-01T00:00:00Z',
  }
}

const openNotice: FactorPackNotice = {
  id: 'notice-1',
  editionId: 'defra-2027',
  editionName: 'DESNZ conversion factors 2027',
  packKey: 'defra',
  predecessorEditionId: 'defra-2026',
  status: 'OPEN',
  editionStatus: 'PUBLISHED',
  withdrawalReason: null,
  appliesFrom: '2027-01-01',
  raisedAt: '2026-09-12T09:30:00Z',
  rowsAffected: 12,
  rowsOverThreshold: 3,
  estimatedKgCo2eDelta: 1400,
  scopesAffected: 'SCOPE_1',
  diffHash: 'a'.repeat(64),
  decidedAt: null,
  decidedBy: null,
  decidedByRole: null,
  recalculationCase: null,
  decisionNote: null,
  significanceThresholdPercent: null,
  affectedPercent: null,
  recalculationId: null,
  appliedAt: null,
}

const withdrawn: FactorPackNotice = {
  ...openNotice,
  id: 'notice-2',
  editionId: 'defra-2027',
  editionName: 'DESNZ 2027',
  packKey: 'defra',
  predecessorEditionId: 'defra-2026',
  status: 'WITHDRAWN',
  editionStatus: 'WITHDRAWN',
  withdrawalReason: 'The diesel row transcribed the wrong column.',
  rowsAffected: 4,
  rowsOverThreshold: 0,
  estimatedKgCo2eDelta: -20,
}

const diff: FactorPackDiff = {
  noticeId: 'notice-1',
  editionId: 'defra-2027',
  editionName: 'DESNZ conversion factors 2027',
  predecessorEditionId: 'defra-2026',
  appliesFrom: '2027-01-01',
  status: 'OPEN',
  rows: [
    {
      code: 'DESNZ:diesel',
      name: 'Diesel (average biofuel blend)',
      unit: 'litre',
      currentKgCo2ePerUnit: 2.66,
      newKgCo2ePerUnit: 2.8,
      absoluteChange: 0.14,
      percentChange: 5.2632,
      gasesChanged: ['CO2', 'CH4'],
      provenanceChanged: true,
      gwpBasisChanged: false,
      estimatedKgCo2eDelta: 1400,
    },
  ],
  conflicts: [],
  blocked: [],
  discontinued: [],
  earlierPeriods: [],
  estimatedKgCo2eDelta: 1400,
  diffHash: 'a'.repeat(64),
  gwpBasisChanged: false,
  currentGwpBasis: 'AR5',
  newGwpBasis: 'AR5',
  estimatedOver: '2027 draft',
  lockedPeriod: null,
  hasBaseYear: true,
  thresholdPercent: 5,
  affectedPercent: 5.26,
  recalculationWarning:
    'Accepting raises a base-year recalculation candidate. If it is above your significance threshold, inventories that report against the base year cannot be marked final or published until the recalculation is completed or declined.',
}

function renderPage() {
  return renderWithProviders(<FactorPackUpdatesPage />, {
    route: '/app/ghg/org-1/factor-updates',
    path: '/app/ghg/:organizationId/factor-updates',
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getOrganization).mockResolvedValue(organization('OWNER'))
  vi.mocked(listOrganizations).mockResolvedValue([organization('OWNER')])
  vi.mocked(listFactorPackNotices).mockResolvedValue([openNotice, withdrawn])
  vi.mocked(getFactorPackDiff).mockResolvedValue(diff)
})

test('the inbox lists one row per notice with what a decision would move', async () => {
  renderPage()

  const row = (await screen.findByText('DESNZ conversion factors 2027')).closest('tr')
  expect(row).not.toBeNull()
  const cells = within(row as HTMLElement)
  expect(cells.getByText('defra-2027', { exact: false })).toBeInTheDocument()
  // rows affected, rows moving more than five percent, and the estimated tonnage movement
  expect(cells.getByText('12')).toBeInTheDocument()
  expect(cells.getByText('3')).toBeInTheDocument()
  expect(cells.getByText(/\+1\.4 t/)).toBeInTheDocument()
  expect(cells.getByText('Waiting on you')).toBeInTheDocument()

  // a withdrawn edition says the publisher withdrew it, and there is nothing to decide
  const closed = (await screen.findByText('DESNZ 2027')).closest('tr')
  expect(within(closed as HTMLElement).getByText('Withdrawn by the publisher')).toBeInTheDocument()
  expect(
    within(closed as HTMLElement).getByText(/transcribed the wrong column/),
  ).toBeInTheDocument()
})

test('the empty state says notices appear here when an edition is published', async () => {
  vi.mocked(listFactorPackNotices).mockResolvedValue([])
  renderPage()

  expect(await screen.findByText('No updates waiting')).toBeInTheDocument()
  expect(screen.getByText(/appears here with the per-row diff/)).toBeInTheDocument()
})

test('reviewing a notice opens the diff beside the list', async () => {
  const user = userEvent.setup()
  renderPage()

  await user.click(
    await screen.findByRole('button', { name: /Review DESNZ conversion factors 2027/ }),
  )

  const drawer = await screen.findByRole('dialog', { name: 'DESNZ conversion factors 2027' })
  expect(within(drawer).getByText('Diesel (average biofuel blend)')).toBeInTheDocument()
  expect(getFactorPackDiff).toHaveBeenCalledWith('notice-1')
})

test('the navigation carries a count of the notices still waiting', async () => {
  renderWithProviders(<OrganizationLayout />, {
    route: '/app/ghg/org-1',
    path: '/app/ghg/:organizationId',
  })

  const badge = await screen.findByTitle('1 factor pack update waiting')
  expect(badge).toHaveTextContent('1')
  expect(badge.closest('a')).toHaveAttribute('href', '/app/ghg/org-1/factor-updates')
})
