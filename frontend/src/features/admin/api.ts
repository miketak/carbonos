import { api } from '../../lib/api'
import type { Role, SessionUser, Status } from '../auth/api'

export type User = SessionUser

export interface CreateUserInput {
  email: string
  displayName: string
  role: Role
  temporaryPassword: string
}

export interface UpdateUserInput {
  displayName: string
  role: Role
  status: Status
}

export function listUsers(): Promise<User[]> {
  return api<User[]>('/api/admin/users')
}

export function createUser(input: CreateUserInput): Promise<User> {
  return api<User>('/api/admin/users', { method: 'POST', body: JSON.stringify(input) })
}

export function updateUser(id: string, input: UpdateUserInput): Promise<User> {
  return api<User>(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(input) })
}

export function deleteUser(id: string): Promise<void> {
  return api<void>(`/api/admin/users/${id}`, { method: 'DELETE' })
}
