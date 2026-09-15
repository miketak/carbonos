import { useQuery } from '@tanstack/react-query'
import { getAccountsSummary, getPlatformSummary } from './api'
import type { AccountsSummary, PlatformSummary } from './api'

export const adminSummaryKey = ['admin', 'summary'] as const

export interface AdminSummary {
  accounts: AccountsSummary
  platform: PlatformSummary
}

/**
 * The landing figures (spec 01.5). Two requests, one per backend module, so
 * neither module has to learn about the other: `ghg` already depends on
 * `user`, so a combined endpoint would be a dependency cycle. They resolve
 * together here, so the page has one loading state.
 */
export function useAdminSummaryQuery() {
  return useQuery<AdminSummary>({
    queryKey: adminSummaryKey,
    queryFn: async () => {
      const [accounts, platform] = await Promise.all([getAccountsSummary(), getPlatformSummary()])
      return { accounts, platform }
    },
    staleTime: 30_000,
  })
}
