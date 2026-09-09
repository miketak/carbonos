import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { EntitiesPage } from './EntitiesPage'
import type { Entity } from './api'

vi.mock('./api', () => import('./testApiMock'))

import { createEntity, listEntities } from './api'

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
  vi.mocked(createEntity).mockReset()
  vi.mocked(listEntities).mockResolvedValue([own, jv])
})

test('lists entities with the share Table 1 gives under each approach', async () => {
  renderPage()

  const jvRow = (await screen.findByText('Tarkwa Gold JV Ltd')).closest('tr')
  expect(jvRow).toHaveTextContent(/Joint venture.*40%.*same.*Yes.*40%.*40%.*100%/)
  const ownRow = screen.getByText('Sankofa Gold plc').closest('tr')
  expect(ownRow).toHaveTextContent('Reporting company')
  // the reporting company cannot be removed; other entities can
  expect(within(ownRow as HTMLElement).queryByRole('button', { name: /remove/i })).toBeNull()
  expect(within(jvRow as HTMLElement).getByRole('button', { name: /remove/i })).toBeInTheDocument()
})

test('the add form submits the Table 1 facts', async () => {
  const user = userEvent.setup()
  vi.mocked(createEntity).mockResolvedValue({ ...jv, id: 'ent-3', name: 'Takoradi Port Co' })
  renderPage()

  await user.click(await screen.findByRole('button', { name: /add entity/i }))
  const dialog = await screen.findByRole('dialog', { name: /add legal entity/i })
  await user.click(screen.getByLabelText('Name'))
  await user.paste('Takoradi Port Co')
  await user.selectOptions(screen.getByLabelText('Relationship'), 'ASSOCIATE')
  await user.clear(screen.getByLabelText('Economic interest (%)'))
  await user.paste('30')
  await user.click(screen.getByLabelText('Operated by the company'))
  await user.click(within(dialog).getByRole('button', { name: /^add entity$/i }))

  await waitFor(() =>
    expect(createEntity).toHaveBeenCalledWith('org-1', {
      name: 'Takoradi Port Co',
      relationshipType: 'ASSOCIATE',
      economicInterestPercent: 30,
      legalOwnershipPercent: undefined,
      operatedByCompany: false,
      controlledByCompany: undefined,
      parentEntityId: undefined,
    }),
  )
})
