import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionQueryKey } from '../auth/useSession'
import { fetchAvatar, getProfile, updateProfile, uploadAvatar, uploadResume } from './api'
import type { Profile } from './api'

export const profileQueryKey = ['profile'] as const
export const avatarQueryKey = ['profile', 'avatar'] as const

export function useProfileQuery() {
  return useQuery({ queryKey: profileQueryKey, queryFn: getProfile })
}

/** The avatar as a Blob (null when none) — fetched, not <img src>, so the
 * session cookie always rides along and invalidation busts the cache. */
export function useAvatarQuery(enabled: boolean) {
  return useQuery({ queryKey: avatarQueryKey, queryFn: fetchAvatar, enabled, retry: false })
}

function useProfileMutation<TInput>(
  mutationFn: (input: TInput) => Promise<Profile>,
  invalidateAvatar = false,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKey, profile)
      // the header shows the session's displayName — keep it fresh
      void queryClient.invalidateQueries({ queryKey: sessionQueryKey })
      if (invalidateAvatar) void queryClient.invalidateQueries({ queryKey: avatarQueryKey })
    },
  })
}

export function useUpdateProfile() {
  return useProfileMutation(updateProfile)
}

export function useUploadAvatar() {
  return useProfileMutation(uploadAvatar, true)
}

export function useUploadResume() {
  return useProfileMutation(uploadResume)
}
