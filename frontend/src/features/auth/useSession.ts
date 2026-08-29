import { useQuery } from '@tanstack/react-query'
import { ApiError } from '../../lib/api'
import { me } from './api'
import type { SessionUser } from './api'

export const sessionQueryKey = ['auth', 'session'] as const

/** The signed-in user, or null when there is no valid session. */
export function useSession() {
  return useQuery<SessionUser | null>({
    queryKey: sessionQueryKey,
    queryFn: async () => {
      try {
        return await me()
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null
        throw error
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
