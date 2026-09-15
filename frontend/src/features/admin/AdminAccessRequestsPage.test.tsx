import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { AdminAccessRequestsPage } from './AdminAccessRequestsPage'
import type { AccessRequest } from './api'

vi.mock('./api', () => ({
  listAccessRequests: vi.fn(),
  approveAccessRequest: vi.fn(),
  denyAccessRequest: vi.fn(),
  listUsers: vi.fn(),
  getAccountsSummary: vi.fn(),
  getPlatformSummary: vi.fn(),
}))
vi.mock('../auth/api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
}))

import { approveAccessRequest, listAccessRequests } from './api'

const pending: AccessRequest = {
  id: 'r1',
  email: 'newcomer@example.com',
  displayName: 'Abena Owusu',
  company: 'Asante Gold',
  status: 'PENDING',
  createdAt: '2026-09-14T09:00:00Z',
  decidedAt: null,
}

const denied: AccessRequest = {
  id: 'r2',
  email: 'spam@example.com',
  displayName: 'Nobody',
  company: null,
  status: 'DENIED',
  createdAt: '2026-09-10T09:00:00Z',
  decidedAt: '2026-09-11T09:00:00Z',
}

beforeEach(() => {
  vi.mocked(listAccessRequests).mockReset().mockResolvedValue([pending, denied])
  vi.mocked(approveAccessRequest)
    .mockReset()
    .mockResolvedValue({ ...pending, status: 'APPROVED' })
})

function renderPage() {
  return renderWithProviders(<AdminAccessRequestsPage />, { route: '/admin/access-requests' })
}

test('the queue holds what is waiting and the record holds what was decided', async () => {
  renderPage()

  const waiting = (await screen.findByText('Abena Owusu')).closest('tr') as HTMLElement
  expect(within(waiting).getByRole('button', { name: /approve/i })).toBeInTheDocument()

  // the decided requests were already in the response and thrown away before;
  // the page is a record of who was let in and who was not (spec 01.5)
  const decided = screen.getByText('Nobody').closest('tr') as HTMLElement
  expect(decided).toHaveTextContent(/denied/i)
})

test('approving decides the request', async () => {
  const user = userEvent.setup()
  renderPage()

  const waiting = (await screen.findByText('Abena Owusu')).closest('tr') as HTMLElement
  await user.click(within(waiting).getByRole('button', { name: /approve/i }))

  await waitFor(() => expect(approveAccessRequest).toHaveBeenCalledWith('r1'))
})

test('with nothing waiting the queue says so and the record still stands', async () => {
  vi.mocked(listAccessRequests).mockResolvedValue([denied])
  renderPage()

  expect(await screen.findByText(/no pending requests/i)).toBeInTheDocument()
  expect(screen.getByText('Nobody')).toBeInTheDocument()
})
