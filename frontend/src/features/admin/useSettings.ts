import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getPlatformSettings, listPlatformSettingChanges, updatePlatformSettings } from './api'
import type { PlatformSettingsInput } from './api'
import { adminSummaryKey } from './useSummary'

export const adminSettingsKey = ['admin', 'settings'] as const
export const adminSettingsHistoryKey = ['admin', 'settings', 'history'] as const

export function usePlatformSettingsQuery() {
  return useQuery({ queryKey: adminSettingsKey, queryFn: getPlatformSettings })
}

export function usePlatformSettingsHistoryQuery() {
  return useQuery({ queryKey: adminSettingsHistoryKey, queryFn: listPlatformSettingChanges })
}

export function useUpdatePlatformSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PlatformSettingsInput) => updatePlatformSettings(input),
    // the dashboard prints the policy in force, so it moves with the setting
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: adminSettingsKey }),
        queryClient.invalidateQueries({ queryKey: adminSummaryKey }),
      ]),
  })
}
