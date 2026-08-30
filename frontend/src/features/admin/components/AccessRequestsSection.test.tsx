import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../../test/utils'
import { AccessRequestsSection } from './AccessRequestsSection'
import type { AccessRequest } from '../api'

vi.mock('../api', () => ({
  listUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  listAccessRequests: vi.fn(),
  approveAccessRequest: vi.fn(),
  denyAccessRequest: vi.fn(),
}))

import { approveAccessRequest, listAccessRequests } from '../api'

const pendingRequest: AccessRequest = {
  id: 'req-1',
  email: 'kofi.mensah@ecoghana.com',
  displayName: 'Kofi Mensah',
  company: 'EcoGhana Industries',
  status: 'PENDING',
  createdAt: '2026-08-29T10:00:00Z',
  decidedAt: null,
}

const decidedRequest: AccessRequest = {
  ...pendingRequest,
  id: 'req-2',
  email: 'abena.owusu@ecoghana.com',
  displayName: 'Abena Owusu',
  status: 'DENIED',
  decidedAt: '2026-08-29T11:00:00Z',
}

beforeEach(() => {
  vi.mocked(listAccessRequests).mockReset()
  vi.mocked(approveAccessRequest).mockReset()
})

test('lists only pending requests', async () => {
  vi.mocked(listAccessRequests).mockResolvedValue([pendingRequest, decidedRequest])
  renderWithProviders(<AccessRequestsSection />)

  expect(await screen.findByText('Kofi Mensah')).toBeInTheDocument()
  expect(screen.getByText('EcoGhana Industries')).toBeInTheDocument()
  expect(screen.queryByText('Abena Owusu')).not.toBeInTheDocument()
})

test('shows an empty state when nothing is pending', async () => {
  vi.mocked(listAccessRequests).mockResolvedValue([decidedRequest])
  renderWithProviders(<AccessRequestsSection />)
  expect(await screen.findByText(/no pending requests/i)).toBeInTheDocument()
})

test('approving calls the API for the right request', async () => {
  const user = userEvent.setup()
  vi.mocked(listAccessRequests).mockResolvedValue([pendingRequest])
  vi.mocked(approveAccessRequest).mockResolvedValue({ ...pendingRequest, status: 'APPROVED' })
  renderWithProviders(<AccessRequestsSection />)

  await user.click(await screen.findByRole('button', { name: /approve/i }))
  expect(vi.mocked(approveAccessRequest)).toHaveBeenCalledWith('req-1')
})
