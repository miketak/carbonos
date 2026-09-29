import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { ApiError } from '../../lib/api'
import { renderWithProviders } from '../../test/utils'
import { AdminSettingsPage } from './AdminSettingsPage'

vi.mock('./api', () => ({
  getPlatformSettings: vi.fn(),
  updatePlatformSettings: vi.fn(),
  listPlatformSettingChanges: vi.fn(),
}))
vi.mock('../auth/api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
}))

import { getPlatformSettings, listPlatformSettingChanges, updatePlatformSettings } from './api'

const settings = {
  supportAccessWindowHours: 24,
  organizationCreation: 'EVERYONE' as const,
  editionsInPublishedPeriods: 'BLOCKED' as const,
  updatedAt: '2026-09-14T09:00:00Z',
  updatedBy: null,
}

beforeEach(() => {
  vi.mocked(getPlatformSettings).mockReset().mockResolvedValue(settings)
  vi.mocked(updatePlatformSettings).mockReset().mockResolvedValue(settings)
  vi.mocked(listPlatformSettingChanges).mockReset().mockResolvedValue([])
})

function renderPage() {
  return renderWithProviders(<AdminSettingsPage />, { route: '/admin/settings' })
}

test('the form opens on the policy in force', async () => {
  renderPage()

  expect(await screen.findByLabelText(/support access lasts/i)).toHaveValue(24)
  expect(screen.getByLabelText(/who may create an organization/i)).toHaveValue('EVERYONE')
})

test('saving sends the typed policy with its reason', async () => {
  const user = userEvent.setup()
  renderPage()

  const window = await screen.findByLabelText(/support access lasts/i)
  await user.clear(window)
  await user.type(window, '2')
  await user.selectOptions(
    screen.getByLabelText(/who may create an organization/i),
    'ADMINISTRATORS',
  )
  await user.type(screen.getByLabelText(/reason for this change/i), 'tightening after the review')
  await user.click(screen.getByRole('button', { name: /save settings/i }))

  await waitFor(() =>
    expect(updatePlatformSettings).toHaveBeenCalledWith({
      supportAccessWindowHours: 2,
      organizationCreation: 'ADMINISTRATORS',
      editionsInPublishedPeriods: 'BLOCKED',
      reason: 'tightening after the review',
    }),
  )
})

test('editions inside a published period are blocked by default and can be allowed', async () => {
  const user = userEvent.setup()
  renderPage()

  const control = await screen.findByLabelText(/editions inside a published period/i)
  expect(control).toHaveValue('BLOCKED')
  expect(screen.getByRole('option', { name: 'Blocked (default)' })).toBeInTheDocument()
  expect(
    screen.getByText(/published runs keep the factors they reported with either way/i),
  ).toBeInTheDocument()
  expect(screen.getByText(/frozen and final periods always block/i)).toBeInTheDocument()

  await user.selectOptions(control, 'ALLOWED')
  expect(
    screen.getByRole('option', { name: 'Allowed: published runs keep their factors' }),
  ).toHaveProperty('selected', true)
  await user.type(screen.getByLabelText(/reason for this change/i), 'owner decision of 2026-09-29')
  await user.click(screen.getByRole('button', { name: /save settings/i }))

  await waitFor(() =>
    expect(updatePlatformSettings).toHaveBeenCalledWith({
      supportAccessWindowHours: 24,
      organizationCreation: 'EVERYONE',
      editionsInPublishedPeriods: 'ALLOWED',
      reason: 'owner decision of 2026-09-29',
    }),
  )
})

test('a change to the edition setting is listed under its own name', async () => {
  vi.mocked(listPlatformSettingChanges).mockResolvedValue([
    {
      setting: 'editionsInPublishedPeriods',
      oldValue: 'BLOCKED',
      newValue: 'ALLOWED',
      reason: 'owner decision of 2026-09-29',
      actorEmail: 'ama@ecoriv.com',
      changedAt: '2026-09-29T10:00:00Z',
    },
  ])
  renderPage()

  const row = (
    await screen.findByRole('cell', { name: 'Editions inside a published period' })
  ).closest('tr') as HTMLElement
  expect(row).toHaveTextContent('BLOCKED')
  expect(row).toHaveTextContent('ALLOWED')
  expect(row).toHaveTextContent(/owner decision of 2026-09-29/i)
})

test('a refused window shows under its own field', async () => {
  const user = userEvent.setup()
  vi.mocked(updatePlatformSettings).mockRejectedValue(
    new ApiError(422, {
      title: 'Invalid request',
      detail: 'Support access lasts between 1 and 72 hours.',
      errors: { supportAccessWindowHours: 'Support access lasts between 1 and 72 hours.' },
    }),
  )
  renderPage()

  const window = await screen.findByLabelText(/support access lasts/i)
  await user.clear(window)
  await user.type(window, '200')
  await user.type(screen.getByLabelText(/reason for this change/i), 'a very long window')
  await user.click(screen.getByRole('button', { name: /save settings/i }))

  expect(await screen.findByText(/between 1 and 72 hours/i)).toBeInTheDocument()
})

test('every change is listed with who made it and why', async () => {
  vi.mocked(listPlatformSettingChanges).mockResolvedValue([
    {
      setting: 'supportAccessWindowHours',
      oldValue: '24',
      newValue: '2',
      reason: 'tightening after the Q3 review',
      actorEmail: 'ama@ecoriv.com',
      changedAt: '2026-09-14T10:00:00Z',
    },
  ])
  renderPage()

  const row = (await screen.findByText(/support access window/i)).closest('tr') as HTMLElement
  expect(row).toHaveTextContent('24')
  expect(row).toHaveTextContent('2')
  expect(row).toHaveTextContent(/tightening after the Q3 review/i)
  expect(row).toHaveTextContent('ama@ecoriv.com')
})
