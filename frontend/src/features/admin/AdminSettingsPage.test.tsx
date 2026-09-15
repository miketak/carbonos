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
      reason: 'tightening after the review',
    }),
  )
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
