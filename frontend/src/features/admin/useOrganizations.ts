import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assumeSupportAccess, endSupportAccess, listAdminOrganizations } from './api'

export const adminOrganizationsKey = ['admin', 'organizations'] as const

/** Every organization on the platform, for support staff to find one (spec 01.3). */
export function useAdminOrganizationsQuery() {
  return useQuery({ queryKey: adminOrganizationsKey, queryFn: listAdminOrganizations })
}

export function useAssumeSupportAccess() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ organizationId, reason }: { organizationId: string; reason: string }) =>
      assumeSupportAccess(organizationId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminOrganizationsKey })
      void queryClient.invalidateQueries({ queryKey: ['ghg'] })
    },
  })
}

export function useEndSupportAccess() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (organizationId: string) => endSupportAccess(organizationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminOrganizationsKey })
      void queryClient.invalidateQueries({ queryKey: ['ghg'] })
    },
  })
}
