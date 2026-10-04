import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { ApiError } from '../../lib/api'
import { renderWithProviders } from '../../test/utils'
import { EntityFormPage } from './EntityFormPage'
import type { Entity } from './api'

vi.mock('./api', () => import('./testApiMock'))

// forms with many fields take longer than the 15s default on a loaded machine
vi.setConfig({ testTimeout: 30000 })

import { createEntity, listEntities, updateEntity } from './api'

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

/** The list, as the place a save or a cancel lands. */
const neighbours = [{ path: '/app/ghg/:organizationId/entities', element: <h1>Legal entities</h1> }]

function renderNew() {
  return renderWithProviders(<EntityFormPage />, {
    route: '/app/ghg/org-1/entities/new',
    path: '/app/ghg/:organizationId/entities/new',
    extraRoutes: neighbours,
  })
}

function renderEdit(id: string) {
  return renderWithProviders(<EntityFormPage />, {
    route: `/app/ghg/org-1/entities/${id}/edit`,
    path: '/app/ghg/:organizationId/entities/:entityId/edit',
    extraRoutes: neighbours,
  })
}

beforeEach(() => {
  vi.mocked(listEntities).mockReset().mockResolvedValue([own, jv])
  vi.mocked(createEntity).mockReset()
  vi.mocked(updateEntity).mockReset()
})

test('Add legal entity is a page of its own under the list, with a breadcrumb back (spec 08)', async () => {
  renderNew()

  expect(
    await screen.findByRole('heading', { level: 1, name: 'Add legal entity' }),
  ).toBeInTheDocument()
  const trail = screen.getByRole('navigation', { name: 'Breadcrumb' })
  expect(within(trail).getByRole('link', { name: 'Legal entities' })).toHaveAttribute(
    'href',
    '/app/ghg/org-1/entities',
  )
  expect(within(trail).getByText('Add legal entity')).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('form', { name: 'Add legal entity' })).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('the add form submits the Table 1 facts and returns to the list', async () => {
  const user = userEvent.setup()
  vi.mocked(createEntity).mockResolvedValue({ ...jv, id: 'ent-3', name: 'Takoradi Port Co' })
  renderNew()

  const form = await screen.findByRole('form', { name: 'Add legal entity' })
  await user.click(within(form).getByLabelText('Name'))
  await user.paste('Takoradi Port Co')
  await user.selectOptions(within(form).getByLabelText('Relationship'), 'ASSOCIATE')
  await user.clear(within(form).getByLabelText('Economic interest (%)'))
  await user.paste('30')
  await user.click(within(form).getByLabelText('Operated by the company'))
  await user.click(within(form).getByRole('button', { name: /^add entity$/i }))

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
  expect(await screen.findByRole('heading', { name: 'Legal entities' })).toBeInTheDocument()
  expect(await screen.findByText('Takoradi Port Co added.')).toBeInTheDocument()
})

test('an economic interest above 100 gets an inline message, sends nothing and keeps the page (ticket T-24)', async () => {
  const user = userEvent.setup()
  renderNew()

  const form = await screen.findByRole('form', { name: 'Add legal entity' })
  await user.click(within(form).getByLabelText('Name'))
  await user.paste('Takoradi Port Co')
  const interest = within(form).getByLabelText('Economic interest (%)')
  await user.clear(interest)
  await user.paste('150')
  await user.click(within(form).getByRole('button', { name: /^add entity$/i }))

  expect(
    await within(form).findByText('Economic interest must be between 0 and 100.'),
  ).toBeInTheDocument()
  expect(interest).toHaveAttribute('aria-invalid', 'true')
  expect(createEntity).not.toHaveBeenCalled()
  expect(screen.getByRole('heading', { level: 1, name: 'Add legal entity' })).toBeInTheDocument()
})

test('a material gap between economic interest and legal ownership shows a note (ticket T-24)', async () => {
  const user = userEvent.setup()
  renderNew()

  const form = await screen.findByRole('form', { name: 'Add legal entity' })
  await user.clear(within(form).getByLabelText('Economic interest (%)'))
  await user.paste('60')
  await user.click(within(form).getByLabelText('Legal ownership (%)'))
  await user.paste('20')

  expect(
    await screen.findByText(/Economic interest and legal ownership differ by 40 points/),
  ).toBeInTheDocument()
})

test('the add form submits the dates, the jurisdiction and the control decision (spec 03.4)', async () => {
  const user = userEvent.setup()
  vi.mocked(createEntity).mockResolvedValue({ ...jv, id: 'ent-3', name: 'Takoradi Port Co' })
  renderNew()

  const form = await screen.findByRole('form', { name: 'Add legal entity' })
  await user.click(within(form).getByLabelText('Name'))
  await user.paste('Takoradi Port Co')
  await user.selectOptions(within(form).getByLabelText('Relationship'), 'ASSOCIATE')
  await user.selectOptions(within(form).getByLabelText('Financial control'), 'true')
  await user.click(within(form).getByLabelText('Basis of the decision'))
  await user.paste('Board control under the 2023 shareholders agreement')
  await user.type(within(form).getByLabelText('Acquired on (optional)'), '2025-07-01')
  await user.type(within(form).getByLabelText('Jurisdiction (optional)'), 'gh')
  await user.click(within(form).getByRole('button', { name: /^add entity$/i }))

  await waitFor(() =>
    expect(createEntity).toHaveBeenCalledWith(
      'org-1',
      expect.objectContaining({
        relationshipType: 'ASSOCIATE',
        financialControlOverride: true,
        controlNote: 'Board control under the 2023 shareholders agreement',
        effectiveFrom: '2025-07-01',
        jurisdiction: 'GH',
      }),
    ),
  )
})

test('a refused save prints under the field and keeps the page (spec 08)', async () => {
  const user = userEvent.setup()
  vi.mocked(createEntity).mockRejectedValue(
    new ApiError(422, {
      detail: 'The disposal is before the acquisition.',
      errors: { effectiveTo: 'The disposal is before the acquisition.' },
    }),
  )
  renderNew()

  const form = await screen.findByRole('form', { name: 'Add legal entity' })
  await user.click(within(form).getByLabelText('Name'))
  await user.paste('Adansi Logistics Ltd')
  await user.type(within(form).getByLabelText('Acquired on (optional)'), '2025-07-01')
  await user.type(within(form).getByLabelText('Disposed of on (optional)'), '2025-01-01')
  await user.click(within(form).getByRole('button', { name: /^add entity$/i }))

  expect(await screen.findByText('The disposal is before the acquisition.')).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 1, name: 'Add legal entity' })).toBeInTheDocument()
})

test('Cancel returns to the list without adding anything', async () => {
  const user = userEvent.setup()
  renderNew()

  await user.click(await screen.findByRole('button', { name: 'Cancel' }))
  expect(await screen.findByRole('heading', { name: 'Legal entities' })).toBeInTheDocument()
  expect(createEntity).not.toHaveBeenCalled()
})

test('editing the reporting company shows every field, its structure fixed, and the shares Table 1 gives', async () => {
  renderEdit('ent-1')

  expect(
    await screen.findByRole('heading', { level: 1, name: 'Edit legal entity' }),
  ).toBeInTheDocument()
  expect(screen.getByText(/^Sankofa Gold plc:/)).toBeInTheDocument()
  const form = screen.getByRole('form', { name: 'Edit legal entity' })

  // every field renders; the reporting company's structure is fixed, so those fields are read-only
  for (const label of [
    'Relationship',
    'Economic interest (%)',
    'Legal ownership (%)',
    'Operated by the company',
    'Financial control',
    'Held through',
  ]) {
    expect(within(form).getByLabelText(label)).toBeDisabled()
  }
  for (const label of [
    'Name',
    'Acquired on (optional)',
    'Disposed of on (optional)',
    'Jurisdiction (optional)',
  ]) {
    expect(within(form).getByLabelText(label)).toBeEnabled()
  }
  const shares = within(form).getByLabelText('Share under each approach')
  expect(shares).toHaveTextContent(/Equity share\s*100%/)
  expect(shares).toHaveTextContent(/Financial control\s*100%/)
  expect(shares).toHaveTextContent(/Operational control\s*100%/)
})

test('editing another entity leaves its Table 1 facts editable, saves and returns to the list', async () => {
  const user = userEvent.setup()
  vi.mocked(updateEntity).mockResolvedValue({ ...jv, economicInterestPercent: 60 })
  renderEdit('ent-2')

  const form = await screen.findByRole('form', { name: 'Edit legal entity' })
  expect(within(form).getByLabelText('Relationship')).toBeEnabled()
  expect(within(form).getByLabelText('Economic interest (%)')).toBeEnabled()
  expect(within(form).getByLabelText('Held through')).toBeEnabled()
  expect(within(form).getByLabelText('Share under each approach')).toHaveTextContent(
    /Equity share\s*40%.*Financial control\s*40%.*Operational control\s*100%/,
  )

  await user.clear(within(form).getByLabelText('Economic interest (%)'))
  await user.paste('60')
  await user.click(within(form).getByRole('button', { name: 'Save changes' }))

  await waitFor(() => expect(updateEntity).toHaveBeenCalledTimes(1))
  expect(vi.mocked(updateEntity).mock.calls[0][0]).toBe('ent-2')
  expect(vi.mocked(updateEntity).mock.calls[0][1]).toMatchObject({
    name: 'Tarkwa Gold JV Ltd',
    relationshipType: 'JOINT_VENTURE',
    economicInterestPercent: 60,
  })
  expect(await screen.findByRole('heading', { name: 'Legal entities' })).toBeInTheDocument()
  expect(await screen.findByText('Tarkwa Gold JV Ltd updated.')).toBeInTheDocument()
})

test('editing an entity that is gone offers the way back', async () => {
  renderEdit('ent-404')

  expect(await screen.findByRole('heading', { name: 'Legal entity not found' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Back to legal entities' })).toHaveAttribute(
    'href',
    '/app/ghg/org-1/entities',
  )
})
