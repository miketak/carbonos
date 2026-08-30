import { api } from '../../lib/api'
import type { SessionUser } from '../auth/api'

export interface AccessRequestInput {
  email: string
  displayName: string
  company?: string
}

export interface SetupInfo {
  email: string
  displayName: string
}

export function submitAccessRequest(input: AccessRequestInput): Promise<void> {
  return api<void>('/api/access-requests', { method: 'POST', body: JSON.stringify(input) })
}

export function getSetupInfo(token: string): Promise<SetupInfo> {
  return api<SetupInfo>(`/api/access-requests/setup/${token}`)
}

/** Sets the password and signs the new user in (session cookie). */
export function completeSetup(token: string, password: string): Promise<SessionUser> {
  return api<SessionUser>('/api/access-requests/complete', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}
