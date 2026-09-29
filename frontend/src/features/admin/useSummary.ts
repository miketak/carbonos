import { useQuery } from '@tanstack/react-query'
import { getAccountsSummary, getHelpSummary, getPlatformSummary } from './api'
import type { AccountsSummary, HelpSummary, PlatformSummary } from './api'

export const adminSummaryKey = ['admin', 'summary'] as const

export interface AdminSummary {
  accounts: AccountsSummary
  platform: PlatformSummary
  help: HelpSummary
}

/**
 * The landing figures (specs 01.5, 09). Three requests, one per backend
 * module, so no module has to learn about another: `ghg` already depends on
 * `user`, so a combined endpoint would be a dependency cycle, and `help`
 * knows nothing of either. They resolve together here, so the page has one
 * loading state.
 */
export function useAdminSummaryQuery() {
  return useQuery<AdminSummary>({
    queryKey: adminSummaryKey,
    queryFn: async () => {
      const [accounts, platform, help] = await Promise.all([
        getAccountsSummary(),
        getPlatformSummary(),
        getHelpSummary(),
      ])
      return { accounts, platform, help }
    },
    staleTime: 30_000,
  })
}
