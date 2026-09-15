import { screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../../test/utils'
import { SupportAccessBanner } from './SupportAccessBanner'
import type { Organization } from '../api'

vi.mock('../../auth/api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
}))

import { me } from '../../auth/api'

const organization = (myRole: Organization['myRole']) =>
  ({
    id: 'org-1',
    name: 'Asante Gold Resources',
    myRole,
    facilityCount: 2,
    supportAccess: [
      {
        adminEmail: 'support@ecoriv.com',
        grantedAt: '2026-09-14T08:00:00Z',
        expiresAt: '2026-09-14T10:00:00Z',
        reason: 'restoring a stuck run',
      },
    ],
  }) as unknown as Organization

beforeEach(() => {
  vi.mocked(me).mockReset().mockResolvedValue({
    id: 'u1',
    email: 'support@ecoriv.com',
    displayName: 'Ama Admin',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-08-28T00:00:00Z',
  })
})

test('an administrator under support access is told so, with the expiry', async () => {
  renderWithProviders(<SupportAccessBanner organization={organization('ADMIN')} />)

  const banner = await screen.findByRole('status')
  expect(banner).toHaveTextContent(/Asante Gold Resources under support access until/i)
  expect(banner).toHaveTextContent(/recorded in this organization\u2019s history/i)
})

test.each(['OWNER', 'REVIEWER', 'PREPARER', 'VERIFIER', null] as const)(
  'nothing is shown for %s',
  (role) => {
    renderWithProviders(<SupportAccessBanner organization={organization(role)} />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  },
)
