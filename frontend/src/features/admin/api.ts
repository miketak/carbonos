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

export type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'COMPLETED'

export interface AccessRequest {
  id: string
  email: string
  displayName: string
  company: string | null
  status: AccessRequestStatus
  createdAt: string
  decidedAt: string | null
}

export function listAccessRequests(): Promise<AccessRequest[]> {
  return api<AccessRequest[]>('/api/admin/access-requests')
}

export function approveAccessRequest(id: string): Promise<AccessRequest> {
  return api<AccessRequest>(`/api/admin/access-requests/${id}/approve`, { method: 'POST' })
}

export function denyAccessRequest(id: string): Promise<AccessRequest> {
  return api<AccessRequest>(`/api/admin/access-requests/${id}/deny`, { method: 'POST' })
}
