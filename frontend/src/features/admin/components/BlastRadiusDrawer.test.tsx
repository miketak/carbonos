import { screen, within } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../../test/utils'
import { BlastRadiusDrawer } from './BlastRadiusDrawer'
import type { BlastRadius, BlastRadiusOrganization } from '../api'

vi.mock('../api', () => ({
  getAccountsSummary: vi.fn(),
  getPlatformSummary: vi.fn(),
  getPlatformSettings: vi.fn(),
  updatePlatformSettings: vi.fn(),
  listPlatformSettingChanges: vi.fn(),
  listFactorPacks: vi.fn(),
  createFactorPackFamily: vi.fn(),
  createFactorPackEdition: vi.fn(),
  getFactorPackEdition: vi.fn(),
  updateFactorPackEdition: vi.fn(),
  deleteFactorPackEdition: vi.fn(),
  listFactorPackRows: vi.fn(),
  createFactorPackRow: vi.fn(),
  updateFactorPackRow: vi.fn(),
  deleteFactorPackRow: vi.fn(),
  getFactorPackValidation: vi.fn(),
  listFactorPackChanges: vi.fn(),
  listFactorPackEvents: vi.fn(),
  getFactorPackBlastRadius: vi.fn(),
  uploadFactorPackEvidence: vi.fn(),
  publishFactorPackEdition: vi.fn(),
  withdrawFactorPackEdition: vi.fn(),
}))
vi.mock('../../auth/api', () => ({ login: vi.fn(), logout: vi.fn(), me: vi.fn() }))

import { getFactorPackBlastRadius } from '../api'

/** A holder as the backend reports it for a withdrawal: nothing moves, nothing is estimated. */
const adansi: BlastRadiusOrganization = {
  organizationId: 'org-adansi',
  organizationName: 'Adansi Foods Ltd',
  organizationAccountNo: 1,
  lineagesHeld: 3,
  rowsMoving: 0,
  rowsOverThreshold: 0,
  estimatedKgCo2eDelta: 0,
  lastRunLabel: null,
  openDrafts: [
    {
      inventoryId: 'inv-1',
      name: 'FY2026',
      periodStart: '2026-01-01',
      periodEnd: '2026-12-31',
      status: 'DRAFT',
    },
  ],
  lockedPeriods: [],
  conflicts: [],
  blocked: [],
  unapproved: [],
  discontinued: [],
  diffHash: null,
}

const withdrawal: BlastRadius = {
  editionId: 'defra-2026',
  packKey: 'defra',
  act: 'WITHDRAW',
  predecessorEditionId: null,
  rowsAdded: 0,
  rowsChanged: 0,
  rowsDiscontinued: 0,
  rowsUnchanged: 0,
  rowsOverThreshold: 0,
  rows: [],
  discontinuedLineages: [],
  unapprovedRows: [],
  organizations: [
    adansi,
    {
      ...adansi,
      organizationId: 'org-keta',
      organizationName: 'Keta Salt Works',
      organizationAccountNo: 1,
      lineagesHeld: 0,
    },
  ],
  holderCount: 1,
  openNoticeCount: 1,
}

const publication: BlastRadius = {
  ...withdrawal,
  editionId: 'defra-2027',
  act: 'PUBLISH',
  predecessorEditionId: 'defra-2026',
  rowsChanged: 1,
  rowsUnchanged: 2,
  organizations: [
    {
      ...adansi,
      rowsMoving: 1,
      rowsOverThreshold: 1,
      estimatedKgCo2eDelta: -3490,
      lastRunLabel: 'Run 6',
      blocked: ['DEFRA:Fuels:Diesel:litre'],
      lockedPeriods: [
        {
          inventoryId: 'inv-0',
          name: 'FY2025',
          periodStart: '2025-01-01',
          periodEnd: '2025-12-31',
          status: 'FINAL',
        },
      ],
    },
  ],
}

beforeEach(() => {
  vi.mocked(getFactorPackBlastRadius).mockReset()
})

function renderDrawer(editionId: string) {
  return renderWithProviders(<BlastRadiusDrawer editionId={editionId} onClose={vi.fn()} />, {
    route: `/admin/factor-packs/${editionId}`,
  })
}

test('a published edition reads as the withdrawal impact, with no movement lines', async () => {
  vi.mocked(getFactorPackBlastRadius).mockResolvedValue(withdrawal)
  renderDrawer('defra-2026')

  const drawer = await screen.findByRole('dialog', { name: 'defra-2026' })
  expect(await within(drawer).findByText(/^withdrawal impact$/i)).toBeInTheDocument()
  expect(
    within(drawer).getByText(/1 organization holds one of these lineages/i),
  ).toBeInTheDocument()
  expect(within(drawer).getByText(/stay exactly as they are: nothing moves/i)).toBeInTheDocument()
  expect(within(drawer).getByText(/open notice would close/i)).toBeInTheDocument()

  // each holder: what it holds and that it keeps it; the one listed for its open notice says so
  expect(within(drawer).getByText('Adansi Foods Ltd')).toBeInTheDocument()
  expect(
    within(drawer).getByText(/holds 3 lineages of this edition, which stay exactly/i),
  ).toBeInTheDocument()
  expect(
    within(drawer).getByText(/holds no row of this edition; its notice for it is open/i),
  ).toBeInTheDocument()

  // the publication lines are never printed for a withdrawal
  expect(within(drawer).queryByText(/would move/i)).not.toBeInTheDocument()
  expect(within(drawer).queryByText(/estimated movement/i)).not.toBeInTheDocument()
  expect(within(drawer).queryByText(/completed no run/i)).not.toBeInTheDocument()
  expect(within(drawer).queryByText(/inside a locked period/i)).not.toBeInTheDocument()
  expect(within(drawer).queryByText(/open drafts that would move/i)).not.toBeInTheDocument()
  expect(within(drawer).queryByText(/changes no organization/i)).not.toBeInTheDocument()
  expect(within(drawer).queryByText(/^Changed$/)).not.toBeInTheDocument()
})

test('a draft keeps the publication rendering', async () => {
  vi.mocked(getFactorPackBlastRadius).mockResolvedValue(publication)
  renderDrawer('defra-2027')

  const drawer = await screen.findByRole('dialog', { name: 'defra-2027' })
  expect(await within(drawer).findByText(/changes no organization/i)).toBeInTheDocument()
  expect(within(drawer).getByText(/^blast radius$/i)).toBeInTheDocument()
  expect(within(drawer).getByText(/measured against defra-2026/i)).toBeInTheDocument()
  expect(within(drawer).getByText(/1 would move, 1 by more than 5 percent/i)).toBeInTheDocument()
  expect(within(drawer).getByText(/-3,490 kg CO2e/i)).toBeInTheDocument()
  expect(within(drawer).getByText(/from the last completed run \(Run 6\)/i)).toBeInTheDocument()
  expect(within(drawer).getByText(/FY2025, FINAL/i)).toBeInTheDocument()
  expect(within(drawer).queryByText(/withdrawal impact/i)).not.toBeInTheDocument()
})
