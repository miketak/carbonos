import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { EntitiesPage } from './EntitiesPage'
import type { Entity, Organization } from './api'

vi.mock('./api', () => import('./testApiMock'))

// forms with many fields take longer than the 15s default on a loaded machine
vi.setConfig({ testTimeout: 30000 })

import { getOrganization, listEntities } from './api'

const organization: Organization = {
  id: 'org-1',
  name: 'Sankofa Gold plc',
  accountNo: 1,
  myRole: 'OWNER',
  address: null,
  contact: null,
  facilityCount: 2,
  supportAccess: [],
  createdAt: '2026-08-01T00:00:00Z',
}

const own: Entity = {
  id: 'ent-1',
  name: 'Sankofa Gold plc',
  relationshipType: 'SUBSIDIARY',
  economicInterestPercent: 100,
  legalOwnershipPercent: 100,
  operatedByCompany: true,
  controlledByCompany: true,
  parentEntityId: null,
  effectiveEconomicInterestPercent: 100,
  chain: [],
  reportingCompany: true,
  equityShare: 1,
  financialControlShare: 1,
  operationalControlShare: 1,
  effectiveFrom: null,
  effectiveTo: null,
  jurisdiction: null,
  financialControlOverride: null,
  controlNote: null,
  createdAt: '2026-08-01T00:00:00Z',
}

// a jointly controlled JV the company operates: Table 1 gives three different shares
const jv: Entity = {
  id: 'ent-2',
  name: 'Tarkwa Gold JV Ltd',
  relationshipType: 'JOINT_VENTURE',
  economicInterestPercent: 40,
  legalOwnershipPercent: null,
  operatedByCompany: true,
  controlledByCompany: false,
  parentEntityId: null,
  effectiveEconomicInterestPercent: 40,
  chain: [],
  reportingCompany: false,
  equityShare: 0.4,
  financialControlShare: 0.4,
  operationalControlShare: 1,
  effectiveFrom: null,
  effectiveTo: null,
  jurisdiction: null,
  financialControlOverride: null,
  controlNote: null,
  createdAt: '2026-08-01T00:00:00Z',
}

function renderPage() {
  return renderWithProviders(<EntitiesPage />, {
    route: '/app/ghg/org-1/entities',
    path: '/app/ghg/:organizationId/entities',
  })
}

beforeEach(() => {
  vi.mocked(listEntities).mockReset()
  vi.mocked(getOrganization).mockReset()
  vi.mocked(listEntities).mockResolvedValue([own, jv])
})

test('lists entities with the share Table 1 gives under each approach', async () => {
  renderPage()

  const jvRow = (await screen.findByText('Tarkwa Gold JV Ltd')).closest('tr')
  expect(jvRow).toHaveTextContent(/Joint venture.*40%.*same.*Yes.*40%.*40%.*100%/)
  const ownRow = screen.getByText('Sankofa Gold plc').closest('tr')
  expect(ownRow).toHaveTextContent('Reporting company')
  // the company holds no Table 1 relationship to itself, so the column says what it is instead
  expect(ownRow).not.toHaveTextContent('Subsidiary')
  // the reporting company cannot be removed; other entities can
  expect(within(ownRow as HTMLElement).queryByRole('button', { name: /remove/i })).toBeNull()
  expect(within(jvRow as HTMLElement).getByRole('button', { name: /remove/i })).toBeInTheDocument()
})

test('Add entity and Edit lead to their own pages under the list (spec 08)', async () => {
  const user = userEvent.setup()
  renderWithProviders(<EntitiesPage />, {
    route: '/app/ghg/org-1/entities',
    path: '/app/ghg/:organizationId/entities',
    extraRoutes: [
      { path: '/app/ghg/:organizationId/entities/new', element: <h1>Add legal entity</h1> },
      {
        path: '/app/ghg/:organizationId/entities/:entityId/edit',
        element: <h1>Edit legal entity</h1>,
      },
    ],
  })

  const jvRow = (await screen.findByText('Tarkwa Gold JV Ltd')).closest('tr') as HTMLElement
  await user.click(within(jvRow).getByRole('button', { name: /^edit$/i }))
  expect(await screen.findByRole('heading', { name: 'Edit legal entity' })).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('Add entity leads to the add page (spec 08)', async () => {
  const user = userEvent.setup()
  renderWithProviders(<EntitiesPage />, {
    route: '/app/ghg/org-1/entities',
    path: '/app/ghg/:organizationId/entities',
    extraRoutes: [
      { path: '/app/ghg/:organizationId/entities/new', element: <h1>Add legal entity</h1> },
    ],
  })

  await user.click(await screen.findByRole('button', { name: /add entity/i }))
  expect(await screen.findByRole('heading', { name: 'Add legal entity' })).toBeInTheDocument()
})

test('a verifier sees Add entity, Edit and Remove disabled with the role they need (spec 01.4)', async () => {
  vi.mocked(getOrganization).mockResolvedValue({ ...organization, myRole: 'VERIFIER' })
  renderPage()

  const add = await screen.findByRole('button', { name: /add entity/i })
  await waitFor(() => expect(add).toBeDisabled())
  expect(add).toHaveAttribute('title', 'Needs the Preparer, Reviewer or Owner role.')
  expect(add).toHaveAccessibleDescription('Needs the Preparer, Reviewer or Owner role.')

  const jvRow = screen.getByText('Tarkwa Gold JV Ltd').closest('tr') as HTMLElement
  expect(within(jvRow).getByRole('button', { name: /^edit$/i })).toBeDisabled()
  expect(within(jvRow).getByRole('button', { name: /^remove$/i })).toBeDisabled()
})

test('a preparer can add, edit and remove entities (spec 01.4)', async () => {
  vi.mocked(getOrganization).mockResolvedValue({ ...organization, myRole: 'PREPARER' })
  renderPage()

  const add = await screen.findByRole('button', { name: /add entity/i })
  await waitFor(() => expect(add).toBeEnabled())

  const jvRow = screen.getByText('Tarkwa Gold JV Ltd').closest('tr') as HTMLElement
  expect(within(jvRow).getByRole('button', { name: /^edit$/i })).toBeEnabled()
  expect(within(jvRow).getByRole('button', { name: /^remove$/i })).toBeEnabled()
})
