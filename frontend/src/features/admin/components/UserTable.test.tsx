import { screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../../test/utils'
import { UserTable } from './UserTable'
import type { User } from '../api'

const users: User[] = [
  {
    id: 'u1',
    email: 'admin@ecoriv.com',
    displayName: 'Ama Admin',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-08-28T00:00:00Z',
  },
  {
    id: 'u2',
    email: 'kofi@ecoriv.com',
    displayName: 'Kofi Mensah',
    role: 'MEMBER',
    status: 'DISABLED',
    createdAt: '2026-08-28T00:00:00Z',
  },
]

const handlers = {
  onEdit: vi.fn(),
  onToggleStatus: vi.fn(),
  onDelete: vi.fn(),
}

test('shows a loading skeleton while pending', () => {
  renderWithProviders(<UserTable users={undefined} isPending currentUserId="u1" {...handlers} />)
  expect(screen.getByLabelText(/loading users/i)).toBeInTheDocument()
})

test('renders rows with badges and marks the current user', () => {
  renderWithProviders(
    <UserTable users={users} isPending={false} currentUserId="u1" {...handlers} />,
  )
  expect(screen.getByText('Ama Admin')).toBeInTheDocument()
  expect(screen.getByText('kofi@ecoriv.com')).toBeInTheDocument()
  expect(screen.getByText('Admin')).toBeInTheDocument()
  expect(screen.getByText('Disabled')).toBeInTheDocument()
  expect(screen.getByText('(you)')).toBeInTheDocument()
})

test('shows an empty state when there are no users', () => {
  renderWithProviders(<UserTable users={[]} isPending={false} currentUserId="u1" {...handlers} />)
  expect(screen.getByRole('heading', { name: /no users yet/i })).toBeInTheDocument()
})
