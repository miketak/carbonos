import { api } from '../../lib/api'

export type Role = 'ADMIN' | 'MEMBER'
export type Status = 'ACTIVE' | 'DISABLED'

export interface SessionUser {
  id: string
  email: string
  displayName: string
  role: Role
  status: Status
  createdAt: string
}

export function login(email: string, password: string): Promise<SessionUser> {
  return api<SessionUser>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function logout(): Promise<void> {
  return api<void>('/api/auth/logout', { method: 'POST' })
}

export function me(): Promise<SessionUser> {
  return api<SessionUser>('/api/auth/me')
}
