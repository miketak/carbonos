import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { approveAccessRequest, denyAccessRequest, listAccessRequests } from './api'
import { adminSummaryKey } from './useSummary'
import { usersQueryKey } from './useUsers'

export const accessRequestsKey = ['admin', 'access-requests'] as const

export function useAccessRequestsQuery() {
  return useQuery({ queryKey: accessRequestsKey, queryFn: listAccessRequests })
}

export function useApproveAccessRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => approveAccessRequest(id),
    // approval creates the pending account, so the users list changes too, and
    // the sidebar badge counts what is still pending (spec 01.5)
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: accessRequestsKey }),
        queryClient.invalidateQueries({ queryKey: usersQueryKey }),
        queryClient.invalidateQueries({ queryKey: adminSummaryKey }),
      ]),
  })
}

export function useDenyAccessRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => denyAccessRequest(id),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: accessRequestsKey }),
        queryClient.invalidateQueries({ queryKey: adminSummaryKey }),
      ]),
  })
}
