import { api, apiBlob, ApiError } from '../../lib/api'

export interface Profile {
  id: string
  email: string
  displayName: string
  hasAvatar: boolean
}

export function getProfile(): Promise<Profile> {
  return api<Profile>('/api/profile')
}

export function updateProfile(input: { displayName: string }): Promise<Profile> {
  return api<Profile>('/api/profile', { method: 'PUT', body: JSON.stringify(input) })
}

/** Spec 01.9: 204 on success; a wrong current password is a 422 on `currentPassword`. */
export function changePassword(input: {
  currentPassword: string
  newPassword: string
}): Promise<void> {
  return api<void>('/api/profile/password', { method: 'PUT', body: JSON.stringify(input) })
}

function upload(path: string, file: File): Promise<Profile> {
  const body = new FormData()
  body.append('file', file)
  return api<Profile>(path, { method: 'PUT', body })
}

export function uploadAvatar(file: File): Promise<Profile> {
  return upload('/api/profile/avatar', file)
}

/** The stored avatar image, or null when none has been uploaded yet. */
export async function fetchAvatar(): Promise<Blob | null> {
  try {
    return await apiBlob('/api/profile/avatar')
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}
