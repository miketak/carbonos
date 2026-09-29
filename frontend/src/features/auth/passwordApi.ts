import { api } from '../../lib/api'

/** The rule the server applies wherever a password is set (spec 01.2, `PasswordPolicy.RULE`). */
export const PASSWORD_RULE = 'At least 12 characters, with a letter and a digit.'

export function meetsPasswordPolicy(password: string): boolean {
  return /^(?=.*[A-Za-z])(?=.*\d).{12,72}$/.test(password)
}

export interface PasswordResetInfo {
  email: string
}

/** Spec 01.9: 202 whether or not the address has an account. */
export function requestPasswordReset(email: string): Promise<void> {
  return api<void>('/api/auth/password-reset', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function getPasswordResetInfo(token: string): Promise<PasswordResetInfo> {
  return api<PasswordResetInfo>(`/api/auth/password-reset/${encodeURIComponent(token)}`)
}

/** Sets the new password; every session of the account ends, so the holder signs in afresh. */
export function completePasswordReset(token: string, password: string): Promise<void> {
  return api<void>('/api/auth/password-reset/complete', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}
